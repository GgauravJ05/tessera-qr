/// <reference types="vite/client" />

declare module '*.css';

// The scanlab ladder is plain JavaScript; the parity test imports it to pin
// the app's copy against it.
declare module '*/scanlab/ladder.mjs' {
  import type { LadderRung } from '@/lib/ladder';
  export const DISTANCE_LADDER: LadderRung[];
  export const DISTANCE_BASELINE: Record<string, number>;
}
