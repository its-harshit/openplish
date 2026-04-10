import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSomehow } from '../lib/somehow';
import { isProviderReady, type ProviderId } from '@somehow_ai/agent-core/common';
import type { CreditUsage } from '@somehow_ai/agent-core/common';

export type { CreditUsage };

export function getCreditStatusColor(usage: CreditUsage): string {
  if (usage.remainingCredits <= 0) {
    return 'bg-destructive';
  }
  const pct = usage.totalCredits > 0 ? (usage.spentCredits / usage.totalCredits) * 100 : 0;
  if (pct < 60) {
    return 'bg-success';
  }
  if (pct < 85) {
    return 'bg-saffron';
  }
  return 'bg-destructive';
}

export function useCreditsState() {
  const accomplish = useMemo(() => getSomehow(), []);

  const [usage, setUsage] = useState<CreditUsage | null>(null);
  const [isCreditsBlocked, setIsCreditsBlocked] = useState(false);
  const [hasAlternativeReadyProvider, setHasAlternativeReadyProvider] = useState(false);
  const [showQuotaInline, setShowQuotaInline] = useState(false);

  type ProviderSettingsSnapshot = Awaited<ReturnType<typeof accomplish.getProviderSettings>>;

  const applyLiveUsage = useCallback(
    (settings: ProviderSettingsSnapshot, liveUsage: CreditUsage): boolean => {
      const connectedAccomplish = settings.connectedProviders['somehow-ai'];
      const readyAlternativeExists = (
        Object.keys(settings.connectedProviders) as ProviderId[]
      ).some(
        (providerId) =>
          providerId !== 'somehow-ai' && isProviderReady(settings.connectedProviders[providerId]),
      );
      setHasAlternativeReadyProvider(readyAlternativeExists);

      if (connectedAccomplish?.connectionStatus !== 'connected') {
        setUsage(null);
        setIsCreditsBlocked(false);
        setShowQuotaInline(false);
        return false;
      }

      const isExhausted = liveUsage.remainingCredits <= 0;
      const shouldBlock =
        settings.activeProviderId === 'somehow-ai' &&
        isProviderReady(connectedAccomplish) &&
        isExhausted;

      setUsage(liveUsage);
      setIsCreditsBlocked(shouldBlock);

      if (!shouldBlock) {
        setShowQuotaInline(false);
      }
      return shouldBlock;
    },
    [],
  );

  const refreshCreditsState = useCallback(async (): Promise<boolean> => {
    try {
      const settings = await accomplish.getProviderSettings();
      const connectedAccomplish = settings.connectedProviders['somehow-ai'];
      if (connectedAccomplish?.connectionStatus !== 'connected') {
        const readyAlternativeExists = (
          Object.keys(settings.connectedProviders) as ProviderId[]
        ).some(
          (providerId) =>
            providerId !== 'somehow-ai' && isProviderReady(settings.connectedProviders[providerId]),
        );
        setHasAlternativeReadyProvider(readyAlternativeExists);
        setUsage(null);
        setIsCreditsBlocked(false);
        setShowQuotaInline(false);
        return false;
      }
      const liveUsage = await accomplish.somehowAiGetUsage();
      return applyLiveUsage(settings, liveUsage);
    } catch {
      setHasAlternativeReadyProvider(false);
      setUsage(null);
      setIsCreditsBlocked(false);
      setShowQuotaInline(false);
      return false;
    }
  }, [accomplish, applyLiveUsage]);

  const openQuotaBlockExperience = useCallback(() => {
    setShowQuotaInline(true);
  }, []);

  // Initial fetch — inline to avoid ESLint set-state-in-effect warning
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [usageData, settings] = await Promise.all([
          accomplish.somehowAiGetUsage?.(),
          accomplish.getProviderSettings(),
        ]);
        if (cancelled || !usageData) return;
        applyLiveUsage(settings, usageData);
      } catch {
        // Built-in free tier not connected — no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accomplish, applyLiveUsage]);

  // Subscribe to live usage updates
  useEffect(() => {
    const unsubscribe = accomplish.onSomehowAiUsageUpdate?.((liveUsage) => {
      void (async () => {
        try {
          const settings = await accomplish.getProviderSettings();
          applyLiveUsage(settings, liveUsage);
        } catch {
          setHasAlternativeReadyProvider(false);
          setUsage(null);
          setIsCreditsBlocked(false);
          setShowQuotaInline(false);
        }
      })();
    });

    return () => {
      unsubscribe?.();
    };
  }, [accomplish, applyLiveUsage]);

  return {
    usage,
    isCreditsBlocked,
    hasAlternativeReadyProvider,
    showQuotaInline,
    setShowQuotaInline,
    refreshCreditsState,
    openQuotaBlockExperience,
  };
}
