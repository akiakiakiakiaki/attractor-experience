import { describe, expect, it } from 'vitest';
import { TouchGestureTracker } from '@/experience/stages/attractor/components/attractor-field/TouchGestureTracker';

describe('TouchGestureTracker', () => {
  it('reports spreading and contracting fingers with opposite pinch directions', () => {
    const tracker = new TouchGestureTracker();
    tracker.update({ x: 40, y: 50 }, { x: 60, y: 50 }, 0, true);

    const spread = tracker.update({ x: 30, y: 50 }, { x: 70, y: 50 }, 100);
    const contract = tracker.update({ x: 40, y: 50 }, { x: 60, y: 50 }, 200);

    expect(spread.pinchSpeed).toBeGreaterThan(0);
    expect(contract.pinchSpeed).toBeLessThan(0);
    expect(spread.center).toEqual({ x: 50, y: 50 });
  });

  it('reports rotation direction across the angle wrap boundary', () => {
    const tracker = new TouchGestureTracker();
    tracker.update({ x: 60, y: 49 }, { x: 40, y: 51 }, 0, true);

    const clockwiseAcrossBoundary = tracker.update(
      { x: 60, y: 51 },
      { x: 40, y: 49 },
      100,
    );

    expect(clockwiseAcrossBoundary.angularSpeed).toBeGreaterThan(0);
  });

  it('resets its baseline when a touch pointer is released', () => {
    const tracker = new TouchGestureTracker();
    tracker.update({ x: 40, y: 50 }, { x: 60, y: 50 }, 0, true);
    tracker.reset();

    const firstSampleAfterReset = tracker.update({ x: 30, y: 50 }, { x: 70, y: 50 }, 100);

    expect(firstSampleAfterReset.pinchSpeed).toBe(0);
    expect(firstSampleAfterReset.angularSpeed).toBe(0);
  });
});
