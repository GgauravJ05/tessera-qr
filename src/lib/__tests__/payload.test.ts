import { describe, expect, it } from 'vitest';
import {
  buildPayload,
  escapeVCardValue,
  escapeWifiValue,
  normalizePhone,
  normalizeUrl,
  toICalDate,
} from '../payload';

describe('normalizeUrl', () => {
  it('adds https:// to a bare host', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('leaves an existing scheme untouched', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(normalizeUrl('ftp://files.example.com')).toBe('ftp://files.example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
  });

  it('returns an empty string for blank input rather than "https://"', () => {
    expect(normalizeUrl('   ')).toBe('');
  });
});

describe('normalizePhone', () => {
  it('strips formatting but keeps the leading plus', () => {
    expect(normalizePhone('+91 (98765) 43-210')).toBe('+919876543210');
  });
});

describe('escapeWifiValue', () => {
  it.each([
    [';', '\\;'],
    [',', '\\,'],
    [':', '\\:'],
    ['"', '\\"'],
  ])('escapes the reserved character %s', (input, expected) => {
    expect(escapeWifiValue(input)).toBe(expected);
  });

  it('leaves ordinary text alone', () => {
    expect(escapeWifiValue('Cafe Guest')).toBe('Cafe Guest');
  });
});

describe('escapeVCardValue', () => {
  it('escapes separators and newlines that would break the record', () => {
    expect(escapeVCardValue('Acme, Inc; HQ')).toBe('Acme\\, Inc\\; HQ');
    expect(escapeVCardValue('line1\nline2')).toBe('line1\\nline2');
  });
});

describe('toICalDate', () => {
  it('converts a datetime-local value to iCal basic format', () => {
    expect(toICalDate('2026-03-04T09:30')).toBe('20260304T093000');
  });

  it('returns empty for empty input', () => {
    expect(toICalDate('')).toBe('');
  });
});

describe('buildPayload', () => {
  it('encodes a WPA network', () => {
    expect(
      buildPayload({
        kind: 'wifi',
        ssid: 'Cafe Guest',
        password: 'latte123',
        encryption: 'WPA',
        hidden: false,
      }),
    ).toBe('WIFI:T:WPA;S:Cafe Guest;P:latte123;;');
  });

  it('omits the password for an open network', () => {
    const payload = buildPayload({
      kind: 'wifi',
      ssid: 'Free',
      password: 'ignored',
      encryption: 'nopass',
      hidden: false,
    });
    expect(payload).toBe('WIFI:T:nopass;S:Free;;');
    expect(payload).not.toContain('ignored');
  });

  it('flags a hidden network', () => {
    expect(
      buildPayload({
        kind: 'wifi',
        ssid: 'Ghost',
        password: 'pw',
        encryption: 'WPA',
        hidden: true,
      }),
    ).toContain('H:true');
  });

  it('escapes a semicolon in an SSID so the payload is not truncated', () => {
    expect(
      buildPayload({
        kind: 'wifi',
        ssid: 'Net;work',
        password: 'p',
        encryption: 'WPA',
        hidden: false,
      }),
    ).toContain('S:Net\\;work');
  });

  it('returns empty when the SSID is missing', () => {
    expect(
      buildPayload({
        kind: 'wifi',
        ssid: '  ',
        password: 'p',
        encryption: 'WPA',
        hidden: false,
      }),
    ).toBe('');
  });

  it('builds a vCard with only the fields that were filled in', () => {
    const payload = buildPayload({
      kind: 'vcard',
      firstName: 'Gaurav',
      lastName: 'Jadhav',
      organization: '',
      title: '',
      phone: '+91 98765 43210',
      email: 'g@example.com',
      website: 'example.com',
      address: '',
    });

    expect(payload).toContain('BEGIN:VCARD');
    expect(payload).toContain('VERSION:3.0');
    expect(payload).toContain('N:Jadhav;Gaurav;;;');
    expect(payload).toContain('FN:Gaurav Jadhav');
    expect(payload).toContain('TEL;TYPE=CELL:+919876543210');
    expect(payload).toContain('URL:https://example.com');
    expect(payload).not.toContain('ORG:');
    expect(payload).not.toContain('ADR');
    expect(payload.endsWith('END:VCARD')).toBe(true);
  });

  it('percent-encodes an email subject and body', () => {
    const payload = buildPayload({
      kind: 'email',
      to: 'hi@example.com',
      subject: 'Hello there',
      body: 'a&b',
    });
    expect(payload).toBe('mailto:hi@example.com?subject=Hello+there&body=a%26b');
  });

  it('omits the query string when only a recipient is given', () => {
    expect(
      buildPayload({ kind: 'email', to: 'hi@example.com', subject: '', body: '' }),
    ).toBe('mailto:hi@example.com');
  });

  it('builds SMS payloads with and without a message', () => {
    expect(buildPayload({ kind: 'sms', phone: '+91 98765', message: 'yo' })).toBe(
      'SMSTO:+9198765:yo',
    );
    expect(buildPayload({ kind: 'sms', phone: '+91 98765', message: '' })).toBe(
      'SMSTO:+9198765',
    );
  });

  it('builds a tel: URI', () => {
    expect(buildPayload({ kind: 'phone', phone: '(020) 1234' })).toBe('tel:0201234');
  });

  it('builds a geo: URI and rejects a half-filled pair', () => {
    expect(buildPayload({ kind: 'geo', latitude: '18.52', longitude: '73.85' })).toBe(
      'geo:18.52,73.85',
    );
    expect(buildPayload({ kind: 'geo', latitude: '18.52', longitude: '' })).toBe('');
  });

  it('builds a VEVENT', () => {
    const payload = buildPayload({
      kind: 'event',
      title: 'Launch',
      location: 'Pune',
      start: '2026-03-04T09:30',
      end: '2026-03-04T11:00',
    });
    expect(payload).toContain('BEGIN:VEVENT');
    expect(payload).toContain('SUMMARY:Launch');
    expect(payload).toContain('DTSTART:20260304T093000');
    expect(payload).toContain('DTEND:20260304T110000');
  });

  it('passes plain text through unchanged', () => {
    expect(buildPayload({ kind: 'text', text: 'hello; world' })).toBe('hello; world');
  });
});
