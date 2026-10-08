export interface SaturationSettings {
  mode: 'hard' | 'soft';
  drive: number;
}

/** Signal shaping helpers shared by modulation and simulation controls. */
export class Saturation {
  static process(value: number, settings: SaturationSettings, minimum = -1, maximum = 1): number {
    const range = maximum - minimum;
    if (range <= 0) return minimum;

    const midpoint = (minimum + maximum) / 2;
    const halfRange = range / 2;
    const normalized = (value - midpoint) / halfRange;

    if (settings.mode !== 'soft' || settings.drive <= 0) {
      return this.clamp(value, minimum, maximum);
    }

    const denominator = Math.tanh(settings.drive);
    const shaped = Math.tanh(normalized * settings.drive) / denominator;
    return midpoint + this.clamp(shaped, -1, 1) * halfRange;
  }

  static clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(maximum, value));
  }
}
