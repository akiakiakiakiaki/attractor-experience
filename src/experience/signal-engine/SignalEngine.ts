import { ModulationMatrix } from './ModulationMatrix';
import type { SignalContext, SignalSource } from './SignalSources';
import { EnvelopeSignal, ExternalSignal, OscillatorSignal } from './SignalSources';

export interface SignalFrame {
  time: number;
  signals: Record<string, number>;
  parameters: Record<string, number>;
}

export class SignalEngine {
  private readonly sourcesById: Map<string, SignalSource>;
  private readonly orderedSources: SignalSource[];

  constructor(sources: SignalSource[], private readonly matrix: ModulationMatrix) {
    this.sourcesById = new Map(sources.map((source) => [source.id, source]));
    if (this.sourcesById.size !== sources.length) throw new Error('Signal source IDs must be unique.');
    this.orderedSources = this.orderSources(sources);
  }

  setInput(id: string, value: number): void {
    const source = this.sourcesById.get(id);
    if (!(source instanceof ExternalSignal)) throw new Error(`Signal is not an external input: ${id}`);
    source.setValue(value);
  }

  setEnvelopeTarget(id: string, target: number): void {
    const source = this.sourcesById.get(id);
    if (!(source instanceof EnvelopeSignal)) throw new Error(`Signal is not an envelope: ${id}`);
    source.envelope.target = target;
  }

  setEnvelopeTimes(id: string, attack: number, release: number): void {
    const source = this.sourcesById.get(id);
    if (!(source instanceof EnvelopeSignal)) throw new Error(`Signal is not an envelope: ${id}`);
    source.setTimes(attack, release);
  }

  triggerEnvelope(id: string, amount = 1): void {
    const source = this.sourcesById.get(id);
    if (!(source instanceof EnvelopeSignal)) throw new Error(`Signal is not an envelope: ${id}`);
    source.envelope.trigger(amount);
  }

  sampleOscillator(id: string, time: number): number {
    const source = this.sourcesById.get(id);
    if (!(source instanceof OscillatorSignal)) throw new Error(`Signal is not an oscillator: ${id}`);
    return source.oscillator.value(time);
  }

  evaluateTarget(
    id: string,
    signals: Readonly<Record<string, number>>,
    overrides: Readonly<Record<string, number>> = {},
  ): number {
    return this.matrix.evaluateTarget(id, signals, overrides);
  }

  tick(time: number, dt: number): SignalFrame {
    const signals: Record<string, number> = {};
    const context: SignalContext = { time, dt, signals };
    for (const source of this.orderedSources) signals[source.id] = source.sample(context);
    return { time, signals, parameters: this.matrix.evaluate(signals) };
  }

  private orderSources(sources: SignalSource[]): SignalSource[] {
    const remaining = new Map(sources.map((source) => [source.id, source]));
    const ordered: SignalSource[] = [];

    while (remaining.size > 0) {
      const ready = [...remaining.values()].filter((source) =>
        (source.dependencies ?? []).every((id) => {
          if (!this.sourcesById.has(id)) throw new Error(`Unknown signal dependency: ${id}`);
          return ordered.some((resolved) => resolved.id === id);
        }),
      );
      if (ready.length === 0) throw new Error('Signal graph contains a dependency cycle.');
      for (const source of ready) {
        ordered.push(source);
        remaining.delete(source.id);
      }
    }

    return ordered;
  }
}
