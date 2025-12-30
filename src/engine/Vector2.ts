export class Vector2 {
  constructor(public x: number, public y: number) {}

  add(v: Vector2) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  multiply(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
}
