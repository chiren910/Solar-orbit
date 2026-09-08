/**
 * Procedural Texture Generator for Three.js Celestial Bodies
 * Generates crisp, photorealistic planet textures dynamically without external image loading.
 */

// Simple 2D Perlin-like gradient noise generator for procedural textures
class SimpleNoise {
  constructor(seed = 42) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Shuffle
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];

    const g1 = this.grad(aa, xf, yf);
    const g2 = this.grad(ba, xf - 1, yf);
    const g3 = this.grad(ab, xf, yf - 1);
    const g4 = this.grad(bb, xf - 1, yf - 1);

    const x1 = this.lerp(g1, g2, u);
    const x2 = this.lerp(g3, g4, u);

    return (this.lerp(x1, x2, v) + 1) * 0.5; // Normalized 0..1
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(a, b, t) { return a + t * (b - a); }
  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  fbm(x, y, octaves = 5, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }
}

const noise = new SimpleNoise(12345);

export class TextureGenerator {
  /**
   * Helper to create canvas of given dimensions
   */
  static createCanvas(width = 1024, height = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
  }

  /**
   * Generates Sun Photosphere Texture with granulated convection cells & solar flares
   */
  static generateSunTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        const n1 = noise.fbm(u * 14, v * 14, 5, 0.55, 2.1);
        const n2 = noise.fbm(u * 32, v * 32, 3, 0.45, 2.0);
        const turbulence = (n1 * 0.7 + n2 * 0.3);

