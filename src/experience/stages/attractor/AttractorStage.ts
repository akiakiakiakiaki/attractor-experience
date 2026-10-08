import config from './AttractorConfig';
import { ModulationMatrix } from '../../signal-engine/ModulationMatrix';
import { SignalEngine, type SignalFrame } from '../../signal-engine/SignalEngine';
import { createAttractorPatch, parameterIds, signalIds } from './AttractorPatch';
import type { Attractor, Vec2 } from '../../types';

const MAX_GRAIN_SEED = 1000;
const MIN_OPENNESS_LOOKUP_INTERVALS = 16;
const MAX_OPENNESS_LOOKUP_INTERVALS = 1024;

function parameter(frame: SignalFrame, id: string): number {
  const value = frame.parameters[id];
  if (value === undefined) throw new Error(`Attractor signal patch did not produce parameter: ${id}`);
  return value;
}

function createOpennessLookupSize(): number {
  const phaseSpan = MAX_GRAIN_SEED * config.wordmark.influence.phaseJitter;
  const cycles = phaseSpan * config.wordmark.influence.oscillationFrequency;
  return Math.max(
    MIN_OPENNESS_LOOKUP_INTERVALS,
    Math.min(MAX_OPENNESS_LOOKUP_INTERVALS, Math.ceil(cycles * 128)),
  );
}

const OPENNESS_LOOKUP_INTERVALS = createOpennessLookupSize();
const OPENNESS_PHASE_SPAN = MAX_GRAIN_SEED * config.wordmark.influence.phaseJitter;

export interface AttractorStageFrame extends SignalFrame {
  cursor: Vec2;
  cursorVelocity: Vec2;
  energy: number;
  dampingRate: number;
  personalDriftStrength: number;
  wordmarkOpenness: number;
  wordmarkOpennessSamples: Float32Array;
  wordmarkOpennessPhaseSpan: number;
  reveal: number;
  remoteAttractionStrength: number;
  gatherStrength: number;
  impulse: number;
  attractors: Attractor[];
}

const attractorSources = config.attractors.sources;

export class AttractorStage {
  readonly id = 'attractor';
  private readonly engine: SignalEngine;
  private readonly wordmarkOpennessSamples = new Float32Array(OPENNESS_LOOKUP_INTERVALS + 1);

  constructor() {
    const patch = createAttractorPatch();
    this.engine = new SignalEngine(
      patch.sources,
      new ModulationMatrix(patch.targets, patch.routes, config.signalProcessing.saturation),
    );
  }

  setCursor(position: Vec2, velocity: Vec2, width: number, height: number): void {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    this.engine.setInput(signalIds.cursorX, position.x / safeWidth);
    this.engine.setInput(signalIds.cursorY, position.y / safeHeight);
    this.engine.setInput(signalIds.cursorVelocityX, velocity.x * 1000 / safeWidth);
    this.engine.setInput(signalIds.cursorVelocityY, velocity.y * 1000 / safeHeight);
  }

  setEnergy(value: number): void {
    this.engine.setInput(signalIds.interactionEnergy, value);
  }

  setRevealTarget(value: number): void {
    this.engine.setEnvelopeTarget(signalIds.revealEnvelope, value);
  }

  setReducedMotion(reduced: boolean): void {
    this.engine.setEnvelopeTimes(
      signalIds.revealEnvelope,
      reduced ? config.wordmark.reveal.reducedAttackSeconds : config.wordmark.reveal.attackSeconds,
      reduced ? config.wordmark.reveal.reducedReleaseSeconds : config.wordmark.reveal.releaseSeconds,
    );
  }

  triggerImpulse(amount: number): void {
    this.engine.triggerEnvelope(signalIds.impulseEnvelope, amount);
  }

  tick(time: number, dt: number, width: number, height: number): AttractorStageFrame {
    const frame = this.engine.tick(time, dt);
    this.updateWordmarkOpennessSamples(time, frame.signals);

    const energy = parameter(frame, parameterIds.interactionEnergy);
    const first = parameter(frame, signalIds.attractorParameters[0]);
    const second = parameter(frame, signalIds.attractorParameters[1]);
    const third = parameter(frame, signalIds.attractorParameters[2]);

    return {
      ...frame,
      cursor: {
        x: parameter(frame, parameterIds.cursorX) * width,
        y: parameter(frame, parameterIds.cursorY) * height,
      },
      cursorVelocity: {
        x: parameter(frame, parameterIds.cursorVelocityX) * width / 1000,
        y: parameter(frame, parameterIds.cursorVelocityY) * height / 1000,
      },
      energy,
      dampingRate: parameter(frame, parameterIds.damping),
      personalDriftStrength: parameter(frame, parameterIds.personalDriftStrength),
      wordmarkOpenness: parameter(frame, parameterIds.wordmarkOpenness),
      wordmarkOpennessSamples: this.wordmarkOpennessSamples,
      wordmarkOpennessPhaseSpan: OPENNESS_PHASE_SPAN,
      reveal: parameter(frame, parameterIds.wordmarkReveal),
      remoteAttractionStrength: parameter(frame, parameterIds.remoteAttractionStrength),
      gatherStrength: parameter(frame, parameterIds.gatherStrength),
      impulse: parameter(frame, parameterIds.impulse),
      attractors: this.createAttractors(width, height, energy, first, second, third),
    };
  }

  private updateWordmarkOpennessSamples(time: number, signals: Readonly<Record<string, number>>): void {
    for (let index = 0; index <= OPENNESS_LOOKUP_INTERVALS; index += 1) {
      const phaseOffset = OPENNESS_PHASE_SPAN * index / OPENNESS_LOOKUP_INTERVALS;
      const boundarySignal = this.engine.sampleOscillator(
        signalIds.boundaryLfo,
        time + phaseOffset,
      );
      this.wordmarkOpennessSamples[index] = this.engine.evaluateTarget(
        parameterIds.wordmarkOpenness,
        signals,
        { [signalIds.boundaryLfo]: boundarySignal },
      );
    }
  }

  private createAttractors(
    width: number,
    height: number,
    energy: number,
    first: number,
    second: number,
    third: number,
  ): Attractor[] {
    return attractorSources.map((source) => ({
      position: {
        x: width * (
          source.x +
          (source.xFromFirst ?? 0) * first +
          (source.xFromSecond ?? 0) * second +
          (source.xFromThird ?? 0) * third
        ),
        y: height * (
          source.y +
          (source.yFromFirst ?? 0) * first +
          (source.yFromSecond ?? 0) * second +
          (source.yFromThird ?? 0) * third
        ),
      },
      strength: source.baseStrength + energy * source.energyStrength,
      radius: Math.min(width, height) * source.radiusScale,
    }));
  }
}
