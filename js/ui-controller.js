/**
 * UI Controller & HUD Telemetry Interface
 * Manages user interactions, time slider controls, telemetry dossier, settings, and shortcuts.
 */

import { CELESTIAL_DATA } from './astronomy-data.js';

export class UIController {
  constructor(solarSystem, cameraController, audioSynth) {
    this.solarSystem = solarSystem;
    this.camera = cameraController;
    this.audio = audioSynth;

    this.selectedBodyId = 'sun';
    this.isDossierOpen = false;
    this.justClosedDossierTime = 0;

    // Cache DOM Elements
    this.dom = {
      simDate: document.getElementById('sim-date'),
      realtimeStatusDot: document.getElementById('realtime-status-dot'),
      liveSyncBtn: document.getElementById('live-sync-btn'),
      playPauseBtn: document.getElementById('play-pause-btn'),
      playPauseIcon: document.getElementById('play-pause-icon'),
      reverseBtn: document.getElementById('reverse-btn'),
      speedSlider: document.getElementById('speed-slider'),
      speedVal: document.getElementById('speed-val'),
      speedPresets: document.querySelectorAll('.speed-preset'),
      viewPresets: document.querySelectorAll('.view-preset'),
      tourBtn: document.getElementById('tour-btn'),
      audioBtn: document.getElementById('audio-btn'),
      audioIcon: document.getElementById('audio-icon'),
      fullscreenBtn: document.getElementById('fullscreen-btn'),
      settingsToggleBtn: document.getElementById('settings-toggle-btn'),
      settingsDrawer: document.getElementById('settings-drawer'),
      settingsCloseBtn: document.getElementById('settings-close-btn'),
      // Ribbon
      ribbonItems: document.querySelectorAll('.planet-pill'),
      // Dossier
      dossier: document.getElementById('telemetry-dossier'),
      dossierBackdrop: document.getElementById('dossier-backdrop'),
      dossierClose: document.getElementById('dossier-close-btn'),
      dossierTitle: document.getElementById('dossier-title'),
      dossierType: document.getElementById('dossier-type'),
      dossierDesc: document.getElementById('dossier-desc'),
      dossierFact: document.getElementById('dossier-fact'),
      statDistance: document.getElementById('stat-distance'),
      statSpeed: document.getElementById('stat-speed'),
      statDiameter: document.getElementById('stat-diameter'),
      statMass: document.getElementById('stat-mass'),
      statGravity: document.getElementById('stat-gravity'),
      statTemp: document.getElementById('stat-temp'),
      statDay: document.getElementById('stat-day'),
      statYear: document.getElementById('stat-year'),
      statMoons: document.getElementById('stat-moons'),
      dossierAtmosphere: document.getElementById('dossier-atmosphere'),
      focusTargetBtn: document.getElementById('focus-target-btn'),
      // Settings toggles
      toggleOrbits: document.getElementById('toggle-orbits'),
      toggleLabels: document.getElementById('toggle-labels'),
      toggleAsteroids: document.getElementById('toggle-asteroids'),
      toggleGrid: document.getElementById('toggle-grid'),
      keyShortcutsModal: document.getElementById('shortcuts-modal'),
      shortcutsBtn: document.getElementById('shortcuts-btn'),
      shortcutsCloseBtn: document.getElementById('shortcuts-close-btn'),
      hudHeader: document.getElementById('hud-header'),
      vsrSlider: document.getElementById('vsr-slider'),
      vsrFill: document.getElementById('vsr-fill'),
      vsrSpeedBadge: document.getElementById('vsr-speed-badge'),
      vsrRail: document.getElementById('vertical-speed-rail'),
      timeJumpPanel: document.getElementById('time-jump-panel'),
      hudToggleBtn: document.getElementById('hud-toggle-btn'),
      hudToggleIcon: document.getElementById('hud-toggle-icon')
    };

    // Default simulation speed: 1.0 (Real-Time 1s = 1s)
    this.solarSystem.timeMultiplier = 1.0;

    this.bindEvents();
    this.updateDossier('sun');

    // If opening in mobile view, automatically show planet detail
    if (window.innerWidth <= 768) {
      this.openDossier('sun');
    }
  }

