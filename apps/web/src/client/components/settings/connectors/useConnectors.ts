import { useState, useCallback, useEffect } from 'react';
import type { McpConnector } from '@somehow_ai/agent-core/common';
import { getSomehow } from '@/lib/somehow';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useConnectors');

export interface SlackMcpAuthState {
  connected: boolean;
  pendingAuthorization: boolean;
}

export function useConnectors() {
  const [connectors, setConnectors] = useState<McpConnector[]>([]);
  const [slackAuth, setSlackAuth] = useState<SlackMcpAuthState>({
    connected: false,
    pendingAuthorization: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    const somehow = getSomehow();
    try {
      const [connectorsResult, slackStatusResult] = await Promise.allSettled([
        somehow.getConnectors(),
        somehow.getSlackMcpOauthStatus(),
      ]);

      if (connectorsResult.status === 'fulfilled') {
        setConnectors(connectorsResult.value);
      }

      if (slackStatusResult.status === 'fulfilled') {
        setSlackAuth(slackStatusResult.value);
      }

      if (connectorsResult.status === 'rejected' && slackStatusResult.status === 'rejected') {
        throw connectorsResult.reason;
      }

      setError(null);
    } catch (err) {
      logger.error('Failed to load connectors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const addConnector = useCallback(async (name: string, url: string) => {
    const somehow = getSomehow();
    const connector = await somehow.addConnector(name, url);
    setConnectors((prev) => [connector, ...prev]);
    return connector;
  }, []);

  const deleteConnector = useCallback(async (id: string) => {
    const somehow = getSomehow();
    await somehow.deleteConnector(id);
    setConnectors((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const toggleEnabled = useCallback(
    async (id: string) => {
      const connector = connectors.find((c) => c.id === id);
      if (!connector) return;

      const somehow = getSomehow();
      await somehow.setConnectorEnabled(id, !connector.isEnabled);
      setConnectors((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c)),
      );
    },
    [connectors],
  );

  const startOAuth = useCallback(async (connectorId: string) => {
    setConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? { ...c, status: 'connecting' as const } : c)),
    );

    try {
      const somehow = getSomehow();
      return await somehow.startConnectorOAuth(connectorId);
    } catch (err) {
      setConnectors((prev) =>
        prev.map((c) => (c.id === connectorId ? { ...c, status: 'error' as const } : c)),
      );
      throw err;
    }
  }, []);

  const completeOAuth = useCallback(async (state: string, code: string) => {
    const somehow = getSomehow();
    const updated = await somehow.completeConnectorOAuth(state, code);
    if (updated) {
      setConnectors((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
    return updated;
  }, []);

  const disconnect = useCallback(async (connectorId: string) => {
    const somehow = getSomehow();
    await somehow.disconnectConnector(connectorId);
    setConnectors((prev) =>
      prev.map((c) => (c.id === connectorId ? { ...c, status: 'disconnected' as const } : c)),
    );
  }, []);

  const authenticateSlack = useCallback(async () => {
    const somehow = getSomehow();

    setSlackAuth(() => ({
      connected: false,
      pendingAuthorization: true,
    }));

    try {
      if (slackAuth.pendingAuthorization) {
        await somehow.logoutSlackMcp();
      }

      await somehow.loginSlackMcp();
      const status = await somehow.getSlackMcpOauthStatus();
      setSlackAuth(status);
      return status;
    } catch (err) {
      try {
        const status = await somehow.getSlackMcpOauthStatus();
        setSlackAuth(status);
      } catch {
        setSlackAuth({ connected: false, pendingAuthorization: false });
      }
      throw err;
    }
  }, [slackAuth.pendingAuthorization]);

  const disconnectSlack = useCallback(async () => {
    const somehow = getSomehow();
    await somehow.logoutSlackMcp();
    setSlackAuth({ connected: false, pendingAuthorization: false });
  }, []);

  return {
    connectors,
    slackAuth,
    loading,
    error,
    addConnector,
    deleteConnector,
    toggleEnabled,
    startOAuth,
    completeOAuth,
    disconnect,
    authenticateSlack,
    disconnectSlack,
    refetch: fetchConnectors,
  };
}
