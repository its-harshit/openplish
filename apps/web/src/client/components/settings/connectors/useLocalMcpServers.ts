import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocalMcpServer } from '@somehow_ai/agent-core';
import { createLogger } from '@/lib/logger';
import { getOptionalWindowBridge } from '@/lib/somehow';

const logger = createLogger('LocalMcpServers');

export function useLocalMcpServers() {
  const { t } = useTranslation('settings');
  const [servers, setServers] = useState<LocalMcpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [commandJson, setCommandJson] = useState('["npx", "-y", "@example/mcp"]');
  const [environmentJson, setEnvironmentJson] = useState('');
  const [cwd, setCwd] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const w = getOptionalWindowBridge();
    if (!w?.getLocalMcpServers) {
      setLoading(false);
      return;
    }
    try {
      const list = await w.getLocalMcpServers();
      setServers(list);
    } catch (err) {
      logger.error('Failed to list local MCP servers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = useCallback(async () => {
    const w = getOptionalWindowBridge();
    if (!w?.addLocalMcpServer) {
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const env = environmentJson.trim() === '' ? undefined : environmentJson;
      const cwdVal = cwd.trim() === '' ? undefined : cwd;
      await w.addLocalMcpServer(name.trim(), commandJson.trim(), env, cwdVal);
      setName('');
      setCommandJson('["npx", "-y", "@example/mcp"]');
      setEnvironmentJson('');
      setCwd('');
      await load();
    } catch (err) {
      logger.error('Failed to add local MCP server', err);
      const raw = err instanceof Error ? err.message : t('connectors.localMcp.addFailed');
      setError(raw.replace(/^Error invoking remote method '[^']+': (\w+Error: )?/, ''));
    } finally {
      setAdding(false);
    }
  }, [name, commandJson, environmentJson, cwd, load, t]);

  const deleteServer = useCallback(
    async (id: string) => {
      const w = getOptionalWindowBridge();
      if (!w?.deleteLocalMcpServer) {
        return;
      }
      try {
        await w.deleteLocalMcpServer(id);
        await load();
      } catch (err) {
        logger.error('Failed to delete local MCP server', err);
      }
    },
    [load],
  );

  const toggleEnabled = useCallback(
    async (id: string, enabled: boolean) => {
      const w = getOptionalWindowBridge();
      if (!w?.setLocalMcpServerEnabled) {
        return;
      }
      try {
        await w.setLocalMcpServerEnabled(id, enabled);
        await load();
      } catch (err) {
        logger.error('Failed to toggle local MCP server', err);
      }
    },
    [load],
  );

  return {
    servers,
    loading,
    name,
    commandJson,
    environmentJson,
    cwd,
    adding,
    error,
    setName,
    setCommandJson,
    setEnvironmentJson,
    setCwd,
    handleAdd,
    deleteServer,
    toggleEnabled,
    reload: load,
  };
}