  /**
   * Exponential Speed Mapping for smooth slider control:
   * val 0 -> 1x (Real Time)
   * val 100 -> 31,536,000x (1 Year per second)
   */
  sliderToSpeed(val) {
    if (val <= 0) return 1.0;
    const max = 31536000;
    return Math.pow(max, val / 100);
  }

  speedToSlider(speed) {
    if (speed <= 1.0) return 0;
    const max = 31536000;
    return Math.max(0, Math.min(100, (Math.log(speed) / Math.log(max)) * 100));
  }

  formatSpeedLabel(speed) {
    const abs = Math.abs(speed);
    if (abs < 1.5) return '1x Real';
    if (abs < 60) return `${Math.round(abs)}x`;
    if (abs < 3600) return `${Math.round(abs / 60)}m/s`;
    if (abs < 86400) return `${Math.round(abs / 3600)}h/s`;
    if (abs <= 2592000) return `${Math.round(abs / 86400)}d/s`;
    if (abs < 31536000) return `${Math.round(abs / 2592000)}mo/s`;
    return `${(abs / 31536000).toFixed(1)}yr/s`;
  }

  bindEvents() {
    // 1. Time Simulation Controls
    if (this.dom.playPauseBtn) {
      this.dom.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    }

    if (this.dom.reverseBtn) {
      this.dom.reverseBtn.addEventListener('click', () => {
        this.solarSystem.timeMultiplier = -this.solarSystem.timeMultiplier;
        const isReversed = this.solarSystem.timeMultiplier < 0;
        this.dom.reverseBtn.classList.toggle('active', isReversed);
        this.syncVerticalRail();
        if (this.dom.liveSyncBtn && isReversed) {
          this.dom.liveSyncBtn.classList.remove('active');
        }
      });
    }

    if (this.dom.liveSyncBtn) {
      this.dom.liveSyncBtn.addEventListener('click', () => {
        this.solarSystem.syncToRealTime();
        this.solarSystem.timeMultiplier = 1.0;
        if (this.dom.speedSlider) this.dom.speedSlider.value = 0;
        if (this.dom.speedVal) this.dom.speedVal.textContent = '1x Real';
        if (this.dom.reverseBtn) this.dom.reverseBtn.classList.remove('active');
        if (this.dom.speedPresets) {
          this.dom.speedPresets.forEach(p => p.classList.remove('active'));
          const defPreset = document.querySelector('.speed-preset[data-speed="1"]');
          if (defPreset) defPreset.classList.add('active');
        }
        this.dom.liveSyncBtn.classList.add('active');
        this.syncVerticalRail();
      });
    }

    if (this.dom.speedSlider) {
      this.dom.speedSlider.addEventListener('input', (e) => {
        const sliderVal = parseFloat(e.target.value);
        const speed = this.sliderToSpeed(sliderVal);
        const sign = this.solarSystem.timeMultiplier < 0 ? -1 : 1;
        this.solarSystem.timeMultiplier = speed * sign;
        this.dom.speedVal.textContent = this.formatSpeedLabel(speed);
        this.clearActiveSpeedPreset();
        this.syncVerticalRail();

        if (this.dom.liveSyncBtn) {
          this.dom.liveSyncBtn.classList.toggle('active', sliderVal === 0 && sign > 0);
        }
      });
    }

    if (this.dom.speedPresets) {
      this.dom.speedPresets.forEach(preset => {
        preset.addEventListener('click', () => {
          const speed = parseFloat(preset.dataset.speed);
          const sign = this.solarSystem.timeMultiplier < 0 ? -1 : 1;
          this.solarSystem.timeMultiplier = speed * sign;
          if (this.dom.speedSlider) this.dom.speedSlider.value = this.speedToSlider(speed);
          if (this.dom.speedVal) this.dom.speedVal.textContent = this.formatSpeedLabel(speed);
          this.dom.speedPresets.forEach(p => p.classList.remove('active'));
          preset.classList.add('active');
          this.syncVerticalRail();

          if (this.dom.liveSyncBtn) {
            this.dom.liveSyncBtn.classList.toggle('active', speed === 1.0 && sign > 0);
          }
        });
      });
    }

    // 2. Camera & View Presets
    if (this.dom.viewPresets) {
      this.dom.viewPresets.forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          this.dom.viewPresets.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          if (view === 'overview') this.camera.resetOverview();
          else if (view === 'topdown') this.camera.setTopDownView();
          else if (view === 'angled') this.camera.setAngledView();
          else if (view === 'inner') this.camera.setInnerPlanetsView();
        });
      });
    }

    // 3. Guided Tour Button
    if (this.dom.tourBtn) {
      this.dom.tourBtn.addEventListener('click', () => this.toggleTour());
    }

    // 4. Audio Toggle Button
    if (this.dom.audioBtn) {
      this.dom.audioBtn.addEventListener('click', () => {
        const isNowOn = this.audio.toggle();
        this.dom.audioBtn.classList.toggle('active', isNowOn);
        if (this.dom.audioIcon) {
          this.dom.audioIcon.textContent = isNowOn ? '🔊' : '🔇';
        }
      });
    }

    // 5. Fullscreen Toggle
    if (this.dom.fullscreenBtn) {
      this.dom.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen();
        }
      });
    }

    // 6. Settings Drawer
    if (this.dom.settingsToggleBtn && this.dom.settingsDrawer) {
      this.dom.settingsToggleBtn.addEventListener('click', () => {
        this.dom.settingsDrawer.classList.toggle('open');
      });
    }
    if (this.dom.settingsCloseBtn && this.dom.settingsDrawer) {
      this.dom.settingsCloseBtn.addEventListener('click', () => {
        this.dom.settingsDrawer.classList.remove('open');
      });
    }

    // Settings switches
    if (this.dom.toggleOrbits) {
      this.dom.toggleOrbits.addEventListener('change', (e) => this.solarSystem.toggleOrbits(e.target.checked));
    }
    if (this.dom.toggleLabels) {
      this.dom.toggleLabels.addEventListener('change', (e) => this.solarSystem.toggleLabels(e.target.checked));
    }
    if (this.dom.toggleAsteroids) {
      this.dom.toggleAsteroids.addEventListener('change', (e) => this.solarSystem.toggleAsteroids(e.target.checked));
    }
    if (this.dom.toggleGrid) {
      this.dom.toggleGrid.addEventListener('change', (e) => this.solarSystem.toggleGrid(e.target.checked));
    }

    // 7. Planet Ribbon Click
    if (this.dom.ribbonItems) {
      this.dom.ribbonItems.forEach(item => {
        item.addEventListener('click', () => {
          const bodyId = item.dataset.planet;
          this.selectCelestialBody(bodyId);
        });
      });
    }

    // 8. 3D Scene Interaction Hook
    this.solarSystem.onPlanetSelected = (id) => {
      // If dossier was just closed by an outside click within 250ms, do not immediately reopen
      if (performance.now() - this.justClosedDossierTime < 250) {
        return;
      }
      // If the dossier is already open for this exact body, clicking it in 3D closes it
      if (this.isDossierOpen && this.selectedBodyId === id) {
        this.closeDossier();
        return;
      }
      this.selectCelestialBody(id);
    };

    // 9. Dossier Close & Focus
    if (this.dom.dossierClose) {
      this.dom.dossierClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDossier();
      });
    }

    if (this.dom.focusTargetBtn) {
      this.dom.focusTargetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.camera.focusOn(this.selectedBodyId);
        this.audio.playWarpSound();
      });
    }

    // 9b. Backdrop tap/click to close dossier
    if (this.dom.dossierBackdrop) {
      const handleBackdrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeDossier();
      };
      this.dom.dossierBackdrop.addEventListener('click', handleBackdrop);
      this.dom.dossierBackdrop.addEventListener('pointerup', handleBackdrop);
      this.dom.dossierBackdrop.addEventListener('touchend', handleBackdrop);
    }

    // 9c. Universal document click/tap outside dossier
    // 9c. Universal document click/tap outside dossier
    document.addEventListener('pointerup', (e) => {
      if (!this.isDossierOpen || !this.dom.dossier) return;

      // If clicked inside the dossier card itself, keep open
      if (this.dom.dossier.contains(e.target)) return;

      // If clicked on a planet ribbon pill, selectCelestialBody will handle it
      if (e.target.closest('.planet-pill')) return;

      // If clicked on an active HUD control button, let that control function
      if (e.target.closest('.hud-action-btn') || e.target.closest('.view-preset') || 
          e.target.closest('.speed-preset') || e.target.closest('.hud-btn-circle') || 
          e.target.closest('.hud-btn-pill') || e.target.closest('.speed-slider-wrap') ||
          e.target.closest('#settings-drawer') || e.target.closest('#shortcuts-modal')) return;

      // Clicked outside on 3D space, canvas, or backdrop -> close the dossier!
      this.closeDossier();
    });

    document.addEventListener('click', (e) => {
      if (!this.isDossierOpen || !this.dom.dossier) return;

      // If clicked inside the dossier or on a planet ribbon pill, do not close
      if (this.dom.dossier.contains(e.target) || e.target.closest('.planet-pill')) {
        return;
      }

      // Clicked anywhere outside the details card -> close it
      this.closeDossier();
    });

    // 9d. 3D Empty space click
    if (this.solarSystem) {
      this.solarSystem.onEmptySpaceClicked = () => {
        if (this.isDossierOpen) {
          this.closeDossier();
        }
      };
    }

        // 10. Keyboard Shortcuts & Touch Gestures Modal
    if (this.dom.shortcutsBtn && this.dom.keyShortcutsModal) {
      this.dom.shortcutsBtn.addEventListener('click', () => {
        this.dom.keyShortcutsModal.classList.add('open');
      });
    }
    if (this.dom.shortcutsCloseBtn && this.dom.keyShortcutsModal) {
      this.dom.shortcutsCloseBtn.addEventListener('click', () => {
        this.dom.keyShortcutsModal.classList.remove('open');
      });
    }
    if (this.dom.keyShortcutsModal) {
      this.dom.keyShortcutsModal.addEventListener('click', (e) => {
        if (e.target === this.dom.keyShortcutsModal) {
          this.dom.keyShortcutsModal.classList.remove('open');
        }
      });
    }

    // 10b. Mobile HUD Toggle Button (Collapse / Expand Controls)
    if (this.dom.hudToggleBtn && this.dom.hudHeader) {
      this.dom.hudToggleBtn.addEventListener('click', () => {
        const isCollapsed = this.dom.hudHeader.classList.toggle('hud-collapsed');
        if (this.dom.hudToggleIcon) {
          this.dom.hudToggleIcon.textContent = isCollapsed ? '▼' : '▲';
        }
      });
    }

    // 10c. Mobile Dossier Drag Handle Touch Gesture
    const dragHandle = document.querySelector('.dossier-drag-handle');
    if (dragHandle && this.dom.dossier) {
      let startTouchY = 0;
      dragHandle.addEventListener('touchstart', (e) => {
        startTouchY = e.touches[0].clientY;
      }, { passive: true });

      dragHandle.addEventListener('touchmove', (e) => {
        const diffY = e.touches[0].clientY - startTouchY;
        if (diffY > 40) {
          this.dom.dossier.classList.remove('open');
          this.isDossierOpen = false;
        }
      }, { passive: true });
    }

    // 10e. Time Travel Jump Buttons
    const tjButtons = document.querySelectorAll('.tj-btn');
    tjButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const jumpKey = btn.dataset.jump;
        this.performTimeJump(jumpKey);
        btn.classList.remove('tj-flash');
        void btn.offsetWidth;
        btn.classList.add('tj-flash');
        btn.addEventListener('animationend', () => btn.classList.remove('tj-flash'), { once: true });
      });
    });

    // 10f. Vertical Speed Rail (Volume-Style)
    if (this.dom.vsrSlider) {
      // Create visible thumb overlay
      const trackWrap = document.querySelector('.vsr-track-wrap');
      if (trackWrap) {
        this.vsrThumb = document.createElement('div');
        this.vsrThumb.className = 'vsr-thumb';
        this.vsrThumb.style.bottom = '0%';
        trackWrap.appendChild(this.vsrThumb);
      }

      this.dom.vsrSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        const speed = this.sliderToSpeed(val);
        const sign = this.solarSystem.timeMultiplier < 0 ? -1 : 1;
        this.solarSystem.timeMultiplier = speed * sign;

        // Sync the horizontal speed slider and presets
        if (this.dom.speedSlider) this.dom.speedSlider.value = val;
        if (this.dom.speedVal) this.dom.speedVal.textContent = this.formatSpeedLabel(speed);
        this.clearActiveSpeedPreset();

        // Update vertical rail visuals
        this.updateVerticalSpeedRail(val, speed);

        // Update LIVE button state
        if (this.dom.liveSyncBtn) {
          this.dom.liveSyncBtn.classList.toggle('active', val === 0 && sign > 0);
        }
      });

      // Dragging feedback
      this.dom.vsrSlider.addEventListener('pointerdown', () => {
        if (this.vsrThumb) this.vsrThumb.classList.add('dragging');
      });
      window.addEventListener('pointerup', () => {
        if (this.vsrThumb) this.vsrThumb.classList.remove('dragging');
      });

      // Initialize position
      this.updateVerticalSpeedRail(0, 1.0);
    }

    // 11. Global Keyboard Listeners
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  togglePlayPause() {
    this.solarSystem.isPaused = !this.solarSystem.isPaused;
    if (this.dom.playPauseIcon) {
      this.dom.playPauseIcon.textContent = this.solarSystem.isPaused ? '▶' : '⏸';
    }
    this.dom.playPauseBtn.classList.toggle('paused', this.solarSystem.isPaused);
  }

  clearActiveSpeedPreset() {
    if (this.dom.speedPresets) {
      this.dom.speedPresets.forEach(p => p.classList.remove('active'));
    }
  }

  toggleTour() {
    if (this.camera.isTourActive) {
      this.camera.stopTour();
      this.dom.tourBtn.classList.remove('active');
      this.dom.tourBtn.innerHTML = '<span class="tour-icon">🎬</span> <span class="tour-text">Cinematic<br>Tour</span>';
    } else {
      this.dom.tourBtn.classList.add('active');
      this.dom.tourBtn.innerHTML = '<span class="tour-icon">⏹</span> <span class="tour-text">Stop<br>Tour</span>';
      this.camera.startTour((bodyId, isFinished) => {
        if (isFinished) {
          this.dom.tourBtn.classList.remove('active');
          this.dom.tourBtn.innerHTML = '<span class="tour-icon">🎬</span> <span class="tour-text">Cinematic<br>Tour</span>';
        } else if (bodyId) {
          this.updateDossier(bodyId);
          this.highlightRibbon(bodyId);
          this.audio.playWarpSound();
        }
      });
    }
  }

  openDossier(bodyId = null) {
    if (bodyId && CELESTIAL_DATA[bodyId]) {
      this.selectedBodyId = bodyId;
      this.updateDossier(bodyId);
      this.highlightRibbon(bodyId);
    }
    if (this.dom.dossier) {
      this.dom.dossier.classList.add('open');
      this.isDossierOpen = true;
    }
    if (this.dom.dossierBackdrop) {
      this.dom.dossierBackdrop.classList.add('open');
    }
  }

  closeDossier() {
    this.justClosedDossierTime = performance.now();
    if (this.dom.dossier) {
      this.dom.dossier.classList.remove('open');
      this.isDossierOpen = false;
    }
    if (this.dom.dossierBackdrop) {
      this.dom.dossierBackdrop.classList.remove('open');
    }
  }

  selectCelestialBody(bodyId) {
    if (!CELESTIAL_DATA[bodyId]) return;

    this.selectedBodyId = bodyId;
    this.camera.stopTour();
    if (this.dom.tourBtn) {
      this.dom.tourBtn.classList.remove('active');
      this.dom.tourBtn.innerHTML = '<span class="tour-icon">🎬</span> <span class="tour-text">Cinematic<br>Tour</span>';
    }

    this.camera.focusOn(bodyId);
    this.audio.playWarpSound();
    this.highlightRibbon(bodyId);
    this.updateDossier(bodyId);
    this.openDossier();
  }

  highlightRibbon(bodyId) {
    if (!this.dom.ribbonItems) return;
    this.dom.ribbonItems.forEach(item => {
      const isActive = item.dataset.planet === bodyId;
      item.classList.toggle('active', isActive);
      if (isActive) {
        try {
          item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (err) {
          // Fallback for older browsers
          item.scrollIntoView(false);
        }
      }
    });
  }

  updateDossier(bodyId) {
    const data = CELESTIAL_DATA[bodyId];
    if (!data) return;

    if (this.dom.dossierTitle) this.dom.dossierTitle.textContent = data.name;
    if (this.dom.dossierType) this.dom.dossierType.textContent = data.type;
    if (this.dom.dossierDesc) this.dom.dossierDesc.textContent = data.description;
    if (this.dom.dossierFact) this.dom.dossierFact.textContent = data.funFact || '';

    if (this.dom.statDistance) this.dom.statDistance.textContent = data.distanceKm ? `${data.distanceKm} (${data.distanceAU || ''})` : 'System Center (0 km)';
    if (this.dom.statSpeed) this.dom.statSpeed.textContent = data.orbitalSpeed || 'N/A';
    if (this.dom.statDiameter) this.dom.statDiameter.textContent = `${(data.radius * 2).toLocaleString()} km`;
    if (this.dom.statMass) this.dom.statMass.textContent = data.mass || 'N/A';
    if (this.dom.statGravity) this.dom.statGravity.textContent = data.gravity || 'N/A';
    if (this.dom.statTemp) this.dom.statTemp.textContent = data.surfaceTemp || 'N/A';
    if (this.dom.statDay) this.dom.statDay.textContent = data.rotationPeriod || 'N/A';
    if (this.dom.statYear) this.dom.statYear.textContent = data.orbitalPeriodDays ? `${data.orbitalPeriodDays} Earth days` : 'N/A';
    if (this.dom.statMoons) this.dom.statMoons.textContent = data.moons !== undefined ? `${data.moons} confirmed` : '0';

    if (this.dom.dossierAtmosphere) {
      this.dom.dossierAtmosphere.innerHTML = '';
      if (data.atmosphere) {
        const parts = data.atmosphere.split(',');
        parts.forEach(p => {
          const tag = document.createElement('span');
          tag.className = 'atmos-tag';
          tag.textContent = p.trim();
          this.dom.dossierAtmosphere.appendChild(tag);
        });
      }
    }
  }

  handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        this.togglePlayPause();
        break;
      case 'KeyR':
        e.preventDefault();
        this.camera.resetOverview();
        this.dom.dossier.classList.remove('open');
        this.highlightRibbon(null);
        break;
      case 'KeyT':
        e.preventDefault();
        this.toggleTour();
        break;
      case 'Escape':
        e.preventDefault();
        if (this.dom.keyShortcutsModal && this.dom.keyShortcutsModal.classList.contains('open')) {
          this.dom.keyShortcutsModal.classList.remove('open');
        } else if (this.dom.settingsDrawer && this.dom.settingsDrawer.classList.contains('open')) {
          this.dom.settingsDrawer.classList.remove('open');
        } else {
          this.camera.resetOverview();
          this.dom.dossier.classList.remove('open');
        }
        break;
      case 'Digit0':
        this.selectCelestialBody('sun');
        break;
      case 'Digit1':
        this.selectCelestialBody('mercury');
        break;
      case 'Digit2':
        this.selectCelestialBody('venus');
        break;
      case 'Digit3':
        this.selectCelestialBody('earth');
        break;
      case 'Digit4':
        this.selectCelestialBody('mars');
        break;
      case 'Digit5':
        this.selectCelestialBody('jupiter');
        break;
      case 'Digit6':
        this.selectCelestialBody('saturn');
        break;
      case 'Digit7':
        this.selectCelestialBody('uranus');
        break;
      case 'Digit8':
        this.selectCelestialBody('neptune');
        break;
      case 'Digit9':
        this.selectCelestialBody('pluto');
        break;
    }
  }

  /**
   * Perform an instant time jump on the simulation date
   */
  performTimeJump(jumpKey) {
    const direction = 1;
    const currentDate = this.solarSystem.currentSimDate;
    const newDate = new Date(currentDate.getTime());

    switch (jumpKey) {
      case '1m':
        newDate.setMonth(newDate.getMonth() + (1 * direction));
        break;
      case '1y':
        newDate.setFullYear(newDate.getFullYear() + (1 * direction));
        break;
      case '5y':
        newDate.setFullYear(newDate.getFullYear() + (5 * direction));
        break;
      case '10y':
        newDate.setFullYear(newDate.getFullYear() + (10 * direction));
        break;
      case '100y':
        newDate.setFullYear(newDate.getFullYear() + (100 * direction));
        break;
      default:
        return;
    }

    this.solarSystem.currentSimDate = newDate;

    if (this.dom.liveSyncBtn) {
      this.dom.liveSyncBtn.classList.remove('active');
    }
  }

  /**
   * Update vertical speed rail fill, thumb, and badge
   */
  updateVerticalSpeedRail(sliderVal, speed) {
    const percent = Math.max(0, Math.min(100, sliderVal));
    if (this.dom.vsrFill) {
      this.dom.vsrFill.style.height = percent + '%';
    }
    if (this.vsrThumb) {
      this.vsrThumb.style.bottom = percent + '%';
    }
    if (this.dom.vsrSpeedBadge) {
      this.dom.vsrSpeedBadge.textContent = this.formatSpeedLabel(speed);
    }
  }

  /**
   * Sync vertical rail when horizontal slider or speed presets change
   */
  syncVerticalRail() {
    const speed = Math.abs(this.solarSystem.timeMultiplier);
    const sliderVal = this.speedToSlider(speed);
    if (this.dom.vsrSlider) {
      this.dom.vsrSlider.value = sliderVal;
    }
    this.updateVerticalSpeedRail(sliderVal, speed);
  }

  /**
   * Called every frame to update live simulation calendar date and ticking seconds
   */
  updateClock() {
    if (this.dom.simDate) {
      const d = this.solarSystem.getSimulatedDate();
      const pad = (n) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      const secs = pad(d.getSeconds());

      this.dom.simDate.textContent = `${month} ${day}, ${year} ${hours}:${mins}:${secs}`;
    }

    if (this.dom.realtimeStatusDot) {
      const isRealTime = Math.abs(this.solarSystem.timeMultiplier - 1.0) < 0.05 && !this.solarSystem.isPaused;
      this.dom.realtimeStatusDot.classList.toggle('active', isRealTime);
    }
  }
}
