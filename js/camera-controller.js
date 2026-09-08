/**
 * Camera Controller & Guided Cinematic Tour Manager
 * Handles smooth fly-to interpolations, follow-cam orbital tracking, and automated tours.
 */

export class CameraController {
  constructor(camera, controls, solarSystem) {
    this.camera = camera;
    this.controls = controls;
    this.solarSystem = solarSystem;

    this.targetObject = null;
    this.targetOffset = new THREE.Vector3(0, 8, 20);
    this.isFollowing = false;

    // Transition interpolation state
    this.isTransitioning = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 1600; // ms
    this.startCamPos = new THREE.Vector3();
    this.endCamPos = new THREE.Vector3();
    this.startTargetPos = new THREE.Vector3();
    this.endTargetPos = new THREE.Vector3();

    // Tour state
    this.isTourActive = false;
    this.tourSequence = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    this.currentTourIndex = 0;
    this.tourTimer = null;
    this.onTourStepCallback = null;
  }

  /**
   * Smoothly moves the camera to focus on a celestial body
   */
  focusOn(bodyId, customOffset = null, duration = 1600) {
    const celestialObj = this.solarSystem.getCelestialObject(bodyId);
    if (!celestialObj) return;

    this.targetObject = celestialObj;
    this.isFollowing = true;

    // Calculate ideal camera distance based on the object's visual radius
    const radius = celestialObj.visualRadius || 5;
    const defaultDist = Math.max(12, radius * 3.6);
    
    // Position offset with an aesthetic elevation angle
    const offset = customOffset || new THREE.Vector3(0, radius * 1.2, defaultDist);
    this.targetOffset.copy(offset);

    // Starting points
    this.startCamPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    // End points in world space
    const targetWorldPos = new THREE.Vector3();
    celestialObj.mesh.getWorldPosition(targetWorldPos);

    this.endTargetPos.copy(targetWorldPos);
    this.endCamPos.copy(targetWorldPos).add(this.targetOffset);

    this.transitionStartTime = performance.now();
    this.transitionDuration = duration;
    this.isTransitioning = true;
  }

  /**
   * Reset to full solar system overview
   */
  resetOverview(duration = 1800) {
    this.stopTour();
    this.isFollowing = false;
    this.targetObject = null;

    this.startCamPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    this.endCamPos.set(0, 240, 360);
    this.endTargetPos.set(0, 0, 0);

    this.transitionStartTime = performance.now();
    this.transitionDuration = duration;
    this.isTransitioning = true;
  }

  /**
   * Top-down 90 degree view perpendicular to ecliptic
   */
  setTopDownView(duration = 1600) {
    this.stopTour();
    this.isFollowing = false;
    this.targetObject = null;

    this.startCamPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    this.endCamPos.set(0, 420, 0.1);
    this.endTargetPos.set(0, 0, 0);

    this.transitionStartTime = performance.now();
    this.transitionDuration = duration;
    this.isTransitioning = true;
  }

  /**
   * Side angled inclined view (45 degree view)
   */
  setAngledView(duration = 1600) {
    this.stopTour();
    this.isFollowing = false;
    this.targetObject = null;

    this.startCamPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    this.endCamPos.set(220, 180, 260);
    this.endTargetPos.set(0, 0, 0);

    this.transitionStartTime = performance.now();
    this.transitionDuration = duration;
    this.isTransitioning = true;
  }

  /**
   * Inner terrestrial planets focus view
   */
  setInnerPlanetsView(duration = 1600) {
    this.stopTour();
    this.isFollowing = false;
    this.targetObject = null;

    this.startCamPos.copy(this.camera.position);
    this.startTargetPos.copy(this.controls.target);

    this.endCamPos.set(0, 110, 150);
    this.endTargetPos.set(0, 0, 0);

    this.transitionStartTime = performance.now();
    this.transitionDuration = duration;
    this.isTransitioning = true;
  }

  /**
   * Update called on each animation frame
   */
  update() {
    const now = performance.now();

    if (this.isTransitioning) {
      const elapsed = now - this.transitionStartTime;
      let progress = Math.min(1.0, elapsed / this.transitionDuration);

      // Smooth cubic ease-in-out
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // If following a moving planet, update end positions dynamically
      if (this.targetObject) {
        const currentWorldPos = new THREE.Vector3();
        this.targetObject.mesh.getWorldPosition(currentWorldPos);
        this.endTargetPos.copy(currentWorldPos);
        this.endCamPos.copy(currentWorldPos).add(this.targetOffset);
      }

      this.camera.position.lerpVectors(this.startCamPos, this.endCamPos, ease);
      this.controls.target.lerpVectors(this.startTargetPos, this.endTargetPos, ease);

      if (progress >= 1.0) {
        this.isTransitioning = false;
      }
    } else if (this.isFollowing && this.targetObject) {
      // Keep tracking the moving body along its orbit
      const targetPos = new THREE.Vector3();
      this.targetObject.mesh.getWorldPosition(targetPos);

      // Calculate the delta movement of the target
      const delta = targetPos.clone().sub(this.controls.target);
      this.controls.target.copy(targetPos);
      this.camera.position.add(delta);
    }

    this.controls.update();
  }

  /**
   * Automated Cinematic Tour
   */
  startTour(onStepChange = null) {
    this.isTourActive = true;
    this.currentTourIndex = 0;
    this.onTourStepCallback = onStepChange;
    this.nextTourStep();
  }

  nextTourStep() {
    if (!this.isTourActive) return;

    if (this.currentTourIndex >= this.tourSequence.length) {
      // Tour completed: zoom back to overview
      this.resetOverview();
      this.stopTour();
      if (this.onTourStepCallback) this.onTourStepCallback(null, true);
      return;
    }

    const currentBodyId = this.tourSequence[this.currentTourIndex];
    this.focusOn(currentBodyId, null, 2000);

    if (this.onTourStepCallback) {
      this.onTourStepCallback(currentBodyId, false);
    }

    this.currentTourIndex++;

    // Wait 7.5 seconds before transitioning to next body
    this.tourTimer = setTimeout(() => {
      this.nextTourStep();
    }, 7500);
  }

  stopTour() {
    this.isTourActive = false;
    if (this.tourTimer) {
      clearTimeout(this.tourTimer);
      this.tourTimer = null;
    }
  }
}
