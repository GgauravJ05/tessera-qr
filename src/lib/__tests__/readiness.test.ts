import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE } from '@/lib/defaults';
import { assessScannability } from '@/lib/contrast';
import { assessCapacity } from '@/lib/validation';
import { pressCheck, verdictOf } from '@/lib/readiness';
import type { QrStyle } from '@/types/qr';

const run = (patch: Partial<QrStyle> = {}, payload = 'https://example.com') => {
  const style = { ...DEFAULT_STYLE, margin: 160, ...patch };
  return pressCheck({
    style,
    scannability: assessScannability(
      style.foreground,
      style.background,
      style.useGradient ? style.gradientTo : undefined,
    ),
    capacity: assessCapacity(payload, style.errorCorrection),
    moduleCount: 25,
  });
};

const status = (checks: ReturnType<typeof run>, id: string) =>
  checks.find((c) => c.id === id)?.status;

describe('pressCheck', () => {
  it('passes the default design with a full quiet zone', () => {
    const checks = run();
    expect(verdictOf(checks)).toBe('pass');
    expect(status(checks, 'contrast')).toBe('pass');
    expect(status(checks, 'quiet')).toBe('pass');
  });

  it('fails a gradient whose far end fades out, naming the weak end', () => {
    const checks = run({
      useGradient: true,
      foreground: '#000000',
      gradientTo: '#eeeeee',
    });
    const contrast = checks.find((c) => c.id === 'contrast')!;
    expect(contrast.label).toMatch(/weakest end/i);
    expect(contrast.status).toBe('fail');
    expect(verdictOf(checks)).toBe('fail');
  });

  it('warns on a quiet zone narrower than the specification', () => {
    expect(status(run({ margin: 16 }), 'quiet')).toBe('warn');
  });

  it('fails a logo larger than the correction level can rebuild', () => {
    expect(
      status(run({ logo: 'data:,', logoSize: 0.5, errorCorrection: 'M' }), 'logo'),
    ).toBe('fail');
    expect(
      status(run({ logo: 'data:,', logoSize: 0.5, errorCorrection: 'H' }), 'logo'),
    ).toBe('warn');
  });

  it('keeps the notes out of the verdict', () => {
    const checks = run();
    expect(checks.filter((c) => c.status === 'note')).toHaveLength(2);
    expect(verdictOf(checks)).toBe('pass');
  });
});
