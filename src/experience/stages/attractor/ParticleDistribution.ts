import config from './AttractorConfig';
import { Noise } from '../../signal-engine/Noise';
import { Saturation } from '../../signal-engine/Saturation';

const saturation = config.signalProcessing.saturation;

export function sampleHorizontalPosition(uniform: number, biasPower: number): number {
  const bias = 1 - 1 / Math.max(0.001, biasPower);
  let position = uniform;

  for (let iteration = 0; iteration < 7; iteration++) {
    const angle = position * Math.PI * 2;
    const cumulative = position + bias * (1 - Math.cos(angle)) / (Math.PI * 2);
    const density = 1 + bias * Math.sin(angle);
    position = Saturation.clamp(position - (cumulative - uniform) / density, 0, 1);
  }

  return position;
}

export interface VeilProfile {
  mainCenter: number;
  secondCenter: number;
  mainSpread: number;
  secondSpread: number;
  mainShare: number;
}

export function sampleVeilProfile(xProgress: number): VeilProfile {
  const x = Saturation.process(xProgress, saturation, 0, 1);
  const distribution = config.distribution;
  const loop = (1 - Math.cos(x * Math.PI * 2)) / 2;
  const mainNoise = distribution.mainVeil.noise.reduce(
    (sum, layer) => sum + Noise.periodic1D(x, layer.seed, layer.scale) * layer.amplitude,
    0,
  );
  const secondNoise = distribution.secondVeil.noise.reduce(
    (sum, layer) => sum + Noise.periodic1D(x, layer.seed, layer.scale) * layer.amplitude,
    0,
  );
  return {
    mainCenter: distribution.mainVeil.centerY + loop * distribution.mainVeil.excursion + mainNoise,
    secondCenter: distribution.secondVeil.centerY + loop * distribution.secondVeil.excursion + secondNoise,
    mainSpread: distribution.mainVeil.spread.base + Noise.periodic1D(x, distribution.mainVeil.spread.seed, distribution.mainVeil.spread.noiseScale) * distribution.mainVeil.spread.noiseAmplitude,
    secondSpread: distribution.secondVeil.spread.base + Noise.periodic1D(x, distribution.secondVeil.spread.seed, distribution.secondVeil.spread.noiseScale) * distribution.secondVeil.spread.noiseAmplitude,
    mainShare: Saturation.process(
      distribution.mainVeil.share.start -
        loop * distribution.mainVeil.share.falloff +
        Math.sin(x * Math.PI * 2) * distribution.mainVeil.share.directionalBias,
      saturation,
      0,
      1,
    ),
  };
}

export function sampleSizePreference(xProgress: number, yProgress: number, profile: VeilProfile): number {
  const clustering = config.particles.sizeClustering;
  const noise = (Noise.periodic2D(xProgress, yProgress, clustering.noiseSeed, clustering.noiseScale) + 1) / 2;
  const mainCore = Saturation.process(1 - Math.abs(yProgress - profile.mainCenter) / (profile.mainSpread * 2.2), saturation, 0, 1);
  const secondCore = Saturation.process(1 - Math.abs(yProgress - profile.secondCenter) / (profile.secondSpread * 2.2), saturation, 0, 1);
  const veilCore = Math.max(mainCore, secondCore);
  const clusteredPreference = noise * (1 - clustering.veilCoreWeight) + veilCore * clustering.veilCoreWeight;
  return Saturation.process(clusteredPreference * 2 - 1, saturation);
}

export function selectParticleSizeBand(sizeChoice: number, preference: number) {
  const { sizeBands, sizeClustering } = config.particles;
  const shifts = [sizeClustering.smallBandThresholdShift, sizeClustering.mediumBandThresholdShift];
  return sizeBands.find((band, index) => {
    const threshold = band.upperShare - preference * (shifts[index] ?? 0);
    return sizeChoice < threshold;
  }) ?? sizeBands[sizeBands.length - 1]!;
}
