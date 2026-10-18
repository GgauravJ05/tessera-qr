import type { QrStyle } from '@/types/qr';
import { DEFAULT_STYLE, PRESETS } from '@/lib/defaults';

/**
 * The designs on the proof wall: the studio's presets, plus samples Tessera
 * authored to show the ways a styled code goes wrong. Samples are labelled as
 * samples wherever they appear. None of them is a visitor's design, and the
 * wall never claims otherwise.
 */
export interface WallDesign {
  id: string;
  name: string;
  source: 'Preset' | 'Sample';
  note: string;
  style: QrStyle;
}

const base: QrStyle = { ...DEFAULT_STYLE, margin: 0, logo: null };

const SAMPLES: Omit<WallDesign, 'source'>[] = [
  {
    id: 'lilac-fade',
    name: 'Lilac fade',
    note: 'Black that fades into the paper.',
    style: {
      ...base,
      foreground: '#111111',
      useGradient: true,
      gradientTo: '#ece8ff',
      gradientRotation: 180,
      dotStyle: 'rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'cream-pastel',
    name: 'Pastel on cream',
    note: 'A tasteful pair at similar lightness.',
    style: {
      ...base,
      foreground: '#e2a49b',
      background: '#fff6e9',
      dotStyle: 'dots',
      cornerSquareStyle: 'dot',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'night-market',
    name: 'Night market',
    note: 'Light modules on a dark ground.',
    style: {
      ...base,
      foreground: '#f5d90a',
      background: '#101010',
      dotStyle: 'extra-rounded',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'process-magenta',
    name: 'Process magenta',
    note: 'One ink, classy rounded dots.',
    style: {
      ...base,
      foreground: '#c4006c',
      dotStyle: 'classy-rounded',
      cornerSquareStyle: 'dot',
      cornerDotStyle: 'dot',
    },
  },
  {
    id: 'cyan-plate',
    name: 'Cyan plate',
    note: 'A gradient into a light cyan.',
    style: {
      ...base,
      foreground: '#0072a8',
      useGradient: true,
      gradientTo: '#00a0e9',
      gradientRotation: 45,
      dotStyle: 'square',
      cornerSquareStyle: 'square',
      cornerDotStyle: 'square',
    },
  },
  {
    id: 'pencil',
    name: 'Pencil',
    note: 'Mid grey dots, dot corners.',
    style: {
      ...base,
      foreground: '#6b6b66',
      background: '#fbfbf9',
      dotStyle: 'dots',
      cornerSquareStyle: 'dot',
      cornerDotStyle: 'dot',
    },
  },
];

export const WALL: WallDesign[] = [
  ...PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    source: 'Preset' as const,
    note: 'One of the studio’s presets.',
    style: { ...base, ...p.style },
  })),
  ...SAMPLES.map((s) => ({ ...s, source: 'Sample' as const })),
];

/** The payload every design on the wall is measured with, so they compare. */
export const WALL_PAYLOAD = 'https://tessera-qr.vercel.app/gallery/';
