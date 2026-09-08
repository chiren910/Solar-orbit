# 🪐 ORBIT 3D — Interactive Solar System Simulation

An interactive, scientifically calibrated, real-time 3D Solar System simulation built with WebGL and Three.js. Features photorealistic NASA textures, Keplerian orbital mechanics, live astronomical ephemeris positions, accurate planetary axial rotations, interactive telemetry dossiers, and cinematic camera tours.

---

## ✨ Features

- **Accurate Astronomical Ephemeris**: Real-time heliocentric positioning of all 8 major planets plus Pluto and Earth's Moon.
- **Calibrated Axial Rotations**: Realistic physical rotation periods for all celestial bodies (e.g., Earth's 23.93-hour day, Jupiter's 9.93-hour rapid spin, Venus's retrograde rotation).
- **High-Fidelity Visuals & Shaders**:
  - Central Sun with dynamic corona flare shaders and PointLight radiance.
  - NASA surface textures with specular ocean reflections and bump maps.
  - Atmospheric limb glow scattering on Earth.
  - Multi-tiered Saturn ring geometry with alpha shadow mapping.
  - Procedural asteroid belt (Mars-Jupiter) and Kuiper belt particles.
- **Intuitive Time Controls**:
  - **`LIVE`** Real-time synchronization lock.
  - Smooth exponential speed slider (`1x Real` up to `1yr/s`).
  - Speed presets: `1x (Real)`, `1m/s`, `1h/s`, `1d/s`, `1mo/s`, `1yr/s`.
  - Pause / Resume and Time Reversal (`⏮`).
- **Interactive Telemetry Dossier**:
  - Click any celestial body or select from the bottom ribbon to view comprehensive astronomical data (distance, orbital velocity, mass, gravity, surface temperature, composition, and moons).
- **Cinematic Guided Tours & Camera Presets**:
  - Automated guided flyby tours of all planets.
  - Preset perspectives: System Overview, Top-Down Ecliptic, 45° Angled, and Inner Planets.
- **Ambient Soundscape**:
  - Procedural Web Audio synthesizer generating deep space cosmic ambient drones and warp sounds.

---

## 🚀 Quick Start

### Option 1: Using Any Static Web Server
Clone the repository and serve with any local HTTP server (required for WebGL textures and ES Modules):

```bash
git clone https://github.com/chiren910/Solar-orbit.git
cd Solar-orbit

# Using Python:
python -m http.server 8080

# Using Node.js:
npx serve .

# Using PHP:
php -S localhost:8080
```

Open your browser at `http://localhost:8080/`.

### Option 2: Apache / XAMPP
Place the directory inside your XAMPP `htdocs` folder:
`c:/xampp/htdocs/orbit/`
and navigate to `http://localhost/orbit/` in your browser.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Pause / Resume time simulation |
| `R` | Reset camera to overview |
| `T` | Start / Stop Cinematic Tour |
| `0` - `9` | Focus camera on Sun (`0`) to Pluto (`9`) |
| `Esc` | Close active dossier or settings modal |
| `Mouse Drag` | Orbit and rotate camera perspective |
| `Mouse Scroll` | Zoom in / out |

---

## 🛠️ Technology Stack

- **Three.js** (WebGL 3D Rendering Engine & OrbitControls)
- **Vanilla JavaScript (ES Modules)**
- **HTML5 Canvas / Web Audio API**
- **Modern CSS3 (Glassmorphism & Responsive HUD Layout)**
- **Google Fonts (Orbitron, Space Grotesk, Space Mono, Outfit)**

---

## 📄 License

MIT License © 2026 Chiren Kevadiya
