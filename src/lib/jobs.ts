import type { ContentKind, QrStyle } from '@/types/qr';
import { PRESETS } from '@/lib/defaults';

/**
 * Starting points named for the job rather than the setting. Each one picks
 * the content type and the handful of settings that job is sensitive to;
 * the reason given is the one the press check would give, never a promise
 * about distance or print size the evidence does not back.
 */
export interface Job {
  id: string;
  title: string;
  kind: ContentKind;
  style: Partial<QrStyle>;
  reason: string;
}

const preset = (id: string) => PRESETS.find((p) => p.id === id)!.style;

/** About four modules of quiet zone for a typical short payload at 1024 px. */
const FULL_QUIET_ZONE = 140;

export const JOBS: Job[] = [
  {
    id: 'wifi',
    title: 'Share WiFi with guests',
    kind: 'wifi',
    style: {
      ...preset('classic'),
      errorCorrection: 'Q',
      margin: FULL_QUIET_ZONE,
      logo: null,
    },
    reason:
      'Square modules on white, full quiet zone. Passwords with ; or : are escaped.',
  },
  {
    id: 'poster',
    title: 'Put a link on a poster',
    kind: 'url',
    style: {
      ...preset('classic'),
      errorCorrection: 'M',
      margin: FULL_QUIET_ZONE,
      logo: null,
    },
    reason: 'Level M keeps a short link coarse, so each module prints larger.',
  },
  {
    id: 'menu',
    title: 'Put the menu on a table',
    kind: 'url',
    style: { ...preset('soft'), errorCorrection: 'Q', margin: FULL_QUIET_ZONE },
    reason: 'Rounded dots, still well above 4.5:1, with room to survive a coffee ring.',
  },
  {
    id: 'card',
    title: 'Print on a business card',
    kind: 'vcard',
    style: {
      ...preset('classic'),
      errorCorrection: 'M',
      margin: FULL_QUIET_ZONE,
      logo: null,
    },
    reason: 'A contact is long, so level M keeps the symbol as small as it can be.',
  },
  {
    id: 'event',
    title: 'Add an event to calendars',
    kind: 'event',
    style: {
      ...preset('soft'),
      errorCorrection: 'M',
      margin: FULL_QUIET_ZONE,
      logo: null,
    },
    reason: 'Calendar entries run long; level M leaves capacity for the details.',
  },
];
