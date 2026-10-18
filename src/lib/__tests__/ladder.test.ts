import { describe, expect, it } from 'vitest';
import {
  DISTANCE_BASELINE,
  DISTANCE_LADDER,
  lastPassingRung,
  quietZoneModules,
  sourceRenderSize,
  symbolGeometry,
} from '@/lib/ladder';
// The lab's own definition. If the two ever diverge, the distance proof on the
// page stops describing what the dataset measured, so this fails loudly.
import * as lab from '../../../tools/scanlab/ladder.mjs';

describe('distance ladder', () => {
  it('matches the scanlab ladder rung for rung', () => {
    expect(DISTANCE_LADDER).toEqual(lab.DISTANCE_LADDER);
    expect(DISTANCE_BASELINE).toEqual(lab.DISTANCE_BASELINE);
  });

  it('clamps the source render size the way the lab does', () => {
    expect(sourceRenderSize(21)).toBe(800);
    expect(sourceRenderSize(100)).toBe(1200);
    expect(sourceRenderSize(400)).toBe(2400);
  });

  it('derives whole-pixel modules inside the quiet zone', () => {
    const g = symbolGeometry(29, 16, 1024);
    expect(g.renderSize).toBe(800);
    expect(g.marginPx).toBe(13);
    expect(g.sourceDotPx).toBe(26);
  });

  it('scores on the first failure, not the best rung reached', () => {
    expect(lastPassingRung([true, true, false, true])).toBe(1);
    expect(lastPassingRung([false, true])).toBe(-1);
    expect(lastPassingRung([true, true, true])).toBe(2);
  });

  it('measures the quiet zone in modules', () => {
    expect(quietZoneModules(29, 16, 1024)).toBeCloseTo(0.47, 2);
    expect(quietZoneModules(21, 0, 1024)).toBe(0);
  });
});
