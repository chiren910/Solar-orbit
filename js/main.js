/**
 * Main Application Entry Point
 * Bootstraps Three.js Solar System, Camera Manager, Audio Synth, and UI HUD.
 */

import { SolarSystem } from './solar-system.js';
import { CameraController } from './camera-controller.js';
import { SpaceAudioSynthesizer } from './audio-synthesizer.js';
import { UIController } from './ui-controller.js';

class App {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.loadingProgressBar = document.getElementById('loading-progress-bar');
    this.loadingStatus = document.getElementById('loading-status');

    this.solarSystem = null;
    this.cameraController = null;
    this.audioSynth = null;
    this.uiController = null;

    this.clock = new THREE.Clock();
  }

  async init() {
    try {
      this.updateProgress(20, 'Synthesizing Celestial Textures...');
      
      // Initialize Solar System 3D Engine
      this.solarSystem = new SolarSystem(this.container);
      await this.solarSystem.init();

      this.updateProgress(60, 'Calibrating Keplerian Orbits...');

      // Initialize Camera Controller
      this.cameraController = new CameraController(
        this.solarSystem.camera,
        this.solarSystem.controls,
        this.solarSystem
      );

      this.updateProgress(80, 'Initializing Space Audio Synthesizer...');

      // Initialize Soundscape Synthesizer
      this.audioSynth = new SpaceAudioSynthesizer();

      this.updateProgress(95, 'Booting Telemetry HUD...');

      // Initialize UI Controller
      this.uiController = new UIController(
        this.solarSystem,
        this.cameraController,
        this.audioSynth
      );

      this.updateProgress(100, 'Solar System Ready!');

      // Fade out loading screen smoothly
      setTimeout(() => {
        if (this.loadingOverlay) {
          this.loadingOverlay.classList.add('fade-out');
          setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
            // When opening in mobile view, show planet detail
            if (window.innerWidth <= 768 && this.uiController) {
              this.uiController.openDossier('sun');
            }
          }, 600);
        }
      }, 400);

      // Start Main Animation Loop
      this.animate();

    } catch (err) {
      console.error('Fatal initialization error:', err);
      if (this.loadingStatus) {
        this.loadingStatus.textContent = `Initialization Error: ${err.message}`;
        this.loadingStatus.style.color = '#ff4444';
      }
    }
  }

  updateProgress(percent, statusText) {
    if (this.loadingProgressBar) {
      this.loadingProgressBar.style.width = `${percent}%`;
    }
    if (this.loadingStatus) {
      this.loadingStatus.textContent = statusText;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaSeconds = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Camera transitions and follow-cam tracking
    if (this.cameraController) {
      this.cameraController.update();
    }

    // 2. Update Solar System physics, orbits, and render WebGL
    if (this.solarSystem) {
      this.solarSystem.update(deltaSeconds);
    }

    // 3. Update HUD live calendar date clock
    if (this.uiController) {
      this.uiController.updateClock();
    }
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
