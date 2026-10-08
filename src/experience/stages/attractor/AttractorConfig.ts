import config from './config.json';
import type { ModulationRoute } from '../../signal-engine/ModulationMatrix';
import type { SaturationSettings } from '../../signal-engine/Saturation';
import type { Waveform } from '../../signal-engine/audioMath';

interface NoiseLayer {
  scale: number;
  amplitude: number;
  seed: number;
}

interface NoiseSpread {
  base: number;
  noiseScale: number;
  noiseAmplitude: number;
  seed: number;
}

interface AttractorSourceConfig {
  x: number;
  y: number;
  xFromFirst?: number;
  xFromSecond?: number;
  xFromThird?: number;
  yFromFirst?: number;
  yFromSecond?: number;
  yFromThird?: number;
  baseStrength: number;
  energyStrength: number;
  radiusScale: number;
}

export interface AttractorConfig {
  canvas: {
    maxDevicePixelRatio: number;
  };
  signalProcessing: {
    saturation: SaturationSettings;
  };
  signalEngine: {
    routes: ModulationRoute[];
  };
  particles: {
    countPerArea: number;
    minimumCount: number;
    maximumCount: number;
    seed: number;
    reducedMotionScale: number;
    sizeScaling: {
      referenceDiagonal: number;
      factor: number;
      minimumScale: number;
      maximumScale: number;
    };
    sizeBands: Array<{
      upperShare: number;
      minimum: number;
      range: number;
      exponent: number;
    }>;
    sizeClustering: {
      noiseScale: number;
      noiseSeed: number;
      veilCoreWeight: number;
      smallBandThresholdShift: number;
      mediumBandThresholdShift: number;
    };
    sizeFallDrift: number;
  };
  distribution: {
    leftBiasPower: number;
    noiseSamples: number;
    mainVeil: {
      centerY: number;
      excursion: number;
      noise: NoiseLayer[];
      spread: NoiseSpread;
      share: { start: number; falloff: number; directionalBias: number };
    };
    secondVeil: {
      centerY: number;
      excursion: number;
      noise: NoiseLayer[];
      spread: NoiseSpread;
      share: number;
    };
  };
  motion: {
    damping: number;
    dampingLfo: { frequency: number; phase: number; amplitude: number };
    personalDriftNoise: { seed: number; frequency: number };
    curl: {
      xCycles: number;
      timeFrequency: number;
      yCycles: number;
      yTimeFrequency: number;
      amount: number;
    };
    horizontalFlow: {
      yCycles: number;
      timeFrequency: number;
      curlAmount: number;
      strength: number;
      personalDriftFrequency: number;
      personalDriftStrength: number;
    };
    verticalFlow: {
      xCycles: number;
      timeFrequency: number;
      curlAmount: number;
      settlingSpeed: number;
      strength: number;
    };
  };
  attractors: {
    oscillators: Array<{
      frequency: number;
      phase: number;
      amplitude: number;
      waveform: Waveform;
    }>;
    coupling: { firstToSecond: number; secondToThird: number };
    sources: AttractorSourceConfig[];
    forceFalloff: number;
    softening: number;
    forceDistanceRadiusMultiplier: number;
  };
  interaction: {
    pointer: {
      initialOffset: number;
      influenceRadius: number;
      force: number;
      velocityGain: number;
      forceDistanceRadiusMultiplier: number;
      flow: {
        velocityFollowPerSecond: number;
        radiusMultiplier: number;
        falloffPower: number;
        fullSpeedPixelsPerMillisecond: number;
        decaySeconds: number;
        smoothing: number;
        vortex: number;
      };
    };
    energy: {
      maximum: number;
      activeDecaySeconds: number;
      restingDecaySeconds: number;
      idleAfterMilliseconds: number;
    };
    trigger: {
      amount: number;
      clickEnergy: number;
      energyGain: number;
      attackSeconds: number;
      releaseSeconds: number;
    };
  };
  wordmark: {
    claim: string;
    modulation: {
      gatherStrengthLfo: { frequency: number; phase: number; amplitude: number };
    };
    remoteAttraction: {
      maximumStrength: number;
      minimumDistance: number;
      rampDistance: number;
    };
    mask: {
      contentWidth: number;
      contentHeight: number;
      paddingX: number;
      paddingY: number;
    };
    layout: {
      maximumWidth: number;
      widthRatio: number;
      compactWidthRatio: number;
      compactViewportMaxWidth: number;
      compactViewportMaxHeight: number;
      centerY: number;
      verticalOffset: number;
      claimGap: number;
    };
    reveal: {
      attackSeconds: number;
      releaseSeconds: number;
      reducedAttackSeconds: number;
      reducedReleaseSeconds: number;
    };
    influence: {
      repulsionBand: number;
      gatherBand: number;
      attractionReach: number;
      attractionFarFalloffExponent: number;
      densityControl: {
        cellSize: number;
        targetDensityMultiplier: number;
        strength: number;
        radius: number;
      };
      repulsionStrength: number;
      interiorPushDistance: number;
      interiorPushStrength: number;
      gatherStrength: number;
      minimumResistance: number;
      ingressStrength: number;
      oscillationFrequency: number;
      oscillationAmplitude: number;
      phaseJitter: number;
      outsideCirculation: number;
      insideCirculation: number;
    };
  };
  renderer: {
    grainAtlas: {
      spriteSize: number;
      columns: number;
      rows: number;
      contourPoints: number;
      contourRadius: number;
      contourHeight: number;
      contourShapeHeightStep: number;
      shapePhase: number;
      radialBase: number;
      radialWaveA: number;
      radialWaveAFrequency: number;
      radialWaveASeedMultiplier: number;
      radialWaveB: number;
      radialWaveBFrequency: number;
      radialWaveBSeedMultiplier: number;
      grainCount: number;
      grainOpacity: number;
      grainRadiusBase: number;
      grainRadiusRange: number;
      grainRadiusIndexOffset: number;
      grainSizeBase: number;
      grainSizeStep: number;
      grainSizeModulo: number;
      grainSizeIndexStep: number;
      grainXScale: number;
      grainYScale: number;
      grainHeightScale: number;
      grainSeedAngleMultiplier: number;
      grainAngleStep: number;
      grainRotationPhase: number;
      grainRadiusSeedMultiplier: number;
      shapeSeedMultiplier: number;
      rotationSeedMultiplier: number;
      widthScaleSeedMultiplier: number;
      heightScaleSeedMultiplier: number;
      widthScaleBase: number;
      widthScaleRange: number;
      heightScaleBase: number;
      heightScaleRange: number;
      opacityBase: number;
      opacityPerSize: number;
      opacitySizeCap: number;
      microBatchThreshold: number;
      microBatchOpacity: number;
      revealThreshold: number;
      wordmarkRevealOpacityExponent: number;
      claimLetterSpacing: number;
    };
  };
}

