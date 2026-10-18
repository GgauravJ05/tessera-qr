import type { QrStyle } from '@/types/qr';
import { assessScannability } from '@/lib/contrast';
import { DISTANCE_LADDER } from '@/lib/ladder';

/**
 * Break it: the challenge on the proof wall. Push a design as far from a
 * plain black square as you dare; it only scores if it still decodes.
 *
 * Boldness is a fixed, published table, so the score can be argued with.
 * Reach is measured, not judged: how many rungs of the scanlab ladder the
 * design survives before its first failure, decoded on the visitor's device.
 * Everything stays on the device; there is no shared leaderboard, because
 * there is no server to keep one.
 */
export interface BoldnessLine {
  label: string;
  points: number;
}

export function boldness(style: QrStyle): BoldnessLine[] {
  const paper = style.transparentBackground ? '#ffffff' : style.background;
  const report = assessScannability(
    style.foreground,
    paper,
    style.useGradient ? style.gradientTo : undefined,
  );
  const lines: BoldnessLine[] = [];

  // Lower contrast is braver, on a log scale: 21:1 earns nothing, 3:1 earns 26.
  const nerve = Math.round((1 - Math.log(report.ratio) / Math.log(21)) * 40);
  lines.push({
    label: `Contrast at ${report.ratio.toFixed(1)}:1`,
    points: Math.max(0, nerve),
  });

  if (style.useGradient) lines.push({ label: 'Gradient fill', points: 10 });
  if (report.inverted) lines.push({ label: 'Light on dark', points: 12 });
  if (style.dotStyle === 'dots' || style.dotStyle === 'classy') {
    lines.push({ label: `Dot shape: ${style.dotStyle}`, points: 8 });
  } else if (style.dotStyle !== 'square') {
    lines.push({ label: `Dot shape: ${style.dotStyle}`, points: 5 });
  }
  if (style.cornerSquareStyle !== 'square') {
    lines.push({ label: `Eye frame: ${style.cornerSquareStyle}`, points: 6 });
  }
  if (style.cornerDotStyle !== 'square')
    lines.push({ label: 'Eye centre: dot', points: 4 });
  return lines;
}

export const totalBoldness = (lines: readonly BoldnessLine[]) =>
  lines.reduce((sum, line) => sum + line.points, 0);

/** Rungs survived, 0 to 20: the last passing rung plus one. */
export const reachOf = (rung: number) => Math.max(0, rung + 1);

export type Rank = 'Broken' | 'Readable' | 'Robust' | 'Bulletproof';

export function rankOf(bold: number, reach: number): Rank {
  if (reach === 0) return 'Broken';
  if (reach >= 15 && bold >= 30) return 'Bulletproof';
  if (reach >= 10 && bold >= 15) return 'Robust';
  return 'Readable';
}

export interface ChallengeResult {
  boldness: number;
  reach: number;
  score: number;
  rank: Rank;
}

export function scoreDesign(style: QrStyle, rung: number): ChallengeResult {
  const bold = totalBoldness(boldness(style));
  const reach = reachOf(rung);
  return { boldness: bold, reach, score: bold * reach, rank: rankOf(bold, reach) };
}

export const MAX_REACH = DISTANCE_LADDER.length;
