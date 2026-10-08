import type { Attractor, Vec2 } from '../../types';
import type { AttractorConfig } from './AttractorConfig';
import config from './AttractorConfig';
import { Noise } from '../../signal-engine/Noise';
import { Saturation } from '../../signal-engine/Saturation';
import type { InfluenceMask } from './InfluenceMask';
import {
  sampleHorizontalPosition,
  sampleSizePreference,
  sampleVeilProfile,
  selectParticleSizeBand,
} from './ParticleDistribution';

export interface Grain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  seed: number;
}

export interface ParticleFieldModulation {
  dampingRate: number;
  wordmarkOpenness: number;
  gatherStrength: number;
  personalDriftStrength: number;
  remoteAttractionStrength: number;
  wordmarkOpennessSamples?: Float32Array;
  wordmarkOpennessPhaseSpan?: number;
}

type LogoBox = { x: number; y: number; w: number; h: number };
type PreparedAttractor = {
  x: number;
  y: number;
  sinX: number;
  cosX: number;
  sinY: number;
  cosY: number;
  strength: number;
  radiusSquared: number;
  maxDistanceSquared: number;
};

interface ParticleStepContext {
  dt: number;
  time: number;
  pace: number;
  damping: number;
  motion: AttractorConfig['motion'];
  modulation: ParticleFieldModulation;
  activeAttractors: PreparedAttractor[];
  pointer: Vec2;
  energy: number;
  pointerActive: boolean;
  pointerMaxDistanceSquared: number;
  pointerInfluenceRadius: number;
  pointerForce: number;
  pointerFlow: AttractorConfig['interaction']['pointer']['flow'];
  hasPointerFlow: boolean;
  targetVelocityX: number;
  targetVelocityY: number;
  pointerFlowRadius: number;
  pointerFlowMaxDistanceSquared: number;
  pointerSinX: number;
  pointerCosX: number;
  pointerSinY: number;
  pointerCosY: number;
  influence: AttractorConfig['wordmark']['influence'];
  logo: InfluenceMask | null;
  logoBox: LogoBox;
  hasLogo: boolean;
  logoLeft: number;
  logoTop: number;
  logoRight: number;
  logoBottom: number;
  remoteAttractionActive: boolean;
  remoteCenterX: number;
  remoteCenterY: number;
  remoteActivationDistance: number;
  densityCellSize: number;
}

const DEFAULT_MODULATION: ParticleFieldModulation = {
  dampingRate: config.motion.damping,
  wordmarkOpenness: 0.5,
  gatherStrength: config.wordmark.influence.gatherStrength,
  personalDriftStrength: config.motion.horizontalFlow.personalDriftStrength,
  remoteAttractionStrength: 0,
};

function periodicPhase(position: number, extent: number, cycles: number): number {
  return position / extent * Math.PI * 2 * cycles;
}

function periodicDistance(delta: number, extent: number): number {
  const wrapped = Math.abs(delta);
  return Math.min(wrapped, extent - wrapped);
}

function periodicSignedDistance(delta: number, extent: number): number {
  return ((delta + extent / 2) % extent + extent) % extent - extent / 2;
}

function distanceOutsidePeriodicInterval(
  position: number,
  start: number,
  end: number,
  period: number,
): number {
  const direct = Math.max(start - position, 0, position - end);
  const wrappedLeft = Math.max(start - period - position, 0, position - (end - period));
  const wrappedRight = Math.max(start + period - position, 0, position - (end + period));
  return Math.min(direct, wrappedLeft, wrappedRight);
}

export class ParticleField {
  readonly grains: Grain[] = [];
  private width = 1;
  private height = 1;
  private densityColumns = 1;
  private densityRows = 1;
  private density = new Float32Array(1);
  private readonly noise = new Noise(config.particles.seed);

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.resizeDensityMap(width, height);

    const target = Math.min(
      config.particles.maximumCount,
      Math.max(
        config.particles.minimumCount,
        Math.round(width * height / config.particles.countPerArea),
      ),
    );

