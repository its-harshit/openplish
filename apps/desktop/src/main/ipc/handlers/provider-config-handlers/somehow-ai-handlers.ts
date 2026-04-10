/**
 * SomeHow built-in free-tier IPC handlers.
 *
 * These handlers bridge the renderer's somehow-ai IPC calls to the daemon
 * via JSON-RPC. The daemon owns the proxy and identity — these handlers
 * just delegate and manage provider persistence in storage.
 */

import type { IpcMainInvokeEvent } from 'electron';
import type { CreditUsage, AccomplishAiCredentials } from '@somehow_ai/agent-core';
import { getStorage } from '../../../store/storage';
import { getDaemonClient } from '../../../daemon-bootstrap';
import { getLogCollector } from '../../../logging';

type AccomplishConnectRpcResult = { deviceFingerprint: string; usage: CreditUsage | null };

type HandleFn = <Args extends unknown[], ReturnType = unknown>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: Args) => ReturnType,
) => void;

const RUNTIME_UNAVAILABLE_MSG =
  'Free tier is not available in this build. Please use the official SomeHow release or connect your own API key.';

/** Normalize runtime-unavailable errors to a user-friendly message. */
function normalizeRuntimeError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('accomplish_runtime_unavailable')) {
    throw new Error(RUNTIME_UNAVAILABLE_MSG);
  }
  throw err;
}

function log(level: 'INFO' | 'WARN' | 'ERROR', msg: string) {
  try {
    getLogCollector()?.log(level, 'main' as const, `[somehow-ai] ${msg}`);
  } catch {
    /* best-effort */
  }
}

export function registerAccomplishAiHandlers(handle: HandleFn): void {
  handle('somehow-ai:connect', async () => {
    let result: AccomplishConnectRpcResult;
    try {
      const client = getDaemonClient();
      result = await client.call('somehow-ai.connect');
    } catch (err) {
      normalizeRuntimeError(err);
    }

    const storage = getStorage();
    const credentials: AccomplishAiCredentials = {
      type: 'somehow-ai',
      deviceFingerprint: result.deviceFingerprint,
    };

    storage.setConnectedProvider('somehow-ai', {
      providerId: 'somehow-ai',
      connectionStatus: 'connected',
      selectedModelId: 'somehow-ai/somehow-free',
      credentials,
      lastConnectedAt: new Date().toISOString(),
    });

    // Cache credits if available
    if (result.usage) {
      storage.saveAccomplishAiCredits(result.usage);
    }

    log('INFO', `Connected with fingerprint ${result.deviceFingerprint.substring(0, 8)}...`);

    return {
      deviceFingerprint: result.deviceFingerprint,
      ...(result.usage ?? { spentCredits: 0, remainingCredits: 0, totalCredits: 0, resetsAt: '' }),
    };
  });

  handle('somehow-ai:ensure-ready', async () => {
    const storage = getStorage();
    const existing = storage.getConnectedProvider('somehow-ai');
    if (existing?.connectionStatus === 'connected') {
      return {
        deviceFingerprint: (existing.credentials as AccomplishAiCredentials).deviceFingerprint,
      };
    }

    // Not connected yet — connect without stealing active model
    let result: AccomplishConnectRpcResult;
    try {
      const client = getDaemonClient();
      result = await client.call('somehow-ai.connect');
    } catch (err) {
      normalizeRuntimeError(err);
    }

    const credentials: AccomplishAiCredentials = {
      type: 'somehow-ai',
      deviceFingerprint: result.deviceFingerprint,
    };

    storage.setConnectedProvider('somehow-ai', {
      providerId: 'somehow-ai',
      connectionStatus: 'connected',
      selectedModelId: 'somehow-ai/somehow-free',
      credentials,
      lastConnectedAt: new Date().toISOString(),
    });

    // Don't set as active if user already has a ready provider
    if (!storage.hasReadyProvider()) {
      storage.setActiveProvider('somehow-ai');
    }

    if (result.usage) {
      storage.saveAccomplishAiCredits(result.usage);
    }

    return { deviceFingerprint: result.deviceFingerprint };
  });

  handle('somehow-ai:disconnect', async () => {
    try {
      const client = getDaemonClient();
      await client.call('somehow-ai.disconnect');
    } catch (err) {
      log('WARN', `Daemon disconnect failed: ${String(err)}`);
    }

    const storage = getStorage();
    storage.removeConnectedProvider('somehow-ai');
    // Credits are cleared automatically by removeConnectedProvider
  });

  handle('somehow-ai:get-usage', async () => {
    const storage = getStorage();

    /** Attempt to fetch live usage, with one reconnect retry on identity-missing */
    async function fetchLiveUsage(): Promise<CreditUsage> {
      const client = getDaemonClient();
      return client.call('somehow-ai.get-usage');
    }

    /** Reconnect daemon identity if it was lost (daemon restart) */
    async function reconnectAndRetry(): Promise<CreditUsage | null> {
      const provider = storage.getConnectedProvider('somehow-ai');
      if (provider?.connectionStatus !== 'connected') {
        return null;
      }

      try {
        log('INFO', 'Daemon identity lost — reconnecting');
        const client = getDaemonClient();
        const connectResult = await client.call('somehow-ai.connect');

        // If connect returned usage (including exhausted state), use it directly
        if (connectResult.usage) {
          return connectResult.usage;
        }

        // Otherwise try live fetch
        return await fetchLiveUsage();
      } catch {
        return null;
      }
    }

    try {
      const live = await fetchLiveUsage();
      // If proxy hasn't connected yet (all zeros), fall back to cache
      if (live.totalCredits === 0) {
        return storage.getAccomplishAiCredits() ?? live;
      }
      storage.saveAccomplishAiCredits(live);
      return live;
    } catch {
      // First failure — try reconnecting (daemon may have restarted, identity cache empty)
      const retried = await reconnectAndRetry();
      if (retried) {
        if (retried.totalCredits > 0) {
          storage.saveAccomplishAiCredits(retried);
        }
        return retried;
      }

      // All attempts failed — return cached
      return (
        storage.getAccomplishAiCredits() ?? {
          spentCredits: 0,
          remainingCredits: 0,
          totalCredits: 0,
          resetsAt: '',
        }
      );
    }
  });

  handle('somehow-ai:get-status', async () => {
    const storage = getStorage();
    const provider = storage.getConnectedProvider('somehow-ai');
    return { connected: provider?.connectionStatus === 'connected' };
  });
}
