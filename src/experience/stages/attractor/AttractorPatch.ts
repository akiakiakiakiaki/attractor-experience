import config from './AttractorConfig';
import type { ModulationTarget } from '../../signal-engine/ModulationMatrix';
import type { SignalSource } from '../../signal-engine/SignalSources';
import {
  EnvelopeSignal,
  ExternalSignal,
  NoiseSignal,
  OscillatorSignal,
  PowerSignal,
} from '../../signal-engine/SignalSources';

export const signalIds = {
  attractorLfos: ['attractor.lfo.1', 'attractor.lfo.2', 'attractor.lfo.3'],
  attractorParameters: [
    'attractor.modulation.1',
    'attractor.modulation.2',
    'attractor.modulation.3',
  ],
  dampingLfo: 'motion.damping.lfo',
  boundaryLfo: 'wordmark.boundary.lfo',
  gatherStrengthLfo: 'wordmark.gather-strength.lfo',
  driftNoise: 'motion.personal-drift.noise',
  revealEnvelope: 'wordmark.reveal.envelope',
  revealOpacity: 'wordmark.reveal.opacity',
  impulseEnvelope: 'interaction.impulse.envelope',
  cursorX: 'input.cursor.x',
  cursorY: 'input.cursor.y',
  cursorVelocityX: 'input.cursor.velocity.x',
  cursorVelocityY: 'input.cursor.velocity.y',
  interactionEnergy: 'input.interaction.energy',
} as const;

export const parameterIds = {
  damping: 'motion.damping',
  personalDriftStrength: 'motion.personalDriftStrength',
  wordmarkOpenness: 'wordmark.openness',
  wordmarkReveal: 'wordmark.reveal',
  remoteAttractionStrength: 'motion.remoteAttractionStrength',
  gatherStrength: 'wordmark.gatherStrength',
  impulse: 'interaction.impulse',
  interactionEnergy: 'interaction.energy',
  cursorX: 'cursor.x',
  cursorY: 'cursor.y',
  cursorVelocityX: 'cursor.velocity.x',
  cursorVelocityY: 'cursor.velocity.y',
} as const;

export function createAttractorPatch(): {
  sources: SignalSource[];
  targets: ModulationTarget[];
  routes: typeof config.signalEngine.routes;
} {
  const oscillators = config.attractors.oscillators;
  const [first, second, third] = oscillators;
  if (!first || !second || !third || oscillators.length !== 3) {
    throw new Error('Attractor patch requires exactly three attractor oscillators.');
  }

  const driftNoiseDepth = config.signalEngine.routes.find(
    ({ target }) => target === parameterIds.personalDriftStrength,
  )?.amount ?? 0;

  const sources: SignalSource[] = [
    new OscillatorSignal(signalIds.attractorLfos[0], first),
    new OscillatorSignal(signalIds.attractorLfos[1], second, {
      source: signalIds.attractorLfos[0],
      depth: config.attractors.coupling.firstToSecond,
    }),
    new OscillatorSignal(signalIds.attractorLfos[2], third, {
      source: signalIds.attractorLfos[1],
      depth: config.attractors.coupling.secondToThird,
    }),
    new OscillatorSignal(signalIds.dampingLfo, {
      ...config.motion.dampingLfo,
      waveform: 'sine',
    }),
    new OscillatorSignal(signalIds.boundaryLfo, {
      frequency: config.wordmark.influence.oscillationFrequency,
      phase: 0,
      amplitude: config.wordmark.influence.oscillationAmplitude,
      waveform: 'sine',
    }),
    new OscillatorSignal(signalIds.gatherStrengthLfo, {
      ...config.wordmark.modulation.gatherStrengthLfo,
      waveform: 'sine',
    }),
    new NoiseSignal(
      signalIds.driftNoise,
      config.motion.personalDriftNoise.seed,
      config.motion.personalDriftNoise.frequency,
      1,
    ),
    new EnvelopeSignal(
      signalIds.revealEnvelope,
      config.wordmark.reveal.attackSeconds,
      config.wordmark.reveal.releaseSeconds,
    ),
    new PowerSignal(
      signalIds.revealOpacity,
      signalIds.revealEnvelope,
      config.renderer.grainAtlas.wordmarkRevealOpacityExponent,
    ),
    new EnvelopeSignal(
      signalIds.impulseEnvelope,
      config.interaction.trigger.attackSeconds,
      config.interaction.trigger.releaseSeconds,
    ),
    new ExternalSignal(signalIds.cursorX, 0),
    new ExternalSignal(signalIds.cursorY, 0),
    new ExternalSignal(signalIds.cursorVelocityX, 0),
    new ExternalSignal(signalIds.cursorVelocityY, 0),
    new ExternalSignal(signalIds.interactionEnergy, 0),
  ];

  const targets: ModulationTarget[] = [
    ...signalIds.attractorParameters.map((id) => ({
      id,
      base: 0,
      minimum: -1,
      maximum: 1,
    })),
    {
      id: parameterIds.damping,
      base: config.motion.damping,
      minimum: Math.max(0.01, config.motion.damping - config.motion.dampingLfo.amplitude),
      maximum: config.motion.damping + config.motion.dampingLfo.amplitude,
    },
    {
      id: parameterIds.personalDriftStrength,
      base: config.motion.horizontalFlow.personalDriftStrength,
      minimum: Math.max(0, config.motion.horizontalFlow.personalDriftStrength - driftNoiseDepth),
      maximum: config.motion.horizontalFlow.personalDriftStrength + driftNoiseDepth,
    },
    { id: parameterIds.wordmarkOpenness, base: 0.5, minimum: 0, maximum: 1 },
    { id: parameterIds.wordmarkReveal, base: 0, minimum: 0, maximum: 1 },
    {
      id: parameterIds.remoteAttractionStrength,
      base: 0,
      minimum: 0,
      maximum: config.wordmark.remoteAttraction.maximumStrength,
    },
    {
      id: parameterIds.gatherStrength,
      base: config.wordmark.influence.gatherStrength,
      minimum: config.wordmark.influence.gatherStrength *
        (1 - config.wordmark.modulation.gatherStrengthLfo.amplitude),
      maximum: config.wordmark.influence.gatherStrength *
        (1 + config.wordmark.modulation.gatherStrengthLfo.amplitude),
    },
    { id: parameterIds.impulse, base: 0, minimum: 0, maximum: 1 },
    {
      id: parameterIds.interactionEnergy,
      base: 0,
      minimum: 0,
      maximum: config.interaction.energy.maximum,
    },
    { id: parameterIds.cursorX, base: 0, minimum: 0, maximum: 1, saturation: { mode: 'hard', drive: 1 } },
    { id: parameterIds.cursorY, base: 0, minimum: 0, maximum: 1, saturation: { mode: 'hard', drive: 1 } },
    { id: parameterIds.cursorVelocityX, base: 0, minimum: -8, maximum: 8, saturation: { mode: 'hard', drive: 1 } },
    { id: parameterIds.cursorVelocityY, base: 0, minimum: -8, maximum: 8, saturation: { mode: 'hard', drive: 1 } },
  ];

  const sourceIds = new Set(sources.map(({ id }) => id));
  const targetIds = new Set(targets.map(({ id }) => id));
  for (const route of config.signalEngine.routes) {
    if (!sourceIds.has(route.source)) {
      throw new Error(`Attractor modulation route references an unknown source: ${route.source}`);
    }
    if (!targetIds.has(route.target)) {
      throw new Error(`Attractor modulation route references an unknown target: ${route.target}`);
    }
  }

  return { sources, targets, routes: config.signalEngine.routes };
}
