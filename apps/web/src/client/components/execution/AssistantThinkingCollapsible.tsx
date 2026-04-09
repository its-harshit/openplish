import { CaretRight } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AssistantThinkingCollapsibleProps {
  thinking: string;
  /** When the model is still streaming inside an unclosed reasoning block. */
  inProgress?: boolean;
  className?: string;
}

export function AssistantThinkingCollapsible({
  thinking,
  inProgress = false,
  className,
}: AssistantThinkingCollapsibleProps) {
  const { t } = useTranslation('execution');
  const label = t('assistantThinkingToggle');

  return (
    <details
      className={cn(
        'group mb-2 rounded-lg border border-border/80 bg-muted/40 text-left',
        className,
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground',
          'select-none [&::-webkit-details-marker]:hidden',
        )}
      >
        <CaretRight
          className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90"
          aria-hidden
        />
        <span>{label}</span>
        {inProgress && (
          <span className="text-muted-foreground/70">{t('assistantThinkingInProgress')}</span>
        )}
      </summary>
      <div className="border-t border-border/60 px-3 py-2">
        <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground font-sans">
          {thinking}
        </pre>
      </div>
    </details>
  );
}