    while (this.grains.length < target) {
      this.grains.push(this.createGrain(width, height));
    }
    this.grains.length = Math.min(this.grains.length, target);
  }

  step(
    dt: number,
    time: number,
    attractors: Attractor[],
    pointer: Vec2,
    energy: number,
    logo: InfluenceMask | null,
    logoBox: LogoBox,
    reduced: boolean,
    pointerVelocity: Vec2 = { x: 0, y: 0 },
    modulation: ParticleFieldModulation = DEFAULT_MODULATION,
  ): void {
    const context = this.prepareStepContext(
      dt,
      time,
      attractors,
      pointer,
      energy,
      logo,
      logoBox,
      reduced,
      pointerVelocity,
      modulation,
    );
    const densityTarget = this.rebuildDensityMap();
    this.advanceGrains(context, densityTarget);
  }

  private resizeDensityMap(width: number, height: number): void {
    const cellSize = config.wordmark.influence.densityControl.cellSize;
    const columns = Math.max(1, Math.ceil(width / cellSize));
    const rows = Math.max(1, Math.ceil(height / cellSize));
    if (columns === this.densityColumns && rows === this.densityRows) return;

    this.densityColumns = columns;
    this.densityRows = rows;
    this.density = new Float32Array(columns * rows);
  }

  private createGrain(width: number, height: number): Grain {
    const x = sampleHorizontalPosition(
      this.noise.uniform(),
      config.distribution.leftBiasPower,
    ) * width;
    const xProgress = x / width;
    const profile = sampleVeilProfile(xProgress);
    const cloudChoice = this.noise.uniform();
    let cloudNoise = 0;
    for (let index = 0; index < config.distribution.noiseSamples; index += 1) {
      cloudNoise += this.noise.uniform();
    }
    cloudNoise = cloudNoise / (config.distribution.noiseSamples / 2) - 1;

    let y: number;
    if (cloudChoice < profile.mainShare) {
      y = (profile.mainCenter + cloudNoise * profile.mainSpread) * height;
    } else if (cloudChoice < profile.mainShare + config.distribution.secondVeil.share) {
      y = (profile.secondCenter + cloudNoise * profile.secondSpread) * height;
    } else {
      y = this.noise.uniform() * height;
    }

    const sizeChoice = this.noise.uniform();
    const sizeVariation = this.noise.uniform();
    const sizePreference = sampleSizePreference(xProgress, y / height, profile);
    const sizeBand = selectParticleSizeBand(sizeChoice, sizePreference);
    const size = sizeBand.minimum + Math.pow(sizeVariation, sizeBand.exponent) * sizeBand.range;
    return { x, y, vx: 0, vy: 0, size, seed: this.noise.uniform() * 1000 };
  }

  private prepareStepContext(
    dt: number,
    time: number,
    attractors: Attractor[],
    pointer: Vec2,
    energy: number,
    logo: InfluenceMask | null,
    logoBox: LogoBox,
    reduced: boolean,
    pointerVelocity: Vec2,
    modulation: ParticleFieldModulation,
  ): ParticleStepContext {
    const pace = reduced ? config.particles.reducedMotionScale : 1;
    const dampingRate = Math.max(0.01, modulation.dampingRate);
    const damping = Math.exp(-dampingRate * dt * pace);
    const attractorConfig = config.attractors;
    const activeAttractors = attractors.map((attractor) => ({
      x: attractor.position.x,
      y: attractor.position.y,
      sinX: Math.sin(periodicPhase(attractor.position.x, this.width, 1)),
      cosX: Math.cos(periodicPhase(attractor.position.x, this.width, 1)),
      sinY: Math.sin(periodicPhase(attractor.position.y, this.height, 1)),
      cosY: Math.cos(periodicPhase(attractor.position.y, this.height, 1)),
      strength: attractor.strength * attractorConfig.forceFalloff,
      radiusSquared: attractor.radius * attractor.radius,
      maxDistanceSquared:
        attractor.radius * attractor.radius * attractorConfig.forceDistanceRadiusMultiplier ** 2,
    }));

    const pointerConfig = config.interaction.pointer;
    const pointerFlow = pointerConfig.flow;
    const pointerSpeed = Math.hypot(pointerVelocity.x, pointerVelocity.y);
    const pointerFlowIntensity = Saturation.process(
      pointerSpeed / pointerFlow.fullSpeedPixelsPerMillisecond,
      config.signalProcessing.saturation,
      0,
      1,
    );
    const pointerFlowSpeed = pointerFlowIntensity * pointerFlow.fullSpeedPixelsPerMillisecond * 1000;
    const pointerDirectionX = pointerSpeed > 0 ? pointerVelocity.x / pointerSpeed : 0;
    const pointerDirectionY = pointerSpeed > 0 ? pointerVelocity.y / pointerSpeed : 0;
    const hasPointerFlow = pointerFlowIntensity > 0.01;
    const targetVelocityX = hasPointerFlow
      ? (pointerDirectionX - pointerDirectionY * pointerFlow.vortex) * pointerFlowSpeed
      : 0;
    const targetVelocityY = hasPointerFlow
      ? (pointerDirectionY + pointerDirectionX * pointerFlow.vortex) * pointerFlowSpeed
      : 0;
    const pointerFlowRadius = pointerConfig.influenceRadius * pointerFlow.radiusMultiplier;

    const influence = config.wordmark.influence;
    const hasLogo = logo !== null && logoBox.w > 0 && logoBox.h > 0;
    const scaleX = hasLogo && logo ? logoBox.w / logo.content.width : 0;
    const scaleY = hasLogo && logo ? logoBox.h / logo.content.height : 0;
    const logoLeft = hasLogo && logo ? logoBox.x - logo.content.x * scaleX : 0;
    const logoTop = hasLogo && logo ? logoBox.y - logo.content.y * scaleY : 0;
    const logoRight = hasLogo && logo ? logoLeft + logo.width * scaleX : 0;
    const logoBottom = hasLogo && logo ? logoTop + logo.height * scaleY : 0;
    const remoteConfig = config.wordmark.remoteAttraction;
    const remoteAttractionActive = hasLogo && modulation.remoteAttractionStrength > 0;

    return {
      dt,
      time,
      pace,
      damping,
      motion: config.motion,
      modulation,
      activeAttractors,
      pointer,
      energy,
      pointerActive: energy > 0.001,
      pointerMaxDistanceSquared:
        (pointerConfig.influenceRadius * pointerConfig.forceDistanceRadiusMultiplier) ** 2,
      pointerInfluenceRadius: pointerConfig.influenceRadius,
      pointerForce: pointerConfig.force,
      pointerFlow,
      hasPointerFlow,
      targetVelocityX,
      targetVelocityY,
      pointerFlowRadius,
      pointerFlowMaxDistanceSquared: pointerFlowRadius * pointerFlowRadius,
      pointerSinX: Math.sin(periodicPhase(pointer.x, this.width, 1)),
      pointerCosX: Math.cos(periodicPhase(pointer.x, this.width, 1)),
      pointerSinY: Math.sin(periodicPhase(pointer.y, this.height, 1)),
      pointerCosY: Math.cos(periodicPhase(pointer.y, this.height, 1)),
      influence,
      logo,
      logoBox,
      hasLogo,
      logoLeft,
      logoTop,
      logoRight,
      logoBottom,
      remoteAttractionActive,
      remoteCenterX: remoteAttractionActive ? logoBox.x + logoBox.w / 2 : 0,
      remoteCenterY: remoteAttractionActive ? logoBox.y + logoBox.h / 2 : 0,
      remoteActivationDistance: remoteAttractionActive
        ? Math.hypot(logoBox.w, logoBox.h) / 2 + remoteConfig.minimumDistance
        : 0,
      densityCellSize: influence.densityControl.cellSize,
    };
  }

  private rebuildDensityMap(): number {
    const { densityColumns, densityRows, density } = this;
    const cellSize = config.wordmark.influence.densityControl.cellSize;
    density.fill(0);

    for (const grain of this.grains) {
      const column = Math.max(0, Math.min(densityColumns - 1, Math.floor(grain.x / cellSize)));
      const row = Math.max(0, Math.min(densityRows - 1, Math.floor(grain.y / cellSize)));
      density[row * densityColumns + column] += 1;
    }

    const averageDensity = this.grains.length / density.length;
    return averageDensity * config.wordmark.influence.densityControl.targetDensityMultiplier;
  }

  private advanceGrains(context: ParticleStepContext, densityTarget: number): void {
    const {
      dt,
      time,
      pace,
      damping,
      motion,
      modulation,
      activeAttractors,
      pointer,
      energy,
      pointerActive,
      pointerMaxDistanceSquared,
      pointerInfluenceRadius,
      pointerForce,
      pointerFlow,
      hasPointerFlow,
      targetVelocityX,
      targetVelocityY,
      pointerFlowRadius,
      pointerFlowMaxDistanceSquared,
      pointerSinX,
      pointerCosX,
      pointerSinY,
      pointerCosY,
      influence,
      logo,
      logoBox,
      hasLogo,
      logoLeft,
      logoTop,
      logoRight,
      logoBottom,
      remoteAttractionActive,
      remoteCenterX,
      remoteCenterY,
      remoteActivationDistance,
      densityCellSize,
    } = context;
    const width = this.width;
    const height = this.height;
    const attractorConfig = config.attractors;
    const densityConfig = influence.densityControl;
    const { densityColumns, densityRows, density } = this;

    for (const grain of this.grains) {
      const phaseX = periodicPhase(grain.x, width, 1);
      const phaseY = periodicPhase(grain.y, height, 1);
      const sinX = Math.sin(phaseX);
      const cosX = Math.cos(phaseX);
      const sinY = Math.sin(phaseY);
      const cosY = Math.cos(phaseY);
      const curl = Math.sin(
        phaseX * motion.curl.xCycles +
          time * motion.curl.timeFrequency +
          Math.cos(phaseY * motion.curl.yCycles - time * motion.curl.yTimeFrequency),
      );
      let ax = Math.sin(
        phaseY * motion.horizontalFlow.yCycles +
          time * motion.horizontalFlow.timeFrequency +
          curl * motion.horizontalFlow.curlAmount,
      ) * motion.horizontalFlow.strength;
      let ay = motion.verticalFlow.settlingSpeed + Math.cos(
        phaseX * motion.verticalFlow.xCycles -
          time * motion.verticalFlow.timeFrequency +
          curl * motion.verticalFlow.curlAmount,
      ) * motion.verticalFlow.strength;
      ax += Math.sin(time * motion.horizontalFlow.personalDriftFrequency + grain.seed) *
        modulation.personalDriftStrength;
      ay += grain.size * config.particles.sizeFallDrift;

      if (remoteAttractionActive) {
        const toCenterX = periodicSignedDistance(remoteCenterX - grain.x, width);
        const toCenterY = periodicSignedDistance(remoteCenterY - grain.y, height);
        const centerDistance = Math.hypot(toCenterX, toCenterY);
        const ramp = Saturation.process(
          (centerDistance - remoteActivationDistance) / config.wordmark.remoteAttraction.rampDistance,
          config.signalProcessing.saturation,
          0,
          1,
        );
        const easedRamp = ramp * ramp * (3 - 2 * ramp);
        const directionLength = centerDistance || 1;
        ax += toCenterX / directionLength * modulation.remoteAttractionStrength * easedRamp;
        ay += toCenterY / directionLength * modulation.remoteAttractionStrength * easedRamp;
      }

      for (const attractor of activeAttractors) {
        const offsetX = attractor.x - grain.x;
        const offsetY = attractor.y - grain.y;
        const dx = (attractor.sinX * cosX - attractor.cosX * sinX) * width / (Math.PI * 2);
        const dy = (attractor.sinY * cosY - attractor.cosY * sinY) * height / (Math.PI * 2);
        const distanceX = periodicDistance(offsetX, width);
        const distanceY = periodicDistance(offsetY, height);
        const distanceSquared = distanceX * distanceX + distanceY * distanceY + attractorConfig.softening;
        if (distanceSquared >= attractor.maxDistanceSquared) continue;

        const force = attractor.strength * Math.exp(-distanceSquared / attractor.radiusSquared);
        ax += dx * force / Math.sqrt(distanceSquared);
        ay += dy * force / Math.sqrt(distanceSquared);
      }

      if (pointerActive || hasPointerFlow) {
        const pointerOffsetX = pointer.x - grain.x;
        const pointerOffsetY = pointer.y - grain.y;
        const dx = (pointerSinX * cosX - pointerCosX * sinX) * width / (Math.PI * 2);
        const dy = (pointerSinY * cosY - pointerCosY * sinY) * height / (Math.PI * 2);
        const distanceX = periodicDistance(pointerOffsetX, width);
        const distanceY = periodicDistance(pointerOffsetY, height);
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        if (pointerActive && distanceSquared < pointerMaxDistanceSquared) {
          const distance = Math.sqrt(distanceSquared) + 1;
          const interaction = Math.exp(-distance / pointerInfluenceRadius) * energy * pointerForce;
          ax -= dx / distance * interaction;
          ay -= dy / distance * interaction;
        }

        if (hasPointerFlow && distanceSquared < pointerFlowMaxDistanceSquared) {
          const normalizedDistance = Math.sqrt(distanceSquared) / pointerFlowRadius;
          const smoothstep = normalizedDistance * normalizedDistance * (3 - 2 * normalizedDistance);
          const falloff = Math.pow(1 - smoothstep, pointerFlow.falloffPower);
          const follow = 1 - Math.exp(-pointerFlow.velocityFollowPerSecond * dt * pace * falloff);
          grain.vx += (targetVelocityX - grain.vx) * follow;
          grain.vy += (targetVelocityY - grain.vy) * follow;
        }
      }

      if (
        hasLogo && logo &&
        grain.x > logoLeft && grain.x < logoRight &&
        grain.y > logoTop && grain.y < logoBottom
      ) {
        const sampleX = Math.max(
          1,
          Math.min(
            logo.width - 2,
            Math.floor(logo.content.x + (grain.x - logoBox.x) / logoBox.w * logo.content.width),
          ),
        );
        const sampleY = Math.max(
          1,
          Math.min(
            logo.height - 2,
            Math.floor(logo.content.y + (grain.y - logoBox.y) / logoBox.h * logo.content.height),
          ),
        );
        const index = sampleY * logo.width + sampleX;
        const distance = logo.signedDistance[index]!;

        if (distance > -(influence.gatherBand + influence.attractionReach)) {
          let openness = modulation.wordmarkOpenness;
          const samples = modulation.wordmarkOpennessSamples;
          if (samples && samples.length > 1) {
            const phaseSpan = modulation.wordmarkOpennessPhaseSpan ?? 0;
            const phaseOffset = grain.seed * influence.phaseJitter;
            const position = phaseSpan > 0
              ? Math.max(0, Math.min(1, phaseOffset / phaseSpan)) * (samples.length - 1)
              : 0;
            const sampleIndex = Math.min(samples.length - 2, Math.floor(position));
            const mix = position - sampleIndex;
            openness = samples[sampleIndex]! * (1 - mix) + samples[sampleIndex + 1]! * mix;
          }
          openness = Saturation.clamp(openness, 0, 1);

          const activeGatherBand = influence.gatherBand +
            (1 - openness) * influence.attractionReach;
          if (distance > -activeGatherBand) {
            const normalXRaw = logo.signedDistance[index + 1]! - logo.signedDistance[index - 1]!;
            const normalYRaw = logo.signedDistance[index + logo.width]! -
              logo.signedDistance[index - logo.width]!;
            const normalLength = Math.hypot(normalXRaw, normalYRaw) || 1;
            const normalX = normalXRaw / normalLength;
            const normalY = normalYRaw / normalLength;

            if (distance > -influence.repulsionBand) {
              const resistance = influence.minimumResistance +
                openness * (1 - influence.minimumResistance);
              const strength = distance >= 0
                ? influence.repulsionStrength +
                  Math.min(distance, influence.interiorPushDistance) * influence.interiorPushStrength
                : influence.repulsionStrength * (1 + distance / influence.repulsionBand);
              const ingress = (1 - openness) * influence.ingressStrength;
              ax += normalX * (ingress - strength * resistance);
              ay += normalY * (ingress - strength * resistance);
            } else {
              let weight = (distance + activeGatherBand) /
                (activeGatherBand - influence.repulsionBand);
              if (distance < -influence.gatherBand) {
                const farZone = Saturation.process(
                  (-distance - influence.gatherBand) /
                    (activeGatherBand - influence.gatherBand),
                  config.signalProcessing.saturation,
                  0,
                  1,
                );
                const strongerFarWeight = Math.pow(
                  weight,
                  influence.attractionFarFalloffExponent,
                );
                weight += (strongerFarWeight - weight) * farZone;
              }
              ax += normalX * weight * modulation.gatherStrength;
              ay += normalY * weight * modulation.gatherStrength;
            }

            if (distance > -influence.gatherBand) {
              const circulation = distance < 0
                ? influence.outsideCirculation
                : influence.insideCirculation;
              ax -= normalY * circulation;
              ay += normalX * circulation;
            }
          }
        }
      }

      const outsideDistanceX = distanceOutsidePeriodicInterval(
        grain.x,
        logoBox.x,
        logoBox.x + logoBox.w,
        width,
      );
      const outsideDistanceY = distanceOutsidePeriodicInterval(
        grain.y,
        logoBox.y,
        logoBox.y + logoBox.h,
        height,
      );
      if (outsideDistanceX <= densityConfig.radius && outsideDistanceY <= densityConfig.radius) {
        const column = Math.max(
          0,
          Math.min(densityColumns - 1, Math.floor(grain.x / densityCellSize)),
        );
        const row = Math.max(
          0,
          Math.min(densityRows - 1, Math.floor(grain.y / densityCellSize)),
        );
        const densityIndex = row * densityColumns + column;
        const cellDensity = density[densityIndex]!;
        if (cellDensity > densityTarget) {
          const left = density[row * densityColumns + (column - 1 + densityColumns) % densityColumns]!;
          const right = density[row * densityColumns + (column + 1) % densityColumns]!;
          const top = density[((row - 1 + densityRows) % densityRows) * densityColumns + column]!;
          const bottom = density[((row + 1) % densityRows) * densityColumns + column]!;
          let escapeX = left - right;
          let escapeY = top - bottom;
          const escapeLength = Math.hypot(escapeX, escapeY);

          if (escapeLength > 0) {
            const outsideDistance = Math.hypot(outsideDistanceX, outsideDistanceY);
            const proximity = Saturation.process(
              1 - outsideDistance / densityConfig.radius,
              config.signalProcessing.saturation,
              0,
              1,
            );
            const regionWeight = proximity * proximity * (3 - 2 * proximity);
            const excess = Saturation.process(
              (cellDensity - densityTarget) / densityTarget,
              config.signalProcessing.saturation,
              0,
              1,
            );
            const force = densityConfig.strength * excess * regionWeight / escapeLength;
            escapeX *= force;
            escapeY *= force;
            ax += escapeX;
            ay += escapeY;
          }
        }
      }

      this.advanceGrain(grain, dt, pace, ax, ay, damping);
    }
  }

  private advanceGrain(
    grain: Grain,
    dt: number,
    pace: number,
    ax: number,
    ay: number,
    damping: number,
  ): void {
    grain.vx = (grain.vx + ax * dt * pace) * damping;
    grain.vy = (grain.vy + ay * dt * pace) * damping;
    grain.x += grain.vx * dt * pace;
    grain.y += grain.vy * dt * pace;
    if (grain.x < 0) {
      grain.x = grain.x >= -this.width
        ? grain.x + this.width
        : (grain.x % this.width + this.width) % this.width;
    } else if (grain.x >= this.width) {
      grain.x = grain.x < this.width * 2 ? grain.x - this.width : grain.x % this.width;
    }
    if (grain.y < 0) {
      grain.y = grain.y >= -this.height
        ? grain.y + this.height
        : (grain.y % this.height + this.height) % this.height;
    } else if (grain.y >= this.height) {
      grain.y = grain.y < this.height * 2 ? grain.y - this.height : grain.y % this.height;
    }
  }
}
