import { clsx } from 'clsx';
import type { ScannabilityReport } from '@/lib/contrast';
import { ProofMark } from './proof/Marks';
import { Reading } from './proof/Reading';

const TONE = {
  ok: { mark: 'pass', label: 'Good contrast' },
  warn: { mark: 'warn', label: 'Marginal contrast' },
  fail: { mark: 'fail', label: 'Likely unscannable' },
} as const;

/**
 * The contrast verdict, set as the headline line of the press check. A fail
 * is printed in magenta and boxed, the way a proofreader rings a fault.
 */
export function ScannabilityBadge({ report }: { report: ScannabilityReport }) {
  const { mark, label } = TONE[report.risk];

  return (
    <div
      className={clsx(
        'border px-3 py-2.5',
        report.risk === 'fail' ? 'border-magenta border-2' : 'border-rule',
        report.risk === 'warn' && 'bg-yellow/25',
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={clsx(
          'flex items-center gap-2 text-[15px] font-bold',
          report.risk === 'fail' && 'text-magenta-ink',
        )}
      >
        <ProofMark kind={mark} size={14} />
        <span>{label}</span>
        <span className="ml-auto text-[17px]">
          <Reading value={`${report.ratio.toFixed(1)}:1`} />
        </span>
      </div>
      {report.messages.length > 0 && (
        <ul className="mt-1.5 space-y-1 pl-6 text-[13px] text-ink-2">
          {report.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
