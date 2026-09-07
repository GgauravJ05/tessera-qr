import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ScannabilityReport } from '@/lib/contrast';

const TONE = {
  ok: {
    className: 'bg-ok-soft text-ok',
    Icon: CheckCircle2,
    label: 'Good contrast',
  },
  warn: {
    className: 'bg-warn-soft text-warn',
    Icon: AlertTriangle,
    label: 'Marginal contrast',
  },
  fail: {
    className: 'bg-danger-soft text-danger',
    Icon: XCircle,
    label: 'Likely unscannable',
  },
} as const;

export function ScannabilityBadge({ report }: { report: ScannabilityReport }) {
  const { className, Icon, label } = TONE[report.risk];

  return (
    <div
      className={clsx('rounded-lg px-3 py-2.5 text-xs', className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 font-medium">
        <Icon size={14} aria-hidden />
        <span>{label}</span>
        <span className="ml-auto font-mono opacity-70">
          {report.ratio.toFixed(1)}:1
        </span>
      </div>
      {report.messages.length > 0 && (
        <ul className="mt-1.5 space-y-1 pl-6 opacity-90">
          {report.messages.map((message) => (
            <li key={message} className="list-disc">
              {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
