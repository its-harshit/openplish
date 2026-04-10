/**
 * Global daemon connection state store.
 *
 * Provides daemon status visible from anywhere in the app — sidebar dot,
 * connection toast, execution page, settings. Subscribes to daemon IPC
 * events at module level (same pattern as task-subscriptions.ts).
 */

import { create } from 'zustand';
import { getOptionalWindowBridge } from '../lib/somehow';

export type DaemonStatus =
  | 'connected'
  | 'starting'
  | 'stopping'
  | 'stopped'
  | 'disconnected'
  | 'reconnecting'
  | 'reconnect-failed';

interface DaemonState {
  status: DaemonStatus;
  /** Whether the user dismissed the disconnection toast */
  toastDismissed: boolean;
  setStatus: (status: DaemonStatus) => void;
  dismissToast: () => void;
}

export const useDaemonStore = create<DaemonState>((set) => ({
  status: 'connected', // Assume connected on boot (bootstrapDaemon runs before UI)
  toastDismissed: false,
  setStatus: (status) => {
    set({
      status,
      // Reset toast dismissed when status changes to a problem state
      ...(status === 'disconnected' || status === 'reconnect-failed'
        ? { toastDismissed: false }
        : {}),
    });
  },
  dismissToast: () => {
    set({ toastDismissed: true });
  },
}));

// ── IPC Event Subscriptions ──────────────────────────────────────────────────
// Registered at module level so they fire regardless of which component is mounted.

function registerDaemonSubscriptions(): void {
  const bridge = getOptionalWindowBridge();
  if (!bridge) {
    return;
  }

  const { setStatus } = useDaemonStore.getState();

  bridge.onDaemonDisconnected(() => {
    useDaemonStore.getState().setStatus('disconnected');
  });

  bridge.onDaemonReconnected(() => {
    useDaemonStore.getState().setStatus('connected');
  });

  if (bridge.onDaemonReconnectFailed) {
    bridge.onDaemonReconnectFailed(() => {
      useDaemonStore.getState().setStatus('reconnect-failed');
    });
  }

  // Initial status check
  bridge
    .daemonPing()
    .then((result) => {
      if (result.status === 'ok') {
        setStatus('connected');
      } else {
        setStatus('stopped');
      }
    })
    .catch(() => {
      setStatus('stopped');
    });
}

registerDaemonSubscriptions();
