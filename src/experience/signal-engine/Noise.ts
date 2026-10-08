/** Deterministic noise sources for repeatable simulation signals. */
export class Noise {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Seeded uniform noise in [0, 1), useful for independent one-shot samples. */
  uniform(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  /** Seeded white noise in [-1, 1]. */
  white(): number {
    return this.uniform() * 2 - 1;
  }

  /** Smooth 1D value noise in [-1, 1]. */
  static value1D(position: number, seed: number): number {
    const start = Math.floor(position);
    const fraction = position - start;
    const blend = fraction * fraction * (3 - 2 * fraction);
    return this.hash1D(start, seed) * (1 - blend) + this.hash1D(start + 1, seed) * blend;
  }

  /** Smooth 2D value noise in [-1, 1]. */
  static value2D(x: number, y: number, seed: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xFraction = x - x0;
    const yFraction = y - y0;
    const blendX = xFraction * xFraction * (3 - 2 * xFraction);
    const blendY = yFraction * yFraction * (3 - 2 * yFraction);
    const top = this.hash2D(x0, y0, seed) * (1 - blendX) + this.hash2D(x0 + 1, y0, seed) * blendX;
    const bottom = this.hash2D(x0, y0 + 1, seed) * (1 - blendX) + this.hash2D(x0 + 1, y0 + 1, seed) * blendX;
    return top * (1 - blendY) + bottom * blendY;
  }

  /** Smooth 1D noise that loops seamlessly from progress 1 back to 0. */
  static periodic1D(progress: number, seed: number, scale: number): number {
    const angle = progress * Math.PI * 2;
    return this.value2D(Math.cos(angle) * scale, Math.sin(angle) * scale, seed);
  }

  /** Smooth 2D noise that loops seamlessly across both normalized axes. */
  static periodic2D(xProgress: number, yProgress: number, seed: number, scale: number): number {
    const xAngle = xProgress * Math.PI * 2;
    const yAngle = yProgress * Math.PI * 2;
    return this.value4D(
      Math.cos(xAngle) * scale,
      Math.sin(xAngle) * scale,
      Math.cos(yAngle) * scale,
      Math.sin(yAngle) * scale,
      seed,
    );
  }

  private static value4D(x: number, y: number, z: number, w: number, seed: number): number {
    const coordinates = [x, y, z, w];
    const starts = coordinates.map(Math.floor);
    const fractions = coordinates.map((coordinate, index) => {
      const fraction = coordinate - starts[index]!;
      return fraction * fraction * (3 - 2 * fraction);
    });
    let value = 0;

    for (let corner = 0; corner < 16; corner++) {
      const offsets = [corner & 1, (corner >> 1) & 1, (corner >> 2) & 1, (corner >> 3) & 1];
      const weight = offsets.reduce(
        (product, offset, axis) => product * (offset ? fractions[axis]! : 1 - fractions[axis]!),
        1,
      );
      value += this.hash4D(
        starts[0]! + offsets[0]!,
        starts[1]! + offsets[1]!,
        starts[2]! + offsets[2]!,
        starts[3]! + offsets[3]!,
        seed,
      ) * weight;
    }

    return value;
  }

  private static hash1D(point: number, seed: number): number {
    const value = Math.sin(point * 127.1 + seed * 311.7) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  private static hash2D(x: number, y: number, seed: number): number {
    const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }

  private static hash4D(x: number, y: number, z: number, w: number, seed: number): number {
    const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + w * 269.5 + seed * 113.5) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  }
}
