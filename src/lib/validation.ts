import type { ErrorCorrectionLevel, QrContent } from '@/types/qr';
import { buildPayload } from './payload';

/**
 * Maximum bytes a version-40 symbol holds in byte mode at each error
 * correction level. Past this the encoder cannot produce a symbol at all.
 */
export const BYTE_CAPACITY: Record<ErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export function payloadBytes(payload: string): number {
  return new TextEncoder().encode(payload).length;
}

export interface CapacityReport {
  bytes: number;
  limit: number;
  usage: number;
  overflow: boolean;
}

export function assessCapacity(
  payload: string,
  level: ErrorCorrectionLevel,
): CapacityReport {
  const bytes = payloadBytes(payload);
  const limit = BYTE_CAPACITY[level];
  return {
    bytes,
    limit,
    usage: bytes / limit,
    overflow: bytes > limit,
  };
}

/** Deliberately permissive — it rejects obvious typos, not unusual addresses. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidLatitude(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && Number.isFinite(n) && n >= -90 && n <= 90;
}

export function isValidLongitude(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && Number.isFinite(n) && n >= -180 && n <= 180;
}

export interface ContentValidation {
  /** True when there is enough input to render a meaningful symbol. */
  ready: boolean;
  /** Field-level errors, keyed by the field name in the content object. */
  errors: Partial<Record<string, string>>;
}

/**
 * Validates content for rendering. Empty required fields make the form "not
 * ready" without being errors — an untouched form should look neutral, not
 * broken.
 */
export function validateContent(content: QrContent): ContentValidation {
  const errors: Record<string, string> = {};

  switch (content.kind) {
    case 'url':
      if (content.url.trim() && /\s/.test(content.url.trim())) {
        errors.url = 'A URL cannot contain spaces.';
      }
      break;

    case 'wifi':
      if (content.encryption !== 'nopass' && content.ssid.trim() && !content.password) {
        errors.password = 'A password is required for WPA and WEP networks.';
      }
      break;

    case 'vcard':
      if (content.email.trim() && !isValidEmail(content.email)) {
        errors.email = 'That does not look like a valid email address.';
      }
      break;

    case 'email':
      if (content.to.trim() && !isValidEmail(content.to)) {
        errors.to = 'That does not look like a valid email address.';
      }
      break;

    case 'geo':
      if (content.latitude.trim() && !isValidLatitude(content.latitude)) {
        errors.latitude = 'Latitude must be between -90 and 90.';
      }
      if (content.longitude.trim() && !isValidLongitude(content.longitude)) {
        errors.longitude = 'Longitude must be between -180 and 180.';
      }
      break;

    case 'event':
      if (content.start && content.end && content.end < content.start) {
        errors.end = 'The end time cannot be before the start time.';
      }
      break;

    case 'text':
    case 'sms':
    case 'phone':
      break;
  }

  const ready = buildPayload(content).length > 0 && Object.keys(errors).length === 0;
  return { ready, errors };
}

/**
 * A logo punches a hole in the data area, so error correction has to be high
 * enough to reconstruct what it covers. Level H tolerates ~30% loss.
 */
export function recommendedErrorCorrection(
  hasLogo: boolean,
  current: ErrorCorrectionLevel,
): ErrorCorrectionLevel {
  if (!hasLogo) return current;
  return current === 'H' || current === 'Q' ? current : 'H';
}
