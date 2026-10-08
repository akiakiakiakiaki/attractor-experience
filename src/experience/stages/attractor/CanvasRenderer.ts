import type { Grain } from "./ParticleField";
import config from "./AttractorConfig";
import { createGrainAtlas } from "./GrainAtlas";

const GRAIN_STYLE = config.renderer.grainAtlas;
const SPRITE_SIZE = GRAIN_STYLE.spriteSize;
const SPRITE_COLUMNS = GRAIN_STYLE.columns;
const SPRITE_ROWS = GRAIN_STYLE.rows;

interface GrainSpriteStyle {
  widthScale: number;
  heightScale: number;
  shape: number;
  rotation: number;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private grainAtlas = createGrainAtlas();
  private coloredGrainAtlas = document.createElement("canvas");
  private grainColor = "";
  private markCanvas = document.createElement("canvas");
  private markColor = "";
  private particleSizeScale = 1;
  private grainSpriteStyles = new WeakMap<Grain, GrainSpriteStyle>();
  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is unavailable");
    this.ctx = ctx;
    this.coloredGrainAtlas.width = this.grainAtlas.width;
    this.coloredGrainAtlas.height = this.grainAtlas.height;
    this.markCanvas.width = config.wordmark.mask.contentWidth;
    this.markCanvas.height = config.wordmark.mask.contentHeight;
  }
  resize(width: number, height: number, dpr: number): void {
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scaling = config.particles.sizeScaling;
    const diagonalRatio = Math.hypot(width, height) / scaling.referenceDiagonal;
    this.particleSizeScale = Math.max(
      scaling.minimumScale,
      Math.min(scaling.maximumScale, 1 + scaling.factor * (diagonalRatio - 1)),
    );
  }
  draw(
    grains: Grain[],
    foreground: string,
    background: string,
    mask: HTMLCanvasElement | null,
    maskContent: { x: number; y: number; width: number; height: number } | null,
    box: { x: number; y: number; w: number; h: number },
    reveal: number,
  ): void {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = foreground;
    if (foreground !== this.grainColor) {
      const grainCtx = this.coloredGrainAtlas.getContext("2d");
      if (grainCtx) {
        grainCtx.clearRect(
          0,
          0,
          this.coloredGrainAtlas.width,
          this.coloredGrainAtlas.height,
        );
        grainCtx.drawImage(this.grainAtlas, 0, 0);
        grainCtx.globalCompositeOperation = "source-in";
        grainCtx.fillStyle = foreground;
        grainCtx.fillRect(
          0,
          0,
          this.coloredGrainAtlas.width,
          this.coloredGrainAtlas.height,
        );
        grainCtx.globalCompositeOperation = "source-over";
      }
      this.grainColor = foreground;
    }
    // Fine grains are below the atlas detail size; batch them into one canvas fill.
    ctx.beginPath();
    let microGrainCount = 0;
    for (const p of grains) {
      if (this.drawWrappedGrain(p, width, height)) microGrainCount++;
    }
    if (microGrainCount > 0) {
      ctx.globalAlpha = GRAIN_STYLE.microBatchOpacity;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (mask && maskContent && reveal > GRAIN_STYLE.revealThreshold) {
      if (
        this.markCanvas.width !== mask.width ||
        this.markCanvas.height !== mask.height
      ) {
        this.markCanvas.width = mask.width;
        this.markCanvas.height = mask.height;
        this.markColor = "";
      }
      if (foreground !== this.markColor) {
        const markCtx = this.markCanvas.getContext("2d");
        if (markCtx) {
          markCtx.clearRect(
            0,
            0,
            this.markCanvas.width,
            this.markCanvas.height,
          );
          markCtx.drawImage(mask, 0, 0);
          markCtx.globalCompositeOperation = "source-in";
          markCtx.fillStyle = foreground;
          markCtx.fillRect(0, 0, this.markCanvas.width, this.markCanvas.height);
          markCtx.globalCompositeOperation = "source-over";
        }
        this.markColor = foreground;
      }
      ctx.globalAlpha = Math.pow(
        reveal,
        GRAIN_STYLE.wordmarkRevealOpacityExponent,
      );
      ctx.drawImage(
        this.markCanvas,
        maskContent.x,
        maskContent.y,
        maskContent.width,
        maskContent.height,
        box.x,
        box.y,
        box.w,
        box.h,
      );
      ctx.globalAlpha = 1;
    }
  }

  private drawWrappedGrain(grain: Grain, canvasWidth: number, canvasHeight: number): boolean {
    const ctx = this.ctx;
    const size = grain.size * this.particleSizeScale;
    const style = this.getGrainSpriteStyle(grain);
    const halfWidth = size * style.widthScale;
    const halfHeight = size * style.heightScale;
    const leftCopy = grain.x - halfWidth < 0;
    const rightCopy = grain.x + halfWidth > canvasWidth;
    const topCopy = grain.y - halfHeight < 0;
    const bottomCopy = grain.y + halfHeight > canvasHeight;
    const micro = size <= GRAIN_STYLE.microBatchThreshold;

    if (!micro) {
      ctx.globalAlpha = GRAIN_STYLE.opacityBase -
        Math.min(GRAIN_STYLE.opacitySizeCap, size * GRAIN_STYLE.opacityPerSize);
      for (let xIndex = 0; xIndex <= Number(leftCopy) + Number(rightCopy); xIndex++) {
        const offsetX = xIndex === 0 ? 0 : leftCopy && xIndex === 1 ? canvasWidth : -canvasWidth;
        for (let yIndex = 0; yIndex <= Number(topCopy) + Number(bottomCopy); yIndex++) {
          const offsetY = yIndex === 0 ? 0 : topCopy && yIndex === 1 ? canvasHeight : -canvasHeight;
          ctx.drawImage(
            this.coloredGrainAtlas,
            style.shape * SPRITE_SIZE,
            style.rotation * SPRITE_SIZE,
            SPRITE_SIZE,
            SPRITE_SIZE,
            grain.x + offsetX - halfWidth,
            grain.y + offsetY - halfHeight,
            halfWidth * 2,
            halfHeight * 2,
          );
        }
      }
    } else {
      for (let xIndex = 0; xIndex <= Number(leftCopy) + Number(rightCopy); xIndex++) {
        const offsetX = xIndex === 0 ? 0 : leftCopy && xIndex === 1 ? canvasWidth : -canvasWidth;
        for (let yIndex = 0; yIndex <= Number(topCopy) + Number(bottomCopy); yIndex++) {
          const offsetY = yIndex === 0 ? 0 : topCopy && yIndex === 1 ? canvasHeight : -canvasHeight;
          ctx.rect(
            grain.x + offsetX - halfWidth,
            grain.y + offsetY - halfHeight,
            halfWidth * 2,
            halfHeight * 2,
          );
        }
      }
    }

    return micro;
  }

  private getGrainSpriteStyle(grain: Grain): GrainSpriteStyle {
    const cached = this.grainSpriteStyles.get(grain);
    if (cached) return cached;

    const style = {
      widthScale: GRAIN_STYLE.widthScaleBase +
        ((grain.seed * GRAIN_STYLE.widthScaleSeedMultiplier) % 1) * GRAIN_STYLE.widthScaleRange,
      heightScale: GRAIN_STYLE.heightScaleBase +
        ((grain.seed * GRAIN_STYLE.heightScaleSeedMultiplier) % 1) * GRAIN_STYLE.heightScaleRange,
      shape: Math.floor(((grain.seed * GRAIN_STYLE.shapeSeedMultiplier) % 1) * SPRITE_COLUMNS),
      rotation: Math.floor(((grain.seed * GRAIN_STYLE.rotationSeedMultiplier) % 1) * SPRITE_ROWS),
    };
    this.grainSpriteStyles.set(grain, style);
    return style;
  }
}
