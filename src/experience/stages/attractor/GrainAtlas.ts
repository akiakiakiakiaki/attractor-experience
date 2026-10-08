import config from './AttractorConfig';

const style = config.renderer.grainAtlas;

export function createGrainAtlas(): HTMLCanvasElement {
  const atlas = document.createElement('canvas');
  atlas.width = style.spriteSize * style.columns;
  atlas.height = style.spriteSize * style.rows;
  const context = atlas.getContext('2d');
  if (!context) return atlas;

  for (let rotation = 0; rotation < style.rows; rotation += 1) {
    for (let shape = 0; shape < style.columns; shape += 1) {
      const seed = shape + 1;
      const centerX = shape * style.spriteSize + style.spriteSize / 2;
      const centerY = rotation * style.spriteSize + style.spriteSize / 2;
      const angleOffset = rotation * Math.PI / 2 + seed * style.shapePhase;
      const points = Array.from({ length: style.contourPoints }, (_, index) => {
        const angle = angleOffset + index * Math.PI * 2 / style.contourPoints;
        const radial = style.radialBase +
          Math.sin(index * style.radialWaveAFrequency + seed * style.radialWaveASeedMultiplier) *
            style.radialWaveA +
          Math.cos(index * style.radialWaveBFrequency + seed * style.radialWaveBSeedMultiplier) *
            style.radialWaveB;
        return {
          x: centerX + Math.cos(angle) * radial * style.contourRadius,
          y: centerY + Math.sin(angle) * radial *
            (style.contourHeight + (shape % 3) * style.contourShapeHeightStep),
        };
      });

      context.fillStyle = '#fff';
      context.beginPath();
      const last = points[points.length - 1]!;
      const first = points[0]!;
      context.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index]!;
        const next = points[(index + 1) % points.length]!;
        context.quadraticCurveTo(
          point.x,
          point.y,
          (point.x + next.x) / 2,
          (point.y + next.y) / 2,
        );
      }
      context.closePath();
      context.fill();

      context.globalAlpha = style.grainOpacity;
      for (let grain = 0; grain < style.grainCount; grain += 1) {
        const angle = seed * style.grainSeedAngleMultiplier +
          grain * style.grainAngleStep + rotation * style.grainRotationPhase;
        const radius = style.grainRadiusBase +
          ((seed * (grain + style.grainRadiusIndexOffset)) % style.grainRadiusRange);
        const grainSize = style.grainSizeBase +
          ((seed + grain * style.grainSizeIndexStep) % style.grainSizeModulo) *
            style.grainSizeStep;
        context.beginPath();
        context.ellipse(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius * style.grainYScale,
          grainSize * style.grainXScale,
          grainSize * style.grainHeightScale,
          angle,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
      context.globalAlpha = 1;
    }
  }

  return atlas;
}
