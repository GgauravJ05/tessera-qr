/** The kinds of content Tessera can encode into a QR symbol. */
export type ContentKind =
  | 'url'
  | 'text'
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'sms'
  | 'phone'
  | 'geo'
  | 'event';

export type WifiEncryption = 'WPA' | 'WEP' | 'nopass';

export interface UrlContent {
  kind: 'url';
  url: string;
}

export interface TextContent {
  kind: 'text';
  text: string;
}

export interface WifiContent {
  kind: 'wifi';
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}

export interface VCardContent {
  kind: 'vcard';
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface EmailContent {
  kind: 'email';
  to: string;
  subject: string;
  body: string;
}

export interface SmsContent {
  kind: 'sms';
  phone: string;
  message: string;
}

export interface PhoneContent {
  kind: 'phone';
  phone: string;
}

export interface GeoContent {
  kind: 'geo';
  latitude: string;
  longitude: string;
}

export interface EventContent {
  kind: 'event';
  title: string;
  location: string;
  start: string;
  end: string;
}

export type QrContent =
  | UrlContent
  | TextContent
  | WifiContent
  | VCardContent
  | EmailContent
  | SmsContent
  | PhoneContent
  | GeoContent
  | EventContent;

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type DotStyle = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
export type CornerSquareStyle = 'square' | 'dot' | 'extra-rounded';
export type CornerDotStyle = 'square' | 'dot';
export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

export interface QrStyle {
  size: number;
  margin: number;
  errorCorrection: ErrorCorrectionLevel;
  foreground: string;
  background: string;
  transparentBackground: boolean;
  useGradient: boolean;
  gradientTo: string;
  gradientRotation: number;
  dotStyle: DotStyle;
  cornerSquareStyle: CornerSquareStyle;
  cornerDotStyle: CornerDotStyle;
  logo: string | null;
  logoSize: number;
  logoMargin: number;
}
