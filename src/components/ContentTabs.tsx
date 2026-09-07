import { clsx } from 'clsx';
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

export function ContentTabs({ value, onChange }: ContentTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="QR content type"
      className="scroll-thin scroll-edge-fade -mx-1 flex min-w-0 snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1.5"
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
              'flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.97] sm:px-3.5',
              active
                ? 'border-accent/40 bg-accent-soft text-accent shadow-[var(--shadow-raise)]'
                : 'border-line bg-raised text-ink-muted hover:-translate-y-px hover:border-line-strong hover:text-ink',
            )}
          >
            <Icon size={14} aria-hidden />
            {CONTENT_LABELS[kind]}
          </button>
        );
      })}
    </div>
  );
}
