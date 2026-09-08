/**
 * Procedural Space Soundscape & Audio Synthesizer
 * Built using native Web Audio API - zero external assets, 100% reliable.
 */

export class SpaceAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.isMuted = true;
    this.oscillators = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  startDrone() {
    if (!this.initialized) this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;

    // Cosmic Sub-Bass Drone (55Hz and detuned harmonics)
    const baseFreq = 55.0; // Note A1
    const frequencies = [baseFreq, baseFreq * 1.5, baseFreq * 2.01, baseFreq * 2.99];

    // Master filter for deep ethereal space warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    // LFO to slowly sweep filter cutoff (pulsing cosmos effect)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.06, this.ctx.currentTime); // 16 second cycle
    lfoGain.gain.setValueAtTime(90, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.oscillators.push(lfo);

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.4, this.ctx.currentTime);

      oscGain.gain.setValueAtTime(0.08 / (idx + 1), this.ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start();
      this.oscillators.push(osc);
    });

    filter.connect(this.masterGain);

    this.isPlaying = true;
    if (!this.isMuted) {
      this.fadeIn();
    }
  }

  fadeIn(duration = 2.0) {
    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.35, now + duration);
    this.isMuted = false;
  }

  fadeOut(duration = 1.0) {
    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    this.isMuted = true;
  }

  toggle() {
    if (!this.initialized) {
      this.init();
      this.startDrone();
      this.fadeIn();
      return true;
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isMuted) {
      if (!this.isPlaying) this.startDrone();
      this.fadeIn();
      return true; // Audio is now ON
    } else {
      this.fadeOut();
      return false; // Audio is now OFF
    }
  }

  /**
   * Sci-Fi Warp Shimmer Sound Effect when focusing or transitioning between celestial bodies
   */
  playWarpSound() {
    if (this.isMuted || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.85);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {
      // Audio playback failed silently
    }
  }
}