function parseWaveform(value: string): Waveform {
  if (value === 'sine' || value === 'tri' || value === 'saw' || value === 'rect') return value;
  throw new Error(`Invalid oscillator waveform in Attractor config: ${value}`);
}

function parseSaturationMode(value: string): SaturationSettings['mode'] {
  if (value === 'hard' || value === 'soft') return value;
  throw new Error(`Invalid saturation mode in Attractor config: ${value}`);
}

function parseModulationMode(value: string): ModulationRoute['mode'] {
  if (value === 'add' || value === 'multiply') return value;
  throw new Error(`Invalid modulation mode in Attractor config: ${value}`);
}

function assertFiniteNumbers(value: unknown, path = 'Attractor config'): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} must be a finite number.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteNumbers(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === 'object' && value !== null) {
    Object.entries(value).forEach(([key, item]) => assertFiniteNumbers(item, `${path}.${key}`));
  }
}

function assertPositive(value: number, path: string): void {
  if (value <= 0) throw new Error(`${path} must be greater than zero.`);
}

function assertUnitInterval(value: number, path: string): void {
  if (value < 0 || value > 1) throw new Error(`${path} must be between zero and one.`);
}

function validateConfig(config: AttractorConfig): void {
  assertFiniteNumbers(config);
  assertPositive(config.canvas.maxDevicePixelRatio, 'canvas.maxDevicePixelRatio');
  assertPositive(config.signalProcessing.saturation.drive, 'signalProcessing.saturation.drive');
  assertPositive(config.particles.countPerArea, 'particles.countPerArea');
  assertPositive(config.particles.minimumCount, 'particles.minimumCount');
  assertPositive(config.particles.maximumCount, 'particles.maximumCount');
  if (
    !Number.isInteger(config.particles.minimumCount) ||
    !Number.isInteger(config.particles.maximumCount) ||
    config.particles.minimumCount > config.particles.maximumCount
  ) {
    throw new Error('Particle count limits must be ordered positive integers.');
  }
  assertUnitInterval(config.particles.reducedMotionScale, 'particles.reducedMotionScale');
  assertPositive(config.particles.sizeScaling.referenceDiagonal, 'particles.sizeScaling.referenceDiagonal');
  if (config.particles.sizeScaling.minimumScale <= 0 ||
      config.particles.sizeScaling.maximumScale < config.particles.sizeScaling.minimumScale) {
    throw new Error('Particle size scaling limits must be positive and ordered.');
  }
  if (!Number.isInteger(config.distribution.noiseSamples) || config.distribution.noiseSamples <= 0) {
    throw new Error('distribution.noiseSamples must be a positive integer.');
  }
  let previousUpperShare = -1;
  for (const [index, band] of config.particles.sizeBands.entries()) {
    assertUnitInterval(band.upperShare, `particles.sizeBands[${index}].upperShare`);
    if (band.upperShare <= previousUpperShare || band.minimum < 0 || band.range < 0 || band.exponent <= 0) {
      throw new Error(`particles.sizeBands[${index}] contains invalid limits.`);
    }
    previousUpperShare = band.upperShare;
  }
  if (config.particles.sizeBands.at(-1)?.upperShare !== 1) {
    throw new Error('The final particle size band must cover the full distribution.');
  }
  for (const [index, oscillator] of config.attractors.oscillators.entries()) {
    if (oscillator.frequency < 0 || oscillator.amplitude < 0) {
      throw new Error(`attractors.oscillators[${index}] has a negative frequency or amplitude.`);
    }
  }
  assertPositive(config.attractors.softening, 'attractors.softening');
  assertPositive(
    config.attractors.forceDistanceRadiusMultiplier,
    'attractors.forceDistanceRadiusMultiplier',
  );
  for (const [index, source] of config.attractors.sources.entries()) {
    assertPositive(source.radiusScale, `attractors.sources[${index}].radiusScale`);
  }
  assertPositive(config.interaction.pointer.influenceRadius, 'interaction.pointer.influenceRadius');
  assertPositive(
    config.interaction.pointer.forceDistanceRadiusMultiplier,
    'interaction.pointer.forceDistanceRadiusMultiplier',
  );
  assertPositive(
    config.interaction.pointer.flow.fullSpeedPixelsPerMillisecond,
    'interaction.pointer.flow.fullSpeedPixelsPerMillisecond',
  );
  assertPositive(config.interaction.pointer.flow.decaySeconds, 'interaction.pointer.flow.decaySeconds');
  assertPositive(config.interaction.pointer.flow.falloffPower, 'interaction.pointer.flow.falloffPower');
  assertUnitInterval(config.interaction.pointer.flow.smoothing, 'interaction.pointer.flow.smoothing');
  assertPositive(config.interaction.energy.maximum, 'interaction.energy.maximum');
  assertPositive(config.interaction.energy.activeDecaySeconds, 'interaction.energy.activeDecaySeconds');
  assertPositive(config.interaction.energy.restingDecaySeconds, 'interaction.energy.restingDecaySeconds');
  assertPositive(config.interaction.trigger.attackSeconds, 'interaction.trigger.attackSeconds');
  assertPositive(config.interaction.trigger.releaseSeconds, 'interaction.trigger.releaseSeconds');
  const { layout, influence, reveal } = config.wordmark;
  assertPositive(layout.maximumWidth, 'wordmark.layout.maximumWidth');
  assertPositive(layout.widthRatio, 'wordmark.layout.widthRatio');
  assertPositive(layout.compactWidthRatio, 'wordmark.layout.compactWidthRatio');
  assertUnitInterval(layout.widthRatio, 'wordmark.layout.widthRatio');
  assertUnitInterval(layout.compactWidthRatio, 'wordmark.layout.compactWidthRatio');
  assertPositive(layout.compactViewportMaxWidth, 'wordmark.layout.compactViewportMaxWidth');
  assertPositive(layout.compactViewportMaxHeight, 'wordmark.layout.compactViewportMaxHeight');
  assertPositive(reveal.attackSeconds, 'wordmark.reveal.attackSeconds');
  assertPositive(reveal.releaseSeconds, 'wordmark.reveal.releaseSeconds');
  assertPositive(reveal.reducedAttackSeconds, 'wordmark.reveal.reducedAttackSeconds');
  assertPositive(reveal.reducedReleaseSeconds, 'wordmark.reveal.reducedReleaseSeconds');
  assertPositive(config.wordmark.remoteAttraction.rampDistance, 'wordmark.remoteAttraction.rampDistance');
  assertPositive(config.wordmark.mask.contentWidth, 'wordmark.mask.contentWidth');
  assertPositive(config.wordmark.mask.contentHeight, 'wordmark.mask.contentHeight');
  if (influence.repulsionBand <= 0 || influence.gatherBand <= influence.repulsionBand) {
    throw new Error('Wordmark gathering must extend beyond a positive repulsion band.');
  }
  if (influence.oscillationFrequency < 0 || influence.phaseJitter < 0) {
    throw new Error('Wordmark oscillator frequency and phase jitter cannot be negative.');
  }
  assertPositive(influence.densityControl.cellSize, 'wordmark.influence.densityControl.cellSize');
  assertPositive(influence.densityControl.radius, 'wordmark.influence.densityControl.radius');
  assertPositive(
    influence.densityControl.targetDensityMultiplier,
    'wordmark.influence.densityControl.targetDensityMultiplier',
  );
  const grainAtlas = config.renderer.grainAtlas;
  for (const [path, value] of [
    ['spriteSize', grainAtlas.spriteSize],
    ['columns', grainAtlas.columns],
    ['rows', grainAtlas.rows],
    ['contourPoints', grainAtlas.contourPoints],
    ['grainCount', grainAtlas.grainCount],
    ['grainRadiusRange', grainAtlas.grainRadiusRange],
    ['grainSizeModulo', grainAtlas.grainSizeModulo],
  ] as const) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`renderer.grainAtlas.${path} must be a positive integer.`);
    }
  }
}

const typedConfig: AttractorConfig = {
  ...config,
  signalEngine: {
    routes: config.signalEngine.routes.map((route): ModulationRoute => ({
      source: route.source,
      target: route.target,
      amount: route.amount,
      ...(route.mode === undefined ? {} : { mode: parseModulationMode(route.mode) }),
    })),
  },
  signalProcessing: {
    saturation: {
      ...config.signalProcessing.saturation,
      mode: parseSaturationMode(config.signalProcessing.saturation.mode),
    },
  },
  attractors: {
    ...config.attractors,
    oscillators: config.attractors.oscillators.map((oscillator) => ({
      ...oscillator,
      waveform: parseWaveform(oscillator.waveform),
    })),
  },
};

validateConfig(typedConfig);

export default typedConfig;
