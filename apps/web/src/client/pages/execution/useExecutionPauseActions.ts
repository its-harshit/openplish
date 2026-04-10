import { useCallback, useMemo } from 'react';
import { hasAnyReadyProvider, getOAuthProviderDisplayName } from '@somehow_ai/agent-core/common';
import type { useExecutionCore } from './useExecutionCore';

type CoreState = ReturnType<typeof useExecutionCore>;

export function useExecutionPauseActions(s: CoreState) {
  const { bridge, t } = s;

  const resumePausedTask = useCallback(
    async (message: string): Promise<boolean> => {
      const isE2EMode = await bridge.isE2EMode();
      if (!isE2EMode) {
        const settings = await bridge.getProviderSettings();
        if (!hasAnyReadyProvider(settings)) {
          s.setPendingFollowUp(message);
          s.setSettingsInitialTab('providers');
          s.setShowSettingsDialog(true);
          return false;
        }
      }
      return await s.sendFollowUp(message, []);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- s is a stable hook result; individual actions are listed
    [
      bridge,
      s.setPendingFollowUp,
      s.setSettingsInitialTab,
      s.setShowSettingsDialog,
      s.sendFollowUp,
    ],
  );

  const handleContinue = useCallback(async () => {
    return await resumePausedTask('continue');
  }, [resumePausedTask]);

  const { pauseAction, setTaskActionError, setIsTaskActionRunning } = s;

  const handlePauseAction = useCallback(async () => {
    if (!pauseAction || pauseAction.type !== 'oauth-connect') {
      return;
    }
    const providerName = getOAuthProviderDisplayName(pauseAction.providerId);
    setTaskActionError(null);
    setIsTaskActionRunning(true);
    try {
      // Slack MCP is currently the only supported oauth-connect provider.
      const status = await bridge.getSlackMcpOauthStatus();
      if (status.pendingAuthorization) {
        await bridge.logoutSlackMcp();
      }
      if (!status.connected) {
        await bridge.loginSlackMcp();
      }
      const refreshed = await bridge.getSlackMcpOauthStatus();
      if (!refreshed.connected) {
        throw new Error(t('questionPrompt.oauthStillDisconnected', { provider: providerName }));
      }
      return await resumePausedTask(pauseAction.successText ?? `${providerName} is connected.`);
    } catch (error) {
      setTaskActionError(
        error instanceof Error
          ? error.message
          : t('questionPrompt.oauthFailed', { provider: providerName }),
      );
      return false;
    } finally {
      setIsTaskActionRunning(false);
    }
  }, [bridge, t, resumePausedTask, pauseAction, setTaskActionError, setIsTaskActionRunning]);

  const handleTaskAction = useMemo(
    () => (s.isConnectorAuthPause ? handlePauseAction : handleContinue),
    [s.isConnectorAuthPause, handlePauseAction, handleContinue],
  );

  return { handleContinue, handlePauseAction, handleTaskAction, resumePausedTask };
}
