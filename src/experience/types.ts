export interface Vec2 { x: number; y: number }

export interface Attractor {
  position: Vec2;
  strength: number;
  radius: number;
}
