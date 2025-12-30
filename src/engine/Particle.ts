import { Vector2 } from './Vector2';

export class Particle {
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  alpha: number;
  hue: number;
  brightness: number;
  decay: number;
  coordinates: [number, number][]; // History for trails
  friction: number;
  gravity: number;

  constructor(x: number, y: number, hue: number, isTextParticle: boolean = false) {
    this.pos = new Vector2(x, y);
    // Track past coordinates for trail effect
    this.coordinates = [];
    let coordinateCount = 5;
    while(coordinateCount--) {
      this.coordinates.push([x, y]);
    }
    
    this.acc = new Vector2(0, 0);
    this.alpha = 1;
    this.hue = hue;
    this.brightness = Math.random() * 20 + 50; // 50-70% brightness
    
    if (isTextParticle) {
      // Text/Image particles
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5; 
      this.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.friction = 0.93;
      this.gravity = 0; // Text floats
      this.decay = Math.random() * 0.003 + 0.001; 
      this.brightness = 80; // Brighter text
    } else {
      // Normal firework particle
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 5; // 5-15 speed
      this.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.friction = 0.95;
      this.gravity = 0.1; // Reduced from 1 to 0.1 for realistic hang time
      this.decay = Math.random() * 0.015 + 0.005;
    }
  }

  update(_index: number) {
    // Remove last item in coordinates array
    this.coordinates.pop();
    // Add current position to the start
    this.coordinates.unshift([this.pos.x, this.pos.y]);

    this.vel.multiply(this.friction);
    this.vel.y += this.gravity;
    this.pos.add(this.vel);
    
    this.alpha -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    // Move to the last tracked coordinate in the set, then draw a line to the current x and y
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctx.lineTo(this.pos.x, this.pos.y);
    
    ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
    ctx.stroke();
  }

  isDead() {
    return this.alpha <= this.decay;
  }
}
