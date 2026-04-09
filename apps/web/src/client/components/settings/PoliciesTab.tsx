import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAccomplish } from '@/lib/accomplish';
import type { FileOperationPolicyMode } from '@accomplish_ai/agent-core';
import { PoliciesLockSection } from './policies/PoliciesLockSection';

const MODES: { value: FileOperationPolicyMode; labelKey: string; descKey: string }[] = [
  {
    value: 'inherit',
    labelKey: 'policies.modes.inherit.label',
    descKey: 'policies.modes.inherit.desc',
  },
  {
    value: 'create_copy_only',
    labelKey: 'policies.modes.restricted.label',
    descKey: 'policies.modes.restricted.desc',
  },
  { value: 'standard', labelKey: 'policies.modes.full.label', descKey: 'policies.modes.full.desc' },
];

export function PoliciesTab() {
  const { t } = useTranslation('settings');
  const [mode, setMode] = useState<FileOperationPolicyMode>('inherit');
  const [effective, setEffective] = useState<'standard' | 'create_copy_only'>('create_copy_only');
  const [lockConfigured, setLockConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [policyPassword, setPolicyPassword] = useState('');

  // getAccomplish() returns a new object each call — do not put it in hook deps or useEffect will loop.
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getAccomplish().policyGetState();
      setMode(s.mode);
      setEffective(s.effective);
      setLockConfigured(s.lockConfigured);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveMode = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await getAccomplish().policySetMode({
        mode,
        currentPassword: lockConfigured ? policyPassword : undefined,
      });
      setSuccess(t('policies.saved'));
      setPolicyPassword('');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('policies.loading')}</p>;
  }

  return (
    <div className="space-y-8 max-w-xl">
      <p className="text-sm text-muted-foreground">{t('policies.intro')}</p>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          {t('policies.effectiveNow')}
        </p>
        <p className="text-sm font-medium">
          {effective === 'create_copy_only'
            ? t('policies.effective.restricted')
            : t('policies.effective.full')}
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base">{t('policies.filePolicy')}</Label>
        <div className="space-y-3">
          {MODES.map((m) => (
            <label
              key={m.value}
              className="flex cursor-pointer gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="file-policy"
                className="mt-1"
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              <span>
                <span className="font-medium block">{t(m.labelKey)}</span>
                <span className="text-sm text-muted-foreground">{t(m.descKey)}</span>
              </span>
            </label>
          ))}
        </div>
        {lockConfigured && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="policy-pw">{t('policies.currentPassword')}</Label>
            <Input
              id="policy-pw"
              type="password"
              autoComplete="current-password"
              value={policyPassword}
              onChange={(e) => setPolicyPassword(e.target.value)}
              placeholder={t('policies.passwordPlaceholder')}
            />
          </div>
        )}
        <Button onClick={() => void saveMode()} disabled={saving}>
          {saving ? t('policies.saving') : t('policies.savePolicy')}
        </Button>
      </div>

      <PoliciesLockSection lockConfigured={lockConfigured} onChanged={refresh} />

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}
    </div>
  );
}
