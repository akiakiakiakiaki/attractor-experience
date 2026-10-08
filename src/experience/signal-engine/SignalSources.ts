import { Envelope, Oscillator, type Waveform } from './audioMath';
import { Noise } from './Noise';

export interface SignalContext {
  time: number;
  dt: number;
  signals: Readonly<Record<string, number>>;
}

export interface SignalSource {
  id: string;
  dependencies?: string[];
  sample(context: SignalContext): number;
}

export class OscillatorSignal implements SignalSource {
  readonly oscillator: Oscillator;
  readonly dependencies: string[];

  constructor(
    readonly id: string,
    config: { frequency: number; phase: number; amplitude: number; waveform: Waveform },
    private readonly phaseModulator?: { source: string; depth: number },
  ) {
    this.oscillator = new Oscillator(config.frequency, config.phase, config.amplitude, config.waveform);
    this.dependencies = phaseModulator ? [phaseModulator.source] : [];
  }

  sample(context: SignalContext): number {
    const phaseOffset = this.phaseModulator
      ? (context.signals[this.phaseModulator.source] ?? 0) * this.phaseModulator.depth
      : 0;
    return this.oscillator.value(context.time + phaseOffset);
  }
}

export class EnvelopeSignal implements SignalSource {
  readonly envelope = new Envelope();

  constructor(
    readonly id: string,
    private attack: number,
    private release: number,
  ) {}

  setTimes(attack: number, release: number): void {
    this.attack = attack;
    this.release = release;
  }

  sample({ dt }: SignalContext): number {
    return this.envelope.tick(dt, this.attack, this.release);
  }
}

/** A reusable waveshaper that maps a normalized control signal through a power curve. */
export class PowerSignal implements SignalSource {
  readonly dependencies: string[];

  constructor(
    readonly id: string,
    private readonly input: string,
    private readonly exponent: number,
  ) {
    this.dependencies = [input];
  }

  sample({ signals }: SignalContext): number {
    const value = signals[this.input];
    if (value === undefined) throw new Error(`Unknown signal input: ${this.input}`);
    return Math.pow(Math.max(0, Math.min(1, value)), Math.max(0.001, this.exponent));
  }
}

export class ExternalSignal implements SignalSource {
  constructor(readonly id: string, private value: number) {}

  setValue(value: number): void {
    this.value = value;
  }

  sample(): number {
    return this.value;
  }
}

export class NoiseSignal implements SignalSource {
  constructor(
    readonly id: string,
    private readonly seed: number,
    private readonly frequency: number,
    private readonly amplitude: number,
  ) {}

  sample({ time }: SignalContext): number {
    return Noise.periodic1D(time * this.frequency, this.seed, 1) * this.amplitude;
  }
}
