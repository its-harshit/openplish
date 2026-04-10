import type { ToolSupportStatus } from '@somehow_ai/agent-core';

interface ToolSupportBadgeProps {
  status: ToolSupportStatus;
  t: (key: string) => string;
}

export function ToolSupportBadge({ status, t }: ToolSupportBadgeProps) {
  const config = {
    supported: {
      label: t('toolBadge.supported'),
      className: 'bg-success/20 text-success border-success/30',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    unsupported: {
      label: t('toolBadge.unsupported'),
      className: 'bg-destructive/20 text-destructive border-destructive/30',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    unknown: {
      label: t('toolBadge.unknown'),
      className: 'bg-warning/20 text-warning border-warning/30',
      icon: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
        </svg>
      ),
    },
  };

  const { label, className, icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
