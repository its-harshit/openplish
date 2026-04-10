import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSomehow } from '@/lib/somehow';

interface PoliciesLockSectionProps {
  lockConfigured: boolean;
  onChanged: () => Promise<void>;
}

export function PoliciesLockSection({ lockConfigured, onChanged }: PoliciesLockSectionProps) {
  const { t } = useTranslation('settings');
  const accomplish = getSomehow();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [changeNew, setChangeNew] = useState('');
  const [changeConfirm, setChangeConfirm] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const setInitialPassword = () => {
    if (newPw.length < 8 || newPw !== confirmPw) {
      setError(t('policies.passwordMismatch'));
      return;
    }
    void run(async () => {
      await accomplish.policySetInitialPassword(newPw);
      setSuccess(t('policies.passwordSet'));
      setNewPw('');
      setConfirmPw('');
    });
  };

  const changePassword = () => {
    if (changeNew.length < 8 || changeNew !== changeConfirm) {
      setError(t('policies.passwordMismatch'));
      return;
    }
    void run(async () => {
      await accomplish.policyChangePassword({
        currentPassword: currentPw,
        newPassword: changeNew,
      });
      setSuccess(t('policies.passwordChanged'));
      setCurrentPw('');
      setChangeNew('');
      setChangeConfirm('');
    });
  };

  const clearPassword = () => {
    void run(async () => {
      await accomplish.policyClearPassword(currentPw || undefined);
      setSuccess(t('policies.passwordCleared'));
      setCurrentPw('');
    });
  };

  return (
    <div className="border-t border-border pt-6 space-y-4">
      <h4 className="text-sm font-semibold">{t('policies.lockTitle')}</h4>
      <p className="text-sm text-muted-foreground">{t('policies.lockIntro')}</p>

      {!lockConfigured ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-pw">{t('policies.newPassword')}</Label>
            <Input
              id="new-pw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">{t('policies.confirmPassword')}</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button variant="secondary" onClick={() => void setInitialPassword()} disabled={saving}>
            {t('policies.setPassword')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('policies.changePasswordSection')}</Label>
            <Input
              type="password"
              placeholder={t('policies.currentPassword')}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
            />
            <Input
              type="password"
              placeholder={t('policies.newPassword')}
              value={changeNew}
              onChange={(e) => setChangeNew(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder={t('policies.confirmPassword')}
              value={changeConfirm}
              onChange={(e) => setChangeConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void changePassword()} disabled={saving}>
                {t('policies.updatePassword')}
              </Button>
              <Button variant="outline" onClick={() => void clearPassword()} disabled={saving}>
                {t('policies.removePassword')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}
    </div>
  );
}