        // Core sun colors: deep orange to brilliant yellow-white
        const r = Math.min(255, Math.floor(255 * (0.95 + turbulence * 0.1)));
        const g = Math.min(255, Math.floor(160 * (0.55 + turbulence * 0.65)));
        const b = Math.min(255, Math.floor(40 * Math.pow(turbulence, 3)));

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Sunspots overlay
    ctx.fillStyle = 'rgba(120, 25, 0, 0.45)';
    const spots = [
      { x: 300, y: 220, r: 18 }, { x: 315, y: 228, r: 10 },
      { x: 720, y: 270, r: 24 }, { x: 735, y: 280, r: 14 },
      { x: 520, y: 200, r: 15 }, { x: 890, y: 230, r: 12 }
    ];
    spots.forEach(s => {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, 'rgba(80, 15, 0, 0.85)');
      grad.addColorStop(0.6, 'rgba(180, 60, 0, 0.5)');
      grad.addColorStop(1, 'rgba(255, 140, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Mercury Texture (heavily cratered monochrome rock)
   */
  static generateMercuryTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;
        const n = noise.fbm(u * 18, v * 18, 6, 0.52, 2.0);
        const craterNoise = noise.fbm(u * 40, v * 40, 3, 0.5, 2.0);

        const val = Math.floor((n * 0.75 + craterNoise * 0.25) * 160 + 60);
        const idx = (y * 1024 + x) * 4;
        data[idx] = val;
        data[idx + 1] = Math.floor(val * 0.95);
        data[idx + 2] = Math.floor(val * 0.90);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw procedural craters with rims and ejecta rays
    this.addCraterRims(ctx, 1024, 512, 120);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Venus Texture (thick yellowish swirling sulfuric clouds)
   */
  static generateVenusTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;
        // Zonal swirling flow
        const streak = Math.sin(v * 24 + noise.noise2D(u * 8, v * 4) * 5);
        const n = noise.fbm(u * 12 + streak * 0.15, v * 12, 5, 0.55, 2.0);

        const r = Math.floor(215 + n * 40);
        const g = Math.floor(180 + n * 45);
        const b = Math.floor(120 + n * 35);

        const idx = (y * 1024 + x) * 4;
        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Earth Surface Texture (Oceans, continents, greenery, deserts, polar ice caps)
   */
  static generateEarthTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;
        const lat = (v - 0.5) * 2; // -1 at North pole, +1 at South pole

        // Multi-octave continent terrain
        const continentNoise = noise.fbm(u * 7, v * 7, 6, 0.5, 2.1);
        const detailNoise = noise.fbm(u * 25, v * 25, 4, 0.5, 2.0);

        let r, g, b;

        // Polar Ice Caps
        if (Math.abs(lat) > 0.82 + (continentNoise * 0.08)) {
          r = 235 + Math.floor(detailNoise * 20);
          g = 245 + Math.floor(detailNoise * 10);
          b = 255;
        } else if (continentNoise > 0.51) {
          // Landmass
          const elevation = continentNoise;
          if (Math.abs(lat) < 0.35 && elevation < 0.62) {
            // Tropical green & jungle
            r = Math.floor(35 + detailNoise * 40);
            g = Math.floor(115 + detailNoise * 60);
            b = Math.floor(30 + detailNoise * 25);
          } else if (Math.abs(lat) > 0.25 && Math.abs(lat) < 0.55 && elevation > 0.56) {
            // Deserts / Savannas (Sahara, Australia, Arabia)
            r = Math.floor(185 + detailNoise * 50);
            g = Math.floor(155 + detailNoise * 40);
            b = Math.floor(95 + detailNoise * 30);
          } else if (elevation > 0.72) {
            // Mountain peaks
            r = Math.floor(140 + detailNoise * 70);
            g = Math.floor(130 + detailNoise * 70);
            b = Math.floor(125 + detailNoise * 70);
          } else {
            // Temperate forests / plains
            r = Math.floor(45 + detailNoise * 45);
            g = Math.floor(95 + detailNoise * 50);
            b = Math.floor(40 + detailNoise * 30);
          }
        } else {
          // Ocean with continental shelf gradient
          const depth = 0.51 - continentNoise;
          r = Math.max(10, Math.floor(15 - depth * 15));
          g = Math.max(40, Math.floor(75 - depth * 55));
          b = Math.max(120, Math.floor(185 - depth * 80));
        }

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Earth Cloud Layer Texture with alpha transparency
   */
  static generateEarthCloudsTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        // Swirling cloud patterns
        const cloudFbm = noise.fbm(u * 10, v * 10, 5, 0.55, 2.0);
        const swirl = noise.noise2D(u * 18, v * 18);
        const density = cloudFbm * 0.7 + swirl * 0.3;

        const idx = (y * 1024 + x) * 4;
        if (density > 0.48) {
          const alpha = Math.min(240, Math.floor((density - 0.48) * 480));
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = alpha;
        } else {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Moon Texture (lunar maria and bright highlands)
   */
  static generateMoonTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        const maria = noise.fbm(u * 5, v * 5, 4, 0.6, 2.0);
        const highlands = noise.fbm(u * 22, v * 22, 5, 0.5, 2.0);

        let tone;
        if (maria < 0.44) {
          // Dark basaltic maria
          tone = Math.floor(70 + highlands * 35);
        } else {
          // Bright anorthositic highlands
          tone = Math.floor(130 + highlands * 80);
        }

        const idx = (y * 1024 + x) * 4;
        data[idx] = tone;
        data[idx + 1] = tone;
        data[idx + 2] = Math.floor(tone * 1.02);
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    this.addCraterRims(ctx, 1024, 512, 140);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Mars Texture (Red terrain, craters, dark basalt basins, polar caps)
   */
  static generateMarsTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;
        const lat = (v - 0.5) * 2;

        const n = noise.fbm(u * 8, v * 8, 5, 0.52, 2.0);
        const detail = noise.fbm(u * 24, v * 24, 4, 0.48, 2.0);

        let r, g, b;

        // Polar ice caps
        if (Math.abs(lat) > 0.86 + n * 0.05) {
          r = 240;
          g = 240;
          b = 245;
        } else if (n < 0.42) {
          // Dark volcanic terrain (Syrtis Major / Acidalia Planitia)
          r = Math.floor(100 + detail * 40);
          g = Math.floor(55 + detail * 25);
          b = Math.floor(40 + detail * 20);
        } else {
          // Typical red/ochre oxide surface
          r = Math.floor(190 + n * 45 + detail * 20);
          g = Math.floor(85 + n * 30 + detail * 15);
          b = Math.floor(45 + n * 20);
        }

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw Valles Marineris canyon feature
    ctx.strokeStyle = 'rgba(70, 30, 20, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(380, 260);
    ctx.bezierCurveTo(450, 265, 520, 255, 600, 270);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Jupiter Texture (Banded gas giant with turbulent zones and Great Red Spot)
   */
  static generateJupiterTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    // Great Red Spot center coordinates
    const grsX = 640;
    const grsY = 320;
    const grsRadiusX = 55;
    const grsRadiusY = 32;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        // Banding with turbulent wavy edges
        const wave = Math.sin(v * 45 + noise.noise2D(u * 12, v * 6) * 4.5);
        const turbulentNoise = noise.fbm(u * 16, v * 12, 4, 0.5, 2.0);

        // Calculate distance to Great Red Spot ellipse
        const dx = (x - grsX) / grsRadiusX;
        const dy = (y - grsY) / grsRadiusY;
        const distToGRS = dx * dx + dy * dy;

        let r, g, b;

        if (distToGRS < 1.0) {
          // Inside Great Red Spot
          const spotNoise = noise.noise2D(x * 0.08, y * 0.08);
          r = Math.floor(210 + spotNoise * 35);
          g = Math.floor(75 + spotNoise * 30);
          b = Math.floor(55 + spotNoise * 20);
        } else {
          // Band colors alternating between warm cream and amber/russet
          const bandFactor = (Math.sin(v * 28 + wave * 0.4) + 1) * 0.5;
          const mix = bandFactor * 0.7 + turbulentNoise * 0.3;

          r = Math.floor(190 + mix * 55);
          g = Math.floor(140 + mix * 40);
          b = Math.floor(95 + mix * 25);
        }

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Saturn Planet Texture (Subtle golden atmospheric bands)
   */
  static generateSaturnTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        const band = Math.sin(v * 36 + noise.noise2D(u * 6, v * 3) * 1.5);
        const micro = noise.fbm(u * 14, v * 10, 3, 0.4, 2.0);
        const mix = (band + 1) * 0.5 * 0.6 + micro * 0.4;

        const r = Math.floor(220 + mix * 30);
        const g = Math.floor(195 + mix * 30);
        const b = Math.floor(145 + mix * 25);

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Saturn Ring Texture (concentric alpha rings with Cassini Division)
   * Rendered as 1D radial strip wrapped around a RingGeometry
   */
  static generateSaturnRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(1024, 64);
    const data = imgData.data;

    for (let x = 0; x < 1024; x++) {
      const pos = x / 1024; // 0 = inner ring, 1 = outer ring

      let alpha = 0;
      let r = 215, g = 195, b = 160;

      // C Ring (Innermost, faint and transparent): pos 0.0 to 0.25
      if (pos < 0.25) {
        alpha = Math.floor(40 + (pos / 0.25) * 70);
      }
      // B Ring (Dense, brightest, wide): pos 0.25 to 0.62
      else if (pos < 0.62) {
        const subRings = Math.sin(pos * 180) * 20;
        alpha = Math.min(240, Math.floor(190 + subRings));
        r = 235; g = 215; b = 180;
      }
      // Cassini Division (Pronounced gap!): pos 0.62 to 0.68
      else if (pos < 0.68) {
        alpha = 8; // near transparent
      }
      // A Ring (Outer ring): pos 0.68 to 0.94
      else if (pos < 0.94) {
        const subRings = Math.sin(pos * 140) * 25;
        // Encke gap inside A ring
        if (pos > 0.85 && pos < 0.87) {
          alpha = 15;
        } else {
          alpha = Math.floor(140 + subRings);
        }
      }
      // Outer boundary taper
      else {
        alpha = Math.floor((1 - (pos - 0.94) / 0.06) * 100);
      }

      for (let y = 0; y < 64; y++) {
        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = Math.max(0, Math.min(255, alpha));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Generates Uranus Texture (Pale cyan/aquamarine ice giant)
   */
  static generateUranusTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        const subtle = noise.fbm(u * 5, v * 8, 3, 0.3, 2.0);
        const latGradient = Math.cos((v - 0.5) * Math.PI);

        const r = Math.floor(130 + subtle * 25 + latGradient * 15);
        const g = Math.floor(210 + subtle * 20 + latGradient * 10);
        const b = Math.floor(225 + subtle * 15);

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Uranus Ring Texture (delicate thin icy ring)
   */
  static generateUranusRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(512, 32);
    const data = imgData.data;

    for (let x = 0; x < 512; x++) {
      const pos = x / 512;
      let alpha = 0;
      if (pos > 0.4 && pos < 0.75) {
        alpha = Math.floor(Math.sin((pos - 0.4) / 0.35 * Math.PI) * 110);
      }
      for (let y = 0; y < 32; y++) {
        const idx = (y * 512 + x) * 4;
        data[idx] = 160;
        data[idx + 1] = 210;
        data[idx + 2] = 220;
        data[idx + 3] = alpha;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Neptune Texture (Vibrant azure gas giant with high altitude white methane cirrus)
   */
  static generateNeptuneTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        const baseNoise = noise.fbm(u * 8, v * 12, 4, 0.45, 2.0);
        const storm = noise.fbm(u * 20, v * 15, 3, 0.6, 2.0);

        let r = Math.floor(35 + baseNoise * 25);
        let g = Math.floor(85 + baseNoise * 40);
        let b = Math.floor(205 + baseNoise * 45);

        // High altitude white cirrus cloud bands
        if (Math.abs(v - 0.42) < 0.04 && storm > 0.62) {
          r = Math.min(255, r + 150);
          g = Math.min(255, g + 160);
          b = Math.min(255, b + 70);
        }

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Neptune Great Dark Spot
    ctx.fillStyle = 'rgba(15, 35, 110, 0.65)';
    ctx.beginPath();
    ctx.ellipse(350, 220, 45, 25, 0.1, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates Pluto Texture (Tombaugh Regio nitrogen heart and dark cratered terrain)
   */
  static generatePlutoTexture() {
    const { canvas, ctx } = this.createCanvas(1024, 512);
    const imgData = ctx.createImageData(1024, 512);
    const data = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 1024; x++) {
        const u = x / 1024;
        const v = y / 512;

        const n = noise.fbm(u * 8, v * 8, 5, 0.5, 2.0);
        const rocky = noise.fbm(u * 24, v * 24, 4, 0.5, 2.0);

        // Reddish tholin and icy patches
        const r = Math.floor(170 + n * 50 + rocky * 20);
        const g = Math.floor(135 + n * 35 + rocky * 15);
        const b = Math.floor(110 + n * 25 + rocky * 10);

        const idx = (y * 1024 + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Heart shape (Tombaugh Regio)
    ctx.fillStyle = 'rgba(245, 235, 225, 0.75)';
    ctx.beginPath();
    ctx.arc(520, 270, 35, 0, Math.PI * 2);
    ctx.arc(565, 270, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(490, 280);
    ctx.lineTo(545, 340);
    ctx.lineTo(595, 280);
    ctx.closePath();
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Helper to draw realistic circular craters on rocky bodies
   */
  static addCraterRims(ctx, width, height, count) {
    for (let i = 0; i < count; i++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const cr = 2 + Math.random() * 12;

      // Crater floor shadow
      ctx.fillStyle = 'rgba(25, 25, 25, 0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit rim
      ctx.strokeStyle = 'rgba(230, 230, 230, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, Math.PI * 0.75, Math.PI * 1.75);
      ctx.stroke();
    }
  }

  /**
   * Generates Deep Space Panorama Starfield with varied star magnitudes & nebula clouds
   */
  static generateStarfieldSphere() {
    const { canvas, ctx } = this.createCanvas(2048, 1024);

    // Deep cosmic space background
    ctx.fillStyle = '#020308';
    ctx.fillRect(0, 0, 2048, 1024);

    // Soft colored nebula dust clouds
    const nebulae = [
      { x: 400, y: 350, r: 280, color: 'rgba(50, 20, 110, 0.18)' },
      { x: 1200, y: 650, r: 350, color: 'rgba(15, 60, 120, 0.16)' },
      { x: 1700, y: 280, r: 260, color: 'rgba(80, 25, 60, 0.14)' },
      { x: 850, y: 500, r: 400, color: 'rgba(20, 70, 90, 0.12)' }
    ];

    nebulae.forEach(n => {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, n.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw 3,500 distinct stars with realistic spectral colors
    const starColors = ['#ffffff', '#fff8e7', '#e2f0ff', '#ffe2d4', '#d8edff'];
    for (let i = 0; i < 3500; i++) {
      const sx = Math.random() * 2048;
      const sy = Math.random() * 1024;
      const size = Math.random() < 0.92 ? (0.5 + Math.random() * 0.8) : (1.4 + Math.random() * 1.5);
      const alpha = 0.3 + Math.random() * 0.7;
      const color = starColors[Math.floor(Math.random() * starColors.length)];

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();

      // Star flare on brightest stars
      if (size > 2.0) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - 4, sy); ctx.lineTo(sx + 4, sy);
        ctx.moveTo(sx, sy - 4); ctx.lineTo(sx, sy + 4);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
  }
}
