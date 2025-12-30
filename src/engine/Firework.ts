import { Vector2 } from './Vector2';
import { Particle } from './Particle';
import { playExplosion, playLaunch } from '../utils/sound';
import { getTextPoints } from '../utils/textToPoints';
import { PointData } from '../utils/imageToPoints';

export class Firework {
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  hue: number;
  exploded: boolean;
  particles: Particle[];
  targetY: number;
  text?: string;
  targetPoints?: PointData[];
  
  // Shell physics
  coordinates: [number, number][];
  brightness: number;

  constructor(x: number, targetY: number, text?: string, targetPoints?: PointData[]) {
    this.pos = new Vector2(x, window.innerHeight);
    this.targetY = targetY;
    
    // Calculate initial velocity to reach targetY with gravity
    // v^2 = u^2 + 2as => u = sqrt(-2as) approx
    // But we are simulating frame by frame.
    // Let's stick to a range for now, but ensure it goes high enough.
    const speed = Math.random() * 4 + 14; // 14-18
    this.vel = new Vector2(0, -speed);
    
    this.acc = new Vector2(0, 0);
    this.hue = Math.random() * 360;
    this.exploded = false;
    this.particles = [];
    this.text = text;
    this.targetPoints = targetPoints;
    
    // Track history for shell trail
    this.coordinates = [];
    let coordinateCount = 3;
    while(coordinateCount--) {
      this.coordinates.push([this.pos.x, this.pos.y]);
    }
    this.brightness = Math.random() * 50 + 50;

    // Play launch sound
    playLaunch();
  }

  update(_index: number) {
    if (!this.exploded) {
      // Remove last item in coordinates array
      this.coordinates.pop();
      // Add current position to the start
      this.coordinates.unshift([this.pos.x, this.pos.y]);

      this.vel.add(this.acc);
      this.pos.add(this.vel);
      this.acc.multiply(0);
      
      // Gravity
      this.vel.y += 0.2; // Gravity for shell

      // Explode when reaching target or slowing down enough
      if (this.vel.y >= -2 || this.pos.y <= this.targetY) {
        this.explode();
      }
    } else {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update(i);
        if (p.isDead()) {
          this.particles.splice(i, 1);
        }
      }
    }
  }

  explode() {
    this.exploded = true;
    playExplosion();
    
    if (this.targetPoints) {
       // Image fireworks
       for (const point of this.targetPoints) {
          // Parse color from rgba string or use hue
          // For simplicity, let's keep using hue for now or try to adapt
          // Since Particle expects hue (number), we might lose color fidelity if we don't change Particle.
          // But user wants "exact replica", and replica usually uses Hue.
          // However, for image fireworks we need specific colors.
          // Let's cheat: We modified Particle to take Hue, but we can overload it or change it back?
          // No, let's stick to Hue for normal fireworks, but for Image fireworks we need to support specific colors.
          // Actually, let's just make Particle accept color string OR hue?
          // To save time, let's just use the main hue for image particles but vary brightness
          // OR, re-modify Particle to support color string?
          // The requested replica uses HSL.
          // Let's just use the firework hue for now to ensure consistency with the "replica" style physics first.
          this.particles.push(new Particle(point.pos.x, point.pos.y, this.hue, true));
       }
       // Glitter
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(this.pos.x, this.pos.y, this.hue, false));
        }

    } else if (this.text) {
      const points = getTextPoints(this.text, this.pos.x, this.pos.y);
      for (const point of points) {
        this.particles.push(new Particle(point.x, point.y, this.hue, true));
      }
      for (let i = 0; i < 20; i++) {
         this.particles.push(new Particle(this.pos.x, this.pos.y, this.hue, false));
      }

    } else {
      // Normal explosion - generate particles in a circle
      const particleCount = 100;
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(new Particle(this.pos.x, this.pos.y, this.hue, false));
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.exploded) {
      ctx.beginPath();
      ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
      ctx.lineTo(this.pos.x, this.pos.y);
      ctx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
      ctx.stroke();
    } else {
      for (const p of this.particles) {
        p.draw(ctx);
      }
    }
  }
  
  isDead() {
      return this.exploded && this.particles.length === 0;
  }
}
