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

    // Determine the true visual bounds (including rings for Saturn/Uranus and corona for Sun)
    const baseRadius = celestialObj.visualRadius || 5;
    let boundingRadius = baseRadius;

    if (celestialObj.data) {
      if (celestialObj.data.hasRings && celestialObj.data.ringOuterRadius) {
        // Rings extend wider than the sphere (Saturn ringOuterRadius=16.5, Uranus=8.8)
        boundingRadius = Math.max(boundingRadius, celestialObj.data.ringOuterRadius * 1.04);
      } else if (bodyId === 'sun') {
        // Sun corona
        boundingRadius = baseRadius * 1.15;
      }
    }

    // Dynamic framing based on camera viewport aspect ratio
    // On portrait mobile (aspect < 1), horizontal FOV is narrow: 2 * atan(tan(fov/2) * aspect)
    // We calibrate distance so the planet fills ~80% of screen width, never cutting on the sides!
    const aspect = (this.camera && this.camera.aspect) ? this.camera.aspect : (window.innerWidth / window.innerHeight);
    const fov = (this.camera && this.camera.fov) ? this.camera.fov : 45;
    const fovRad = (fov * Math.PI) / 180;
    const tanHalfFov = Math.tan(fovRad / 2);

    const isMobilePortrait = aspect < 1.0;
    // Fill ratio: 80% on mobile portrait (10% padding on each side), 72% on landscape
    const fillRatio = isMobilePortrait ? 0.80 : 0.72;

    const distForHeight = boundingRadius / (fillRatio * tanHalfFov);
    const distForWidth = boundingRadius / (fillRatio * tanHalfFov * aspect);

    // Guaranteed framing distance to prevent clipping on ANY screen edge
    const requiredDist = Math.max(distForHeight, distForWidth);

    // Elevation angle: slight angle to view equatorial details and 3D spherical depth
    const elevAngleRad = (isMobilePortrait ? 10 : 15) * (Math.PI / 180);
    const elevY = requiredDist * Math.sin(elevAngleRad);
    const distZ = requiredDist * Math.cos(elevAngleRad);

    const offset = customOffset || new THREE.Vector3(0, elevY, distZ);
    this.targetOffset.copy(offset);

    // Allow user to manually zoom in extra close ("user can manual zoom use and get extra zoom fill")
    // Set minDistance close to the planet surface so pinch-to-zoom gives an ultra-close inspection view!
    if (this.controls) {
      this.controls.minDistance = Math.max(0.6, baseRadius * 1.14);
      this.controls.maxDistance = Math.max(900, requiredDist * 4);
    }

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
    if (this.controls) {
      this.controls.minDistance = 4;
      this.controls.maxDistance = 1800;
    }

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
