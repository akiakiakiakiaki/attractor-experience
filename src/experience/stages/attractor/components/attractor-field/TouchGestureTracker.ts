import type { Vec2 } from '@/experience/types';

export interface TouchGestureSample {
  center: Vec2;
  pinchSpeed: number;
  angularSpeed: number;
}

interface GesturePosition {
  distance: number;
  angle: number;
  time: number;
}

/** Converts two touch positions into signed pinch and rotation speeds. */
export class TouchGestureTracker {
  private previous: GesturePosition | null = null;

  reset(): void {
    this.previous = null;
  }

  update(
    first: Vec2,
    second: Vec2,
    time: number,
    establishBaseline = false,
  ): TouchGestureSample {
    const deltaX = second.x - first.x;
    const deltaY = second.y - first.y;
    const current = {
      distance: Math.hypot(deltaX, deltaY),
      angle: Math.atan2(deltaY, deltaX),
      time,
    };
    const center = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };

    if (establishBaseline || !this.previous) {
      this.previous = current;
      return { center, pinchSpeed: 0, angularSpeed: 0 };
    }

    const elapsedSeconds = Math.max(0.001, (time - this.previous.time) / 1000);
    const pinchSpeed = (current.distance - this.previous.distance) / elapsedSeconds;
    let angleChange = current.angle - this.previous.angle;
    if (angleChange > Math.PI) angleChange -= Math.PI * 2;
    if (angleChange < -Math.PI) angleChange += Math.PI * 2;

    this.previous = current;
    return {
      center,
      pinchSpeed,
      angularSpeed: angleChange / elapsedSeconds,
    };
  }
}
