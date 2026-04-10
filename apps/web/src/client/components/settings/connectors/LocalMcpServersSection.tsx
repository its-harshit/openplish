import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plugs } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { LocalMcpServer } from '@somehow_ai/agent-core';
import { useLocalMcpServers } from './useLocalMcpServers';

function LocalMcpRow({
  server,
  onToggle,
  onDelete,
}: {
  server: LocalMcpServer;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation('settings');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) {
      return;
    }
    const timer = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  const cmdPreview = server.command.join(' ');
  const truncated = cmdPreview.length > 80 ? `${cmdPreview.slice(0, 80)}…` : cmdPreview;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Plugs className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{server.name}</span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground break-all">{truncated}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            checked={server.isEnabled}
            onCheckedChange={(v) => onToggle(server.id, v)}
            aria-label={server.isEnabled ? t('connectors.disable') : t('connectors.enable')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-destructive"
            onClick={() => {
              if (confirmDelete) {
                onDelete(server.id);
                setConfirmDelete(false);
              } else {
                setConfirmDelete(true);
              }
            }}
            title={confirmDelete ? t('connectors.confirmDelete') : t('connectors.delete')}
          >
            {confirmDelete ? t('connectors.confirmDelete') : t('connectors.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LocalMcpServersSection() {
  const { t } = useTranslation('settings');
  const {
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
  } = useLocalMcpServers();

  if (!window.accomplish?.getLocalMcpServers) {
    return null;
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">{t('connectors.localMcp.loading')}</div>;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/30 p-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">{t('connectors.localMcp.title')}</h3>
        <p className="text-xs text-muted-foreground">{t('connectors.localMcp.description')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Input
          placeholder={t('connectors.localMcp.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder={t('connectors.localMcp.commandPlaceholder')}
          value={commandJson}
          onChange={(e) => setCommandJson(e.target.value)}
          className="min-h-[72px] font-mono text-xs"
        />
        <Textarea
          placeholder={t('connectors.localMcp.envPlaceholder')}
          value={environmentJson}
          onChange={(e) => setEnvironmentJson(e.target.value)}
          className="min-h-[52px] font-mono text-xs"
        />
        <Input
          placeholder={t('connectors.localMcp.cwdPlaceholder')}
          value={cwd}
          onChange={(e) => setCwd(e.target.value)}
          className="font-mono text-xs"
        />
        <Button
          type="button"
          size="sm"
          disabled={adding || !name.trim()}
          onClick={() => void handleAdd()}
        >
          {adding ? t('connectors.localMcp.adding') : t('connectors.localMcp.add')}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {servers.length > 0 ? (
        <div className="flex flex-col gap-2">
          {servers.map((s) => (
            <LocalMcpRow key={s.id} server={s} onToggle={toggleEnabled} onDelete={deleteServer} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('connectors.localMcp.empty')}</p>
      )}
    </div>
  );
}
