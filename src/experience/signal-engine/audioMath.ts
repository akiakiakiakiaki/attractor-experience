import { Saturation } from './Saturation';

export type Waveform = 'sine' | 'tri' | 'saw' | 'rect';

export class Oscillator {
  constructor(
    readonly frequency: number,
    readonly phase: number,
    readonly amplitude: number,
    readonly waveform: Waveform = 'sine',
  ) {}

  value(time: number): number {
    const cycle = ((time * this.frequency + this.phase / (Math.PI * 2)) % 1 + 1) % 1;
    let wave: number;
    switch (this.waveform) {
      case 'tri': wave = 1 - 4 * Math.abs(cycle - 0.5); break;
      case 'saw': wave = cycle * 2 - 1; break;
      case 'rect': wave = cycle < 0.5 ? 1 : -1; break;
      default: wave = Math.sin(time * this.frequency * Math.PI * 2 + this.phase);
    }
    return wave * this.amplitude;
  }
}

export class Envelope {
  value = 0;
  target = 0;

  tick(dt: number, attack: number, release: number): number {
    const time = this.target > this.value ? attack : release;
    this.value += (this.target - this.value) * (1 - Math.exp(-dt / Math.max(0.001, time)));
    return this.value;
  }

  trigger(amount = 1): void {
    this.value = Saturation.process(this.value + amount, { mode: 'hard', drive: 1 }, 0, 1);
  }
}
