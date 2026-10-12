import type { Vec2 } from '@/experience/types';
import { Saturation } from '@/experience/signal-engine/Saturation';
import { AttractorStage } from '@/experience/stages/attractor/AttractorStage';
import { CanvasRenderer } from '@/experience/stages/attractor/CanvasRenderer';
import { createInfluenceMask, type InfluenceMask } from '@/experience/stages/attractor/InfluenceMask';
import { ParticleField } from '@/experience/stages/attractor/ParticleField';
import { TouchGestureTracker } from './TouchGestureTracker';
import config from '@/experience/stages/attractor/AttractorConfig';

const WORDMARK_CONTENT = {
  x: config.wordmark.mask.paddingX,
  y: config.wordmark.mask.paddingY,
  width: config.wordmark.mask.contentWidth,
  height: config.wordmark.mask.contentHeight,
};

interface LoadedWordmark {
  canvas: HTMLCanvasElement;
  influence: InfluenceMask;
}

export class AttractorRuntime {
  private readonly renderer: CanvasRenderer;
  private readonly field = new ParticleField();
  private readonly stage = new AttractorStage();
  private readonly pointer: Vec2 = {
    x: config.interaction.pointer.initialOffset,
    y: config.interaction.pointer.initialOffset,
  };
  private readonly pointerVelocity: Vec2 = { x: 0, y: 0 };
  private readonly touchPointers = new Map<number, Vec2>();
  private readonly touchGestureTracker = new TouchGestureTracker();
  private readonly box = { x: 0, y: 0, w: 0, h: 0 };
  private readonly startTime = performance.now();
  private readonly motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  private readonly logoCanvas = document.createElement('canvas');
  private readonly logoContext = this.logoCanvas.getContext('2d', { willReadFrequently: true });
  private readonly wordmarkImage = new Image();
  private resizeObserver: ResizeObserver | null = null;
  private themeObserver: MutationObserver | null = null;
  private loadedWordmark: LoadedWordmark | null = null;
  private width = 0;
  private height = 0;
  private lastFrameTime = 0;
  private lastPointerMove = 0;
  private animationFrame = 0;
  private claimFontSize = 0;
  private foreground = '';
  private background = '';
  private energy = 0;
  private pinchForce = 0;
  private rotationForce = 0;
  private active = false;
  private revealRequested = false;
  private reducedMotion = this.motionQuery.matches;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly host: HTMLDivElement,
    private readonly claim: HTMLSpanElement,
  ) {
    this.renderer = new CanvasRenderer(canvas);
  }

  start(): () => void {
    this.claimFontSize = parseFloat(getComputedStyle(this.claim).fontSize);
    this.initializeWordmark();
    this.observeTheme();
    this.observeMotionPreference();
    this.observeSize();
    this.addCanvasListeners();
    this.animationFrame = requestAnimationFrame(this.tick);
    return () => this.dispose();
  }

  private initializeWordmark(): void {
    this.logoCanvas.width = WORDMARK_CONTENT.width + WORDMARK_CONTENT.x * 2;
    this.logoCanvas.height = WORDMARK_CONTENT.height + WORDMARK_CONTENT.y * 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    this.wordmarkImage.src = `${basePath}/wordmark.svg`;
    this.wordmarkImage.onload = () => {
      const context = this.logoContext;
      if (!context) return;

      context.drawImage(
        this.wordmarkImage,
        WORDMARK_CONTENT.x,
        WORDMARK_CONTENT.y,
        WORDMARK_CONTENT.width,
        WORDMARK_CONTENT.height,
      );
      const alpha = context.getImageData(
        0,
        0,
        this.logoCanvas.width,
        this.logoCanvas.height,
      ).data;
      this.loadedWordmark = {
        canvas: this.logoCanvas,
        influence: createInfluenceMask(
          this.logoCanvas.width,
          this.logoCanvas.height,
          alpha,
          WORDMARK_CONTENT,
        ),
      };
    };
  }

  private observeTheme(): void {
    this.themeObserver = new MutationObserver(this.updateThemeColors);
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    this.updateThemeColors();
  }

  private observeMotionPreference(): void {
    this.motionQuery.addEventListener('change', this.updateMotionPreference);
  }

  private observeSize(): void {
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.host);
    this.resize();
  }

  private addCanvasListeners(): void {
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerenter', this.onPointerEnter);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.canvas.addEventListener('focus', this.onFocus);
    this.canvas.addEventListener('blur', this.onBlur);
  }

  private readonly updateThemeColors = (): void => {
    const style = getComputedStyle(this.host);
    this.foreground = style.getPropertyValue('--foreground').trim();
    this.background = style.getPropertyValue('--background').trim();
  };

  private readonly updateMotionPreference = (): void => {
    this.reducedMotion = this.motionQuery.matches;
  };

  private readonly resize = (): void => {
    const bounds = this.host.getBoundingClientRect();
    this.width = bounds.width;
    this.height = bounds.height;
    this.renderer.resize(
      this.width,
      this.height,
      Math.min(devicePixelRatio || 1, config.canvas.maxDevicePixelRatio),
    );
    this.field.resize(this.width, this.height);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const now = performance.now();
    if (event.pointerType === 'touch') {
      const touch = this.touchPointers.get(event.pointerId);
      if (!touch) return;
      const bounds = this.canvas.getBoundingClientRect();
      touch.x = event.clientX - bounds.left;
      touch.y = event.clientY - bounds.top;

      if (this.touchPointers.size >= 2) {
        this.updateTouchGesture(now);
        return;
      }

      this.updatePointerPosition(touch.x, touch.y, now, 'touch');
      return;
    }

    const bounds = this.canvas.getBoundingClientRect();
    this.updatePointerPosition(event.clientX - bounds.left, event.clientY - bounds.top, now, event.pointerType);
  };

  private readonly updatePointerPosition = (
    x: number,
    y: number,
    now: number,
    pointerType: string,
  ): void => {
    const elapsed = Math.max(1, now - this.lastPointerMove);
    const dx = x - this.pointer.x;
    const dy = y - this.pointer.y;
    const velocity = Math.hypot(dx, dy) / elapsed;
    const smoothing = config.interaction.pointer.flow.smoothing;

    this.pointerVelocity.x = this.lastPointerMove > 0
      ? this.pointerVelocity.x * (1 - smoothing) + dx / elapsed * smoothing
      : 0;
    this.pointerVelocity.y = this.lastPointerMove > 0
      ? this.pointerVelocity.y * (1 - smoothing) + dy / elapsed * smoothing
      : 0;
    this.pointer.x = x;
    this.pointer.y = y;
    const pointerEnergy = this.energy + velocity * config.interaction.pointer.velocityGain;
    const movementEnergy = pointerType === 'mouse'
      ? Math.max(pointerEnergy, config.interaction.pointer.mouseMovementEnergy)
      : pointerEnergy;
    this.energy = Saturation.process(
      movementEnergy,
      config.signalProcessing.saturation,
      0,
      config.interaction.energy.maximum,
    );
    this.active = true;
    this.revealRequested = true;
    this.lastPointerMove = now;
  };

  private readonly onPointerEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;

    this.active = true;
    this.revealRequested = true;
    this.lastPointerMove = performance.now();
  };

  private readonly onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    this.deactivatePointer();
  };

  private readonly onBlur = (): void => {
    this.deactivatePointer();
  };

  private readonly deactivatePointer = (): void => {
    this.active = false;
    this.revealRequested = false;
    this.stage.setRevealTarget(0);
  };

  private readonly onFocus = (): void => {
    this.active = true;
    this.revealRequested = true;
    this.lastPointerMove = performance.now();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const bounds = this.canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    if (event.pointerType === 'touch') {
      this.touchPointers.set(event.pointerId, { x, y });
      this.canvas.setPointerCapture(event.pointerId);
      this.active = true;
      this.revealRequested = true;
      this.lastPointerMove = performance.now();

      if (this.touchPointers.size >= 2) {
        this.pointerVelocity.x = 0;
        this.pointerVelocity.y = 0;
        this.updateTouchGesture(this.lastPointerMove, true);
        return;
      }
    } else if (!event.isPrimary) {
      return;
    }

    this.pointer.x = x;
    this.pointer.y = y;
    this.pointerVelocity.x = 0;
    this.pointerVelocity.y = 0;
    this.lastPointerMove = performance.now();
    this.active = true;
    this.revealRequested = true;

    this.stage.triggerImpulse(config.interaction.trigger.amount);
    this.energy = Saturation.process(
      this.energy + config.interaction.trigger.clickEnergy,
      config.signalProcessing.saturation,
      0,
      config.interaction.energy.maximum,
    );
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return;
    this.touchPointers.delete(event.pointerId);
    this.touchGestureTracker.reset();
    const remainingTouch = this.touchPointers.values().next().value;
    if (remainingTouch) {
      this.pointer.x = remainingTouch.x;
      this.pointer.y = remainingTouch.y;
      this.pointerVelocity.x = 0;
      this.pointerVelocity.y = 0;
      this.lastPointerMove = performance.now();
    }
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return;
    this.touchPointers.delete(event.pointerId);
    this.touchGestureTracker.reset();
    this.pinchForce = 0;
    this.rotationForce = 0;
    const remainingTouch = this.touchPointers.values().next().value;
    if (remainingTouch) {
      this.pointer.x = remainingTouch.x;
      this.pointer.y = remainingTouch.y;
      this.pointerVelocity.x = 0;
      this.pointerVelocity.y = 0;
      this.lastPointerMove = performance.now();
    } else {
      this.deactivatePointer();
    }
  };

  private updateTouchGesture(now: number, establishBaseline = false): void {
    const [first, second] = [...this.touchPointers.values()];
    if (!first || !second) return;

    const sample = this.touchGestureTracker.update(first, second, now, establishBaseline);
    this.pinchForce = Saturation.process(
      sample.pinchSpeed / config.interaction.gestures.pinch.fullSpeedPixelsPerSecond,
      config.signalProcessing.saturation,
      -1,
      1,
    );
    this.rotationForce = Saturation.process(
      sample.angularSpeed / config.interaction.gestures.rotation.fullSpeedRadiansPerSecond,
      config.signalProcessing.saturation,
      -1,
      1,
    );
    this.pointer.x = sample.center.x;
    this.pointer.y = sample.center.y;
    this.pointerVelocity.x = 0;
    this.pointerVelocity.y = 0;
    this.active = true;
    this.revealRequested = true;
    this.lastPointerMove = now;
  }

  private readonly onTouchStart = (event: TouchEvent): void => {
    // The canvas is a gesture surface, not selectable content. Keep this local
    // so long-press behavior on navigation and other controls remains native.
    if (event.cancelable) event.preventDefault();
  };

  private readonly tick = (now: number): void => {
    this.animationFrame = requestAnimationFrame(this.tick);
    if (document.hidden) {
      this.lastFrameTime = now;
      return;
    }

    const dt = Math.min(0.04, (now - (this.lastFrameTime || now)) / 1000);
    this.lastFrameTime = now;
    this.updateInteraction(dt, now);
    const time = (now - this.startTime) / 1000;
    this.stage.setCursor(this.pointer, this.pointerVelocity, this.width, this.height);
    this.stage.setEnergy(this.energy);
    this.stage.setReducedMotion(this.reducedMotion);
    this.stage.setRevealTarget(this.active && this.revealRequested ? 1 : 0);
    const stageFrame = this.stage.tick(time, dt, this.width, this.height);
    this.energy = Saturation.process(
      this.energy + stageFrame.impulse * dt * config.interaction.trigger.energyGain,
      config.signalProcessing.saturation,
      0,
      config.interaction.energy.maximum,
    );

    this.updateWordmarkBox(stageFrame.reveal);
    this.field.step(
      dt,
      time,
      stageFrame.attractors,
      stageFrame.cursor,
      stageFrame.energy,
      this.loadedWordmark?.influence ?? null,
      this.box,
      this.reducedMotion,
      stageFrame.cursorVelocity,
      {
        dampingRate: stageFrame.dampingRate,
        wordmarkOpenness: stageFrame.wordmarkOpenness,
        wordmarkOpennessSamples: stageFrame.wordmarkOpennessSamples,
        wordmarkOpennessPhaseSpan: stageFrame.wordmarkOpennessPhaseSpan,
        personalDriftStrength: stageFrame.personalDriftStrength,
        remoteAttractionStrength: stageFrame.remoteAttractionStrength,
        gatherStrength: stageFrame.gatherStrength,
      },
      { pinch: this.pinchForce, rotation: this.rotationForce },
    );
    this.renderer.draw(
      this.field.grains,
      this.foreground,
      this.background,
      this.loadedWordmark?.canvas ?? null,
      this.loadedWordmark?.influence.content ?? null,
      this.box,
      stageFrame.reveal,
    );
  };

  private updateInteraction(dt: number, now: number): void {
    const pointerFlow = config.interaction.pointer.flow;
    const pointerDecay = Math.exp(-dt / pointerFlow.decaySeconds);
    this.pointerVelocity.x *= pointerDecay;
    this.pointerVelocity.y *= pointerDecay;
    this.pinchForce *= Math.exp(-dt / config.interaction.gestures.pinch.decaySeconds);
    this.rotationForce *= Math.exp(-dt / config.interaction.gestures.rotation.decaySeconds);
    if (this.active && now - this.lastPointerMove > config.interaction.energy.idleAfterMilliseconds) {
      this.active = false;
    }
    const decayTime = this.active
      ? config.interaction.energy.activeDecaySeconds
      : config.interaction.energy.restingDecaySeconds;
    this.energy *= Math.exp(-dt / decayTime);
  }

  private updateWordmarkBox(reveal: number): void {
    const layout = config.wordmark.layout;
    const isCompactViewport =
      this.width <= layout.compactViewportMaxWidth ||
      this.height <= layout.compactViewportMaxHeight;
    const isCompactLandscape =
      this.height <= layout.compactViewportMaxHeight && this.width > this.height;
    const widthRatio = isCompactLandscape
      ? layout.compactWidthRatio * layout.compactLandscapeScale
      : isCompactViewport
        ? layout.compactWidthRatio
        : layout.widthRatio;
    const logoWidth = Math.min(this.width * widthRatio, layout.maximumWidth);
    const logoHeight = logoWidth * config.wordmark.mask.contentHeight /
      config.wordmark.mask.contentWidth;
    this.box.w = logoWidth;
    this.box.h = logoHeight;
    this.box.x = (this.width - logoWidth) / 2;
    this.box.y = this.height * layout.centerY - logoHeight / 2 + layout.verticalOffset;
    this.claim.style.top = `${this.box.y + this.box.h + layout.claimGap - this.claimFontSize * 0.8}px`;
    this.claim.style.opacity = `${Math.pow(
      reveal,
      config.renderer.grainAtlas.wordmarkRevealOpacityExponent,
    )}`;
  }

  private dispose(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
    this.motionQuery.removeEventListener('change', this.updateMotionPreference);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerenter', this.onPointerEnter);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('focus', this.onFocus);
    this.canvas.removeEventListener('blur', this.onBlur);
    this.wordmarkImage.onload = null;
  }
}
