import { describe, expect, it } from 'vitest';
import {
  BYTE_CAPACITY,
  assessCapacity,
  isValidEmail,
  isValidLatitude,
  isValidLongitude,
  payloadBytes,
  recommendedErrorCorrection,
  validateContent,
} from '../validation';

describe('payloadBytes', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(payloadBytes('abc')).toBe(3);
    expect(payloadBytes('é')).toBe(2);
    expect(payloadBytes('😀')).toBe(4);
  });
});

describe('assessCapacity', () => {
  it('reports usage against the level limit', () => {
    const report = assessCapacity('a'.repeat(100), 'H');
    expect(report.bytes).toBe(100);
    expect(report.limit).toBe(BYTE_CAPACITY.H);
    expect(report.overflow).toBe(false);
    expect(report.usage).toBeCloseTo(100 / BYTE_CAPACITY.H, 6);
  });

  it('flags overflow past the level limit', () => {
    expect(assessCapacity('a'.repeat(BYTE_CAPACITY.H + 1), 'H').overflow).toBe(true);
  });

  it('gives level L more headroom than level H', () => {
    const payload = 'a'.repeat(2000);
    expect(assessCapacity(payload, 'L').overflow).toBe(false);
    expect(assessCapacity(payload, 'H').overflow).toBe(true);
  });
});

describe('field validators', () => {
  it.each(['a@b.co', 'first.last+tag@sub.example.com'])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['plain', 'a@b', 'a b@c.com', '@example.com'])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('bounds latitude and longitude', () => {
    expect(isValidLatitude('90')).toBe(true);
    expect(isValidLatitude('90.1')).toBe(false);
    expect(isValidLongitude('-180')).toBe(true);
    expect(isValidLongitude('181')).toBe(false);
    expect(isValidLatitude('')).toBe(false);
    expect(isValidLatitude('abc')).toBe(false);
  });
});

describe('validateContent', () => {
  it('is not ready but not in error when the form is untouched', () => {
    const result = validateContent({ kind: 'url', url: '' });
    expect(result.ready).toBe(false);
    expect(result.errors).toEqual({});
  });

  it('is ready once a URL is entered', () => {
    expect(validateContent({ kind: 'url', url: 'example.com' }).ready).toBe(true);
  });

  it('rejects a URL containing spaces', () => {
    const result = validateContent({ kind: 'url', url: 'exa mple.com' });
    expect(result.errors.url).toBeDefined();
    expect(result.ready).toBe(false);
  });

  it('requires a password for WPA but not for an open network', () => {
    const secured = validateContent({
      kind: 'wifi',
      ssid: 'Net',
      password: '',
      encryption: 'WPA',
      hidden: false,
    });
    expect(secured.errors.password).toBeDefined();

    const open = validateContent({
      kind: 'wifi',
      ssid: 'Net',
      password: '',
      encryption: 'nopass',
      hidden: false,
    });
    expect(open.errors).toEqual({});
    expect(open.ready).toBe(true);
  });

  it('rejects an event ending before it starts', () => {
    const result = validateContent({
      kind: 'event',
      title: 'Launch',
      location: '',
      start: '2026-03-04T11:00',
      end: '2026-03-04T09:00',
    });
    expect(result.errors.end).toBeDefined();
  });

  it('flags out-of-range coordinates', () => {
    const result = validateContent({
      kind: 'geo',
      latitude: '120',
      longitude: '200',
    });
    expect(result.errors.latitude).toBeDefined();
    expect(result.errors.longitude).toBeDefined();
  });
});

describe('recommendedErrorCorrection', () => {
  it('leaves the level alone without a logo', () => {
    expect(recommendedErrorCorrection(false, 'L')).toBe('L');
  });

  it('raises weak levels to H when a logo covers the centre', () => {
    expect(recommendedErrorCorrection(true, 'L')).toBe('H');
    expect(recommendedErrorCorrection(true, 'M')).toBe('H');
  });

  it('keeps levels that are already high enough', () => {
    expect(recommendedErrorCorrection(true, 'Q')).toBe('Q');
    expect(recommendedErrorCorrection(true, 'H')).toBe('H');
  });
});
