import type { QrContent } from '@/types/qr';

/**
 * Characters that terminate or delimit fields in the WIFI: and MECARD-style
 * schemes. They must be backslash-escaped or a value containing one silently
 * truncates the payload when a scanner parses it.
 */
const WIFI_RESERVED = /([;,:"])/g;

export function escapeWifiValue(value: string): string {
  return value.replace(WIFI_RESERVED, '\\$1');
}

/**
 * vCard folds on CRLF, so a raw newline inside a value ends the property.
 * Commas and semicolons are structural separators within a property value.
 */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Strips spaces, dashes and parentheses that scanners choke on in tel: URIs. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Adds a scheme to a bare host so the QR opens a browser rather than being
 * treated as plain text. Anything that already has a scheme is left alone.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Converts a datetime-local value (2026-03-04T09:30) to iCal basic format. */
export function toICalDate(value: string): string {
  if (!value) return '';
  return `${value.replace(/[-:]/g, '')}00`;
}

/**
 * Turns structured content into the exact string that gets encoded into the
 * symbol. This is the single source of truth for every supported scheme.
 */
export function buildPayload(content: QrContent): string {
  switch (content.kind) {
    case 'url':
      return normalizeUrl(content.url);

    case 'text':
      return content.text;

    case 'wifi': {
      const { ssid, password, encryption, hidden } = content;
      if (!ssid.trim()) return '';
      const parts = [
        `T:${encryption}`,
        `S:${escapeWifiValue(ssid)}`,
        encryption === 'nopass' ? '' : `P:${escapeWifiValue(password)}`,
        hidden ? 'H:true' : '',
      ].filter(Boolean);
      return `WIFI:${parts.join(';')};;`;
    }

    case 'vcard': {
      const c = content;
      const name = `${escapeVCardValue(c.lastName)};${escapeVCardValue(c.firstName)};;;`;
      const full = [c.firstName, c.lastName].filter(Boolean).join(' ');
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${name}`,
        `FN:${escapeVCardValue(full)}`,
        c.organization && `ORG:${escapeVCardValue(c.organization)}`,
        c.title && `TITLE:${escapeVCardValue(c.title)}`,
        c.phone && `TEL;TYPE=CELL:${normalizePhone(c.phone)}`,
        c.email && `EMAIL:${escapeVCardValue(c.email)}`,
        c.website && `URL:${normalizeUrl(c.website)}`,
        c.address && `ADR;TYPE=WORK:;;${escapeVCardValue(c.address)};;;;`,
        'END:VCARD',
      ].filter(Boolean);
      return lines.join('\n');
    }

    case 'email': {
      if (!content.to.trim()) return '';
      const params = new URLSearchParams();
      if (content.subject) params.set('subject', content.subject);
      if (content.body) params.set('body', content.body);
      const query = params.toString();
      return `mailto:${content.to.trim()}${query ? `?${query}` : ''}`;
    }

    case 'sms': {
      const number = normalizePhone(content.phone);
      if (!number) return '';
      return content.message ? `SMSTO:${number}:${content.message}` : `SMSTO:${number}`;
    }

    case 'phone': {
      const number = normalizePhone(content.phone);
      return number ? `tel:${number}` : '';
    }

    case 'geo': {
      const { latitude, longitude } = content;
      if (!latitude.trim() || !longitude.trim()) return '';
      return `geo:${latitude.trim()},${longitude.trim()}`;
    }

    case 'event': {
      if (!content.title.trim()) return '';
      const lines = [
        'BEGIN:VEVENT',
        `SUMMARY:${escapeVCardValue(content.title)}`,
        content.location && `LOCATION:${escapeVCardValue(content.location)}`,
        content.start && `DTSTART:${toICalDate(content.start)}`,
        content.end && `DTEND:${toICalDate(content.end)}`,
        'END:VEVENT',
      ].filter(Boolean);
      return lines.join('\n');
    }
  }
}
