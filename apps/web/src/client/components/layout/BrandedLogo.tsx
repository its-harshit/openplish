import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import brandLogo from '/assets/branding/npci-somehow.svg';

/** NPCI + SomeHow co-brand (`public/assets/branding/npci-somehow.svg`). */
export function BrandedLogo({ className }: { className?: string }) {
  const { t } = useTranslation('common');

  return (
    <div className={cn('flex items-center min-w-0', className)}>
      <div className="rounded-md bg-white px-1.5 py-1 shadow-sm ring-1 ring-border/50 dark:ring-border">
        <img
          src={brandLogo}
          alt={t('npciLogoAlt')}
          className="h-7 sm:h-9 w-auto max-w-[min(100%,280px)] object-contain object-left"
          loading="lazy"
        />
      </div>
    </div>
  );
}
