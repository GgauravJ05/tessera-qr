import { clsx } from 'clsx';
import { m } from 'motion/react';
import {
  CalendarDays,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Type,
  UserRound,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ContentKind } from '@/types/qr';
import { CONTENT_LABELS } from '@/lib/defaults';

const ICONS: Record<ContentKind, LucideIcon> = {
  url: LinkIcon,
  text: Type,
  wifi: Wifi,
  vcard: UserRound,
  email: Mail,
  sms: MessageSquare,
  phone: Phone,
  geo: MapPin,
  event: CalendarDays,
};

const ORDER: ContentKind[] = [
  'url',
  'text',
  'wifi',
  'vcard',
  'email',
  'sms',
  'phone',
  'geo',
  'event',
];

interface ContentTabsProps {
  value: ContentKind;
  onChange: (kind: ContentKind) => void;
}

/**
 * The job type, set as a ruled row of tabs. The selected tab carries a heavy
 * ink rule that slides between tabs rather than jumping, so the change of
 * job reads as one move.
 */
export function ContentTabs({ value, onChange }: ContentTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="QR content type"
      className="scroll-thin scroll-edge-fade flex min-w-0 overflow-x-auto border-b border-rule"
    >
      {ORDER.map((kind) => {
        const Icon = ICONS[kind];
        const active = kind === value;
        return (
          <button
            key={kind}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(kind)}
            className={clsx(
              'relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 pb-3 pt-2 text-[14px] font-semibold transition-colors',
              active ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            <Icon size={15} strokeWidth={2} aria-hidden />
            {CONTENT_LABELS[kind]}
            {active && (
              <m.span
                layoutId="content-tab-rule"
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-[3px] bg-ink"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
