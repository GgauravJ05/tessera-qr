import type { ContentKind, QrContent, QrStyle } from '@/types/qr';

export const EMPTY_CONTENT: Record<ContentKind, QrContent> = {
  url: { kind: 'url', url: '' },
  text: { kind: 'text', text: '' },
  wifi: { kind: 'wifi', ssid: '', password: '', encryption: 'WPA', hidden: false },
  vcard: {
    kind: 'vcard',
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  },
  email: { kind: 'email', to: '', subject: '', body: '' },
  sms: { kind: 'sms', phone: '', message: '' },
  phone: { kind: 'phone', phone: '' },
  geo: { kind: 'geo', latitude: '', longitude: '' },
  event: { kind: 'event', title: '', location: '', start: '', end: '' },
};

export const DEFAULT_STYLE: QrStyle = {
  size: 1024,
  margin: 16,
  errorCorrection: 'Q',
  foreground: '#111827',
  background: '#ffffff',
  transparentBackground: false,
  useGradient: false,
  gradientTo: '#6366f1',
  gradientRotation: 45,
  dotStyle: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  logo: null,
  logoSize: 0.32,
  logoMargin: 8,
};

export interface StylePreset {
  id: string;
  name: string;
  style: Pick<
    QrStyle,
    | 'foreground'
    | 'background'
    | 'useGradient'
    | 'gradientTo'
    | 'dotStyle'
    | 'cornerSquareStyle'
    | 'cornerDotStyle'
  >;
}

export const PRESETS: StylePreset[] = [
  {
    id: 'classic',
    name: 'Classic',
    style: {
      foreground: '#000000',
      background: '#ffffff',
      useGradient: false,
      gradientTo: '#000000',
      dotStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
    },
  },
  {
    id: 'soft',
    name: 'Soft',
    style: {
      foreground: '#111827',
      background: '#ffffff',
      useGradient: false,
      gradientTo: '#111827',
      dotStyle: 'rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    style: {
      foreground: '#4338ca',
      background: '#ffffff',
      useGradient: true,
      gradientTo: '#7c3aed',
      dotStyle: 'classy-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    style: {
      foreground: '#14532d',
      background: '#f0fdf4',
      useGradient: true,
      gradientTo: '#15803d',
      dotStyle: 'dots',
      cornerSquareStyle: 'dot',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    style: {
      foreground: '#7c2d12',
      background: '#fffbeb',
      useGradient: true,
      gradientTo: '#b91c1c',
      dotStyle: 'classy',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    style: {
      foreground: '#e2e8f0',
      background: '#0f172a',
      useGradient: false,
      gradientTo: '#e2e8f0',
      dotStyle: 'extra-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
];

export const CONTENT_LABELS: Record<ContentKind, string> = {
  url: 'Link',
  text: 'Text',
  wifi: 'WiFi',
  vcard: 'Contact',
  email: 'Email',
  sms: 'SMS',
  phone: 'Phone',
  geo: 'Location',
  event: 'Event',
};
