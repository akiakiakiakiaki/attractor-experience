import { describe, expect, it } from 'vitest';
import { ModulationMatrix } from '@/experience/signal-engine/ModulationMatrix';
import { SignalEngine } from '@/experience/signal-engine/SignalEngine';
import {
  EnvelopeSignal,
  ExternalSignal,
  PowerSignal,
  type SignalSource,
} from '@/experience/signal-engine/SignalSources';

const saturation = { mode: 'hard' as const, drive: 1 };

describe('SignalEngine and ModulationMatrix', () => {
  it('evaluates dependent signal sources in dependency order', () => {
    const shaped = new PowerSignal('input.shaped', 'input.external', 2);
    const external = new ExternalSignal('input.external', 0.5);
    const matrix = new ModulationMatrix(
      [{ id: 'motion.amount', base: 0, minimum: 0, maximum: 1 }],
      [{ source: 'input.shaped', target: 'motion.amount', amount: 2 }],
      saturation,
    );
    const engine = new SignalEngine([shaped, external], matrix);

    const frame = engine.tick(0, 1 / 60);

    expect(frame.signals['input.shaped']).toBe(0.25);
    expect(frame.parameters['motion.amount']).toBe(0.5);
  });

  it('applies additive and multiplicative routes, then clamps the target range', () => {
    const matrix = new ModulationMatrix(
      [{ id: 'motion.amount', base: 2, minimum: 0, maximum: 5 }],
      [
        { source: 'source.add', target: 'motion.amount', amount: 2 },
        { source: 'source.multiply', target: 'motion.amount', amount: 2, mode: 'multiply' },
      ],
      saturation,
    );

    expect(matrix.evaluate({ 'source.add': 0.5, 'source.multiply': 0.5 })['motion.amount']).toBe(5);
    expect(matrix.evaluateTarget('motion.amount', { 'source.add': 0.5, 'source.multiply': 0 }, {
      'source.add': -0.5,
    })).toBe(1);
  });

  it('allows external inputs and envelope triggers to update their sources', () => {
    const external = new ExternalSignal('input.cursor', 0);
    const envelope = new EnvelopeSignal('control.envelope', 0.01, 0.1);
    const engine = new SignalEngine(
      [external, envelope],
      new ModulationMatrix([], [], saturation),
    );

    engine.setInput('input.cursor', 0.75);
    engine.triggerEnvelope('control.envelope');
    const frame = engine.tick(0, 1 / 60);

    expect(frame.signals['input.cursor']).toBe(0.75);
    expect(frame.signals['control.envelope']).toBeGreaterThan(0);
  });

  it('rejects unknown dependencies and cyclic source graphs', () => {
    const missingDependency: SignalSource = {
      id: 'source.missing',
      dependencies: ['not.registered'],
      sample: () => 0,
    };
    const first: SignalSource = {
      id: 'source.first',
      dependencies: ['source.second'],
      sample: () => 0,
    };
    const second: SignalSource = {
      id: 'source.second',
      dependencies: ['source.first'],
      sample: () => 0,
    };
    const matrix = new ModulationMatrix([], [], saturation);

    expect(() => new SignalEngine([missingDependency], matrix)).toThrow(/Unknown signal dependency/);
    expect(() => new SignalEngine([first, second], matrix)).toThrow(/dependency cycle/);
  });
});
