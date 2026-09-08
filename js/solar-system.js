/**
 * Solar System 3D Engine & Astronomical Simulation
 * Features REAL NASA planetary surface textures, bump maps, specular ocean reflections,
 * atmospheric scattering limb shaders, Keplerian orbits, asteroid belts, and lighting.
 */

import { CELESTIAL_DATA, ASTEROID_BELT_CONFIG, KUIPER_BELT_CONFIG, ORBITAL_ELEMENTS, calculateHeliocentricCoords } from './astronomy-data.js';
import { TextureGenerator } from './texture-generator.js';

export class SolarSystem {
  constructor(container) {
    this.container = container;

    // Simulation time state: Default to Real Time (1s in real world = 1s in simulation)
    this.currentSimDate = new Date();
    this.timeMultiplier = 1.0; // 1.0 = Real Time
    this.isPaused = false;

    // Visual options
    this.showOrbits = true;
    this.showLabels = true;
    this.showAsteroids = true;
    this.showMoons = true;
    this.showGrid = false;

    // Three.js instances
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.textureLoader = new THREE.TextureLoader();

    // Celestial collections
    this.celestialObjects = new Map();
    this.orbitLines = [];
    this.labels = [];
    this.interactiveMeshes = [];
    this.asteroidBelt = null;
    this.kuiperBelt = null;
    this.eclipticGrid = null;
    this.sunLight = null;
    this.sunCorona = null;
    this.earthClouds = null;
    this.moonObject = null;
    this.galileanMoons = [];

    // Interaction callbacks
    this.onPlanetSelected = null;
    this.hoveredObject = null;
  }

  async init() {
    this.setupRenderer();
    this.setupScene();
    this.setupLighting();
    this.setupStarfield();
    this.buildCelestialBodies();
    this.buildAsteroidBelt();
    this.buildKuiperBelt();
    this.buildEclipticGrid();
    this.setupInteraction();

    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020308, 0.00035);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.5,
      4000
    );
    this.camera.position.set(0, 220, 360);

    // OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 1800;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.15;
    this.controls.target.set(0, 0, 0);
  }

  setupLighting() {
    // Central Sun Light - bright warm solar illumination
    this.sunLight = new THREE.PointLight(0xfffaed, 3.6, 1400, 0.5);
    this.sunLight.position.set(0, 0, 0);
    this.scene.add(this.sunLight);

    // Secondary subtle fill lights so planet dark sides have realistic Earthshine/space ambient
    const ambientLight = new THREE.AmbientLight(0x1a2238, 0.5);
    this.scene.add(ambientLight);
  }

  setupStarfield() {
    // 360-degree deep space background sphere with real Milky Way starfield
    const starGeo = new THREE.SphereGeometry(1600, 64, 32);
    
    // Load real galaxy starfield texture
    const starTexture = this.loadTexture('textures/galaxy_starfield.png', () => TextureGenerator.generateStarfieldSphere());
    const starMat = new THREE.MeshBasicMaterial({
      map: starTexture,
      side: THREE.BackSide
    });
    const starSphere = new THREE.Mesh(starGeo, starMat);
    this.scene.add(starSphere);

    // Twinkling foreground star particles for deep 3D parallax
    const starParticleCount = 2200;
    const starGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(starParticleCount * 3);
    const colors = new Float32Array(starParticleCount * 3);

    for (let i = 0; i < starParticleCount; i++) {
      const radius = 350 + Math.random() * 1100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const isBlue = Math.random() > 0.7;
      colors[i * 3] = isBlue ? 0.75 : 1.0;
      colors[i * 3 + 1] = isBlue ? 0.88 : 0.95;
      colors[i * 3 + 2] = 1.0;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starParticleMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    const starParticles = new THREE.Points(starGeom, starParticleMat);
    this.scene.add(starParticles);
  }

  /**
   * Helper to load real texture with fallback
   */
  loadTexture(path, fallbackFn) {
    return this.textureLoader.load(
      path,
      (tex) => {
        if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
        else tex.encoding = THREE.sRGBEncoding;
      },
      undefined,
      (err) => {
        console.warn(`Texture ${path} failed, using procedural fallback.`, err);
        return fallbackFn ? fallbackFn() : null;
      }
    );
  }

  /**
   * Atmospheric Limb Glow Shader (Rayleigh scattering rim)
   */
  createAtmosphereGlow(radius, colorHex, power = 2.4) {
    const vertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const fragmentShader = `
      varying vec3 vNormal;
      uniform vec3 glowColor;
      uniform float power;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
        gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.85;
      }
    `;
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(colorHex) },
        power: { value: power }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    const geo = new THREE.SphereGeometry(radius * 1.08, 48, 48);
    return new THREE.Mesh(geo, mat);
  }

  buildCelestialBodies() {
    // 1. Build the Sun
    this.buildSun();

    // 2. Build the Planets
    const planetKeys = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    planetKeys.forEach(key => {
      this.buildPlanet(CELESTIAL_DATA[key]);
    });
  }

  buildSun() {
    const data = CELESTIAL_DATA.sun;
    const sunGroup = new THREE.Group();

    // Sun Real Photosphere Mesh
    const sunGeo = new THREE.SphereGeometry(data.visualRadius, 64, 64);
    const sunTexture = this.loadTexture('textures/sunmap.jpg', () => TextureGenerator.generateSunTexture());
    
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTexture
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Inner Corona Atmosphere Pulse
    const coronaGeo = new THREE.SphereGeometry(data.visualRadius * 1.14, 48, 48);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.38,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // Outer Solar Flare Halo
    const outerHaloGeo = new THREE.SphereGeometry(data.visualRadius * 1.32, 32, 32);
    const outerHaloMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const outerHalo = new THREE.Mesh(outerHaloGeo, outerHaloMat);
    sunGroup.add(outerHalo);

    this.scene.add(sunGroup);
    this.sunCorona = coronaMesh;

    // Register Sun
    const sunObj = {
      id: 'sun',
      data: data,
      mesh: sunMesh,
      group: sunGroup,
      visualRadius: data.visualRadius,
      rotationSpeed: (2 * Math.PI) / (25.38 * 24)
    };
    this.celestialObjects.set('sun', sunObj);
    this.interactiveMeshes.push(sunMesh);
    sunMesh.userData = { id: 'sun' };

    // Sun Label
    this.create3DLabel('sun', data.name, 0, data.visualRadius + 4.5, 0);
  }

  buildPlanet(data) {
    const orbitGroup = new THREE.Group();

    // Apply orbital inclination tilt to the whole orbital plane
    if (data.inclination) {
      orbitGroup.rotation.x = THREE.MathUtils.degToRad(data.inclination * 0.7);
    }
    this.scene.add(orbitGroup);

    // 1. Create Orbit Line
    const orbitLine = this.createOrbitLine(data);
    orbitGroup.add(orbitLine);
    this.orbitLines.push(orbitLine);

    // 2. Planet Positioner Group (moves along orbit)
    const positionerGroup = new THREE.Group();
    orbitGroup.add(positionerGroup);

    // Initial real-time astronomical placement for current date
    if (ORBITAL_ELEMENTS[data.id]) {
      const pos = calculateHeliocentricCoords(data.id, this.currentSimDate);
      const baseRadius = data.orbitRadius;
      const aAU = ORBITAL_ELEMENTS[data.id].a;
      const scaledDist = baseRadius * (pos.r / aAU);
      const angle = Math.atan2(pos.y, pos.x);
      const inclY = pos.z * (baseRadius / aAU) * 0.7;

      positionerGroup.position.set(
        Math.cos(angle) * scaledDist,
        inclY,
        Math.sin(angle) * scaledDist
      );
    }

    // 3. Planet Axial Tilt & Body Mesh Group
    const bodyGroup = new THREE.Group();
    if (data.axialTilt) {
      bodyGroup.rotation.z = THREE.MathUtils.degToRad(data.axialTilt);
    }
    positionerGroup.add(bodyGroup);

    // Real NASA Textures, Bump Maps, and Materials
    let mapTex, bumpTex, specTex;
    let planetMat;

    switch (data.id) {
      case 'mercury':
        mapTex = this.loadTexture('textures/mercurymap.jpg', () => TextureGenerator.generateMercuryTexture());
        bumpTex = this.loadTexture('textures/mercurybump.jpg');
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          bumpMap: bumpTex,
          bumpScale: 0.08,
          roughness: 0.95,
          metalness: 0.05
        });
        break;

      case 'venus':
        mapTex = this.loadTexture('textures/venusmap.jpg', () => TextureGenerator.generateVenusTexture());
        bumpTex = this.loadTexture('textures/venusbump.jpg');
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          bumpMap: bumpTex,
          bumpScale: 0.04,
          roughness: 0.82,
          metalness: 0.05
        });
        // Venus atmospheric glow
        bodyGroup.add(this.createAtmosphereGlow(data.visualRadius, 0xffd27d, 2.2));
        break;

      case 'earth':
        mapTex = this.loadTexture('textures/earthmap1k.jpg', () => TextureGenerator.generateEarthTexture());
        bumpTex = this.loadTexture('textures/earthbump1k.jpg');
        specTex = this.loadTexture('textures/earthspec1k.jpg');
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          bumpMap: bumpTex,
          bumpScale: 0.12,
          roughnessMap: specTex,
          roughness: 0.85,
          metalness: 0.12
        });
        // Earth atmospheric Rayleigh scattering glow (cyan/blue)
        bodyGroup.add(this.createAtmosphereGlow(data.visualRadius, 0x00a2ff, 2.3));
        break;

      case 'mars':
        mapTex = this.loadTexture('textures/marsmap1k.jpg', () => TextureGenerator.generateMarsTexture());
        bumpTex = this.loadTexture('textures/marsbump1k.jpg');
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          bumpMap: bumpTex,
          bumpScale: 0.08,
          roughness: 0.88,
          metalness: 0.05
        });
        // Mars faint reddish atmospheric glow
        bodyGroup.add(this.createAtmosphereGlow(data.visualRadius, 0xe06030, 2.6));
        break;

      case 'jupiter':
        mapTex = this.loadTexture('textures/jupitermap.jpg', () => TextureGenerator.generateJupiterTexture());
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          roughness: 0.78,
          metalness: 0.05
        });
        break;

      case 'saturn':
        mapTex = this.loadTexture('textures/saturnmap.jpg', () => TextureGenerator.generateSaturnTexture());
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          roughness: 0.84,
          metalness: 0.05
        });
        break;

      case 'uranus':
        mapTex = this.loadTexture('textures/uranusmap.jpg', () => TextureGenerator.generateUranusTexture());
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          roughness: 0.75,
          metalness: 0.05
        });
        bodyGroup.add(this.createAtmosphereGlow(data.visualRadius, 0x76dbe6, 2.4));
        break;

      case 'neptune':
        mapTex = this.loadTexture('textures/neptunemap.jpg', () => TextureGenerator.generateNeptuneTexture());
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          roughness: 0.72,
          metalness: 0.05
        });
        bodyGroup.add(this.createAtmosphereGlow(data.visualRadius, 0x3064e8, 2.3));
        break;

      case 'pluto':
        mapTex = this.loadTexture('textures/plutomap1k.jpg', () => TextureGenerator.generatePlutoTexture());
        bumpTex = this.loadTexture('textures/plutobump1k.jpg');
        planetMat = new THREE.MeshStandardMaterial({
          map: mapTex,
          bumpMap: bumpTex,
          bumpScale: 0.07,
          roughness: 0.94,
          metalness: 0.05
        });
        break;
    }

    const planetGeo = new THREE.SphereGeometry(data.visualRadius, 54, 54);
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    bodyGroup.add(planetMesh);
    planetMesh.userData = { id: data.id };
    this.interactiveMeshes.push(planetMesh);

    // Planet-Specific Additions (Clouds, Rings, Moons)
    if (data.id === 'earth') {
      // Dynamic Cloud Layer with real NASA cloud map
      const cloudsGeo = new THREE.SphereGeometry(data.visualRadius * 1.022, 54, 54);
      const cloudsTex = this.loadTexture('textures/earthcloudmap.jpg', () => TextureGenerator.generateEarthCloudsTexture());
      const cloudsTrans = this.loadTexture('textures/earthcloudmaptrans.jpg');

      const cloudsMat = new THREE.MeshStandardMaterial({
        map: cloudsTex,
        alphaMap: cloudsTrans,
        transparent: true,
        opacity: 0.88,
        blending: THREE.NormalBlending
      });
      this.earthClouds = new THREE.Mesh(cloudsGeo, cloudsMat);
      bodyGroup.add(this.earthClouds);

      // Earth's Moon with real NASA lunar texture
      this.buildMoon(positionerGroup);

    } else if (data.id === 'saturn' && data.hasRings) {
      // Saturn's Majestic Rings with real NASA ring texture & alpha pattern
      const ringGeo = new THREE.RingGeometry(data.ringInnerRadius, data.ringOuterRadius, 64);
      this.orientRingUVs(ringGeo);

      const ringColorTex = this.loadTexture('textures/saturnringcolor.jpg', () => TextureGenerator.generateSaturnRingTexture());
      const ringPatternTex = this.loadTexture('textures/saturnringpattern.gif');

      const ringMat = new THREE.MeshStandardMaterial({
        map: ringColorTex,
        alphaMap: ringPatternTex,
        side: THREE.DoubleSide,
        transparent: true,
        roughness: 0.88,
        metalness: 0.1
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      bodyGroup.add(ringMesh);

    } else if (data.id === 'uranus' && data.hasRings) {
      // Uranus Thin Ring with real texture
      const ringGeo = new THREE.RingGeometry(data.ringInnerRadius, data.ringOuterRadius, 48);
      this.orientRingUVs(ringGeo);
      const ringTex = this.loadTexture('textures/uranusringcolour.jpg', () => TextureGenerator.generateUranusRingTexture());
      const ringTrans = this.loadTexture('textures/uranusringtrans.gif');
      
      const ringMat = new THREE.MeshStandardMaterial({
        map: ringTex,
        alphaMap: ringTrans,
        side: THREE.DoubleSide,
        transparent: true,
        roughness: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      bodyGroup.add(ringMesh);

    } else if (data.id === 'jupiter' && data.galileanMoons) {
      // Galilean Moons (Io, Europa, Ganymede, Callisto)
      this.buildGalileanMoons(positionerGroup, data.galileanMoons);
    }

    // 3D Billboard Label
    const labelSprite = this.create3DLabel(data.id, data.name, 0, data.visualRadius + 2.8, 0);
    positionerGroup.add(labelSprite);

    // Register Object
    const celestialObj = {
      id: data.id,
      data: data,
      mesh: planetMesh,
      positionerGroup: positionerGroup,
      orbitGroup: orbitGroup,
      bodyGroup: bodyGroup,
      visualRadius: data.visualRadius,
      orbitRadius: data.orbitRadius,
      eccentricity: data.eccentricity || 0,
      orbitalPeriodDays: data.orbitalPeriodDays,
      speedFactor: data.speedFactor,
      currentAngle: Math.random() * Math.PI * 2
    };
    this.celestialObjects.set(data.id, celestialObj);
  }

  buildMoon(earthPositioner) {
    const moonData = CELESTIAL_DATA.moon;
    const moonGroup = new THREE.Group();
    earthPositioner.add(moonGroup);

    // Moon Orbit Line around Earth
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(
        Math.cos(angle) * moonData.orbitRadius,
        0,
        Math.sin(angle) * moonData.orbitRadius
      ));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x667788,
      transparent: true,
      opacity: 0.35
    });
    const moonOrbitLine = new THREE.Line(orbitGeo, orbitMat);
    moonGroup.add(moonOrbitLine);
    this.orbitLines.push(moonOrbitLine);

    // Moon Positioner
    const moonPosGroup = new THREE.Group();
    moonGroup.add(moonPosGroup);

    const moonGeo = new THREE.SphereGeometry(moonData.visualRadius, 36, 36);
    // Real NASA Moon Map and Bump
    const moonTex = this.loadTexture('textures/moonmap1k.jpg', () => TextureGenerator.generateMoonTexture());
    const moonBump = this.loadTexture('textures/moonbump1k.jpg');

    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      bumpMap: moonBump,
      bumpScale: 0.06,
      roughness: 0.95
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonPosGroup.add(moonMesh);
    moonMesh.userData = { id: 'moon' };
    this.interactiveMeshes.push(moonMesh);

    this.moonObject = {
      id: 'moon',
      data: moonData,
      mesh: moonMesh,
      posGroup: moonPosGroup,
      orbitRadius: moonData.orbitRadius,
      speedFactor: moonData.speedFactor,
      angle: 0
    };
    this.celestialObjects.set('moon', this.moonObject);
  }

  buildGalileanMoons(jupiterPositioner, moons) {
    moons.forEach(m => {
      const mGroup = new THREE.Group();
      jupiterPositioner.add(mGroup);

      // Moon Orbit trace
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * m.distance, 0, Math.sin(a) * m.distance));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x778899, transparent: true, opacity: 0.25 });
      const line = new THREE.Line(geo, mat);
      mGroup.add(line);
      this.orbitLines.push(line);

      const posGroup = new THREE.Group();
      mGroup.add(posGroup);

      const sGeo = new THREE.SphereGeometry(m.radius, 20, 20);
      const sMat = new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.85 });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      posGroup.add(sMesh);

      this.galileanMoons.push({
        name: m.name,
        posGroup: posGroup,
        distance: m.distance,
        periodDays: m.periodDays,
        angle: Math.random() * Math.PI * 2
      });
    });
  }

  /**
   * Generates elliptical orbital trail geometry
   */
  createOrbitLine(data) {
    const segments = 160;
    const points = [];
    const el = ORBITAL_ELEMENTS[data.id];
    const baseRadius = data.orbitRadius;
    const aAU = el ? el.a : 1;
    const e = el ? el.e : (data.eccentricity || 0);

    for (let i = 0; i <= segments; i++) {
      const M = (i / segments) * Math.PI * 2;
      let E = M;
      for (let iter = 0; iter < 4; iter++) {
        E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      }
      const xP = aAU * (Math.cos(E) - e);
      const yP = aAU * Math.sqrt(1 - e * e) * Math.sin(E);

      const degToRad = Math.PI / 180;
      const I = (el ? el.I : 0) * degToRad * 0.7;
      const Omega = (el ? el.Omega : 0) * degToRad;
      const omega = (el ? (el.wBar - el.Omega) : 0) * degToRad;

      const cosO = Math.cos(Omega), sinO = Math.sin(Omega);
      const cosW = Math.cos(omega), sinW = Math.sin(omega);
      const cosI = Math.cos(I), sinI = Math.sin(I);

      const Px = cosW * cosO - sinW * sinO * cosI;
      const Py = cosW * sinO + sinW * cosO * cosI;
      const Pz = sinW * sinI;

      const Qx = -sinW * cosO - cosW * sinO * cosI;
      const Qy = -sinW * sinO + cosW * cosO * cosI;
      const Qz = cosW * sinI;

      const x = xP * Px + yP * Qx;
      const y = xP * Py + yP * Qy;
      const z = xP * Pz + yP * Qz;

      const scaledR = baseRadius * (Math.sqrt(x * x + y * y + z * z) / aAU);
      const angle = Math.atan2(y, x);
      const inclY = z * (baseRadius / aAU) * 0.7;

      points.push(new THREE.Vector3(
        Math.cos(angle) * scaledR,
        inclY,
        Math.sin(angle) * scaledR
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });

    const line = new THREE.Line(geometry, material);
    return line;
  }

  /**
   * Maps UV coordinates of RingGeometry radially for textures
   */
  orientRingUVs(geometry) {
    const pos = geometry.attributes.position;
    const uvs = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      uvs.setXY(i, (dist - geometry.parameters.innerRadius) / (geometry.parameters.outerRadius - geometry.parameters.innerRadius), 0.5);
    }
    uvs.needsUpdate = true;
  }

  /**
   * Builds the 1,400+ Asteroid Belt using high-performance InstancedMesh
   */
  buildAsteroidBelt() {
    const config = ASTEROID_BELT_CONFIG;
    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x8a7f75,
      roughness: 0.95,
      metalness: 0.1
    });

    this.asteroidBelt = new THREE.InstancedMesh(rockGeo, rockMat, config.count);
    const dummy = new THREE.Object3D();

    this.asteroidData = [];

    for (let i = 0; i < config.count; i++) {
      const radius = config.innerRadius + Math.random() * (config.outerRadius - config.innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * config.heightVariance;
      const scale = config.minSize + Math.random() * (config.maxSize - config.minSize);

      dummy.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.scale.set(scale, scale * (0.7 + Math.random() * 0.6), scale);
      dummy.updateMatrix();

      this.asteroidBelt.setMatrixAt(i, dummy.matrix);

      this.asteroidData.push({
        radius: radius,
        angle: angle,
        height: height,
        speed: (0.0035 + Math.random() * 0.001) / Math.sqrt(radius / 100),
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02
      });
    }

    this.asteroidBelt.instanceMatrix.needsUpdate = true;
    this.scene.add(this.asteroidBelt);
  }

  /**
   * Kuiper Belt icy particles beyond Neptune
   */
  buildKuiperBelt() {
    const config = KUIPER_BELT_CONFIG;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(config.count * 3);
    const colors = new Float32Array(config.count * 3);

    for (let i = 0; i < config.count; i++) {
      const radius = config.innerRadius + Math.random() * (config.outerRadius - config.innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * config.heightVariance;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const isReddish = Math.random() > 0.6;
      colors[i * 3] = isReddish ? 0.85 : 0.75;
      colors[i * 3 + 1] = isReddish ? 0.7 : 0.85;
      colors[i * 3 + 2] = isReddish ? 0.65 : 0.95;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65
    });

    this.kuiperBelt = new THREE.Points(geom, mat);
    this.scene.add(this.kuiperBelt);
  }

  /**
   * Ecliptic Coordinate Grid
   */
  buildEclipticGrid() {
    const gridGroup = new THREE.Group();

    for (let r = 50; r <= 300; r += 50) {
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.08 });
      gridGroup.add(new THREE.Line(geo, mat));
    }

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(a) * 310, 0, Math.sin(a) * 310)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.06 });
      gridGroup.add(new THREE.Line(geo, mat));
    }

    gridGroup.visible = this.showGrid;
    this.eclipticGrid = gridGroup;
    this.scene.add(gridGroup);
  }

  /**
   * High-Resolution 3D Billboard Planet Label
   */
  create3DLabel(id, text, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(7, 14, 28, 0.72)';
    ctx.beginPath();
    ctx.roundRect(12, 16, 360, 64, 32);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(44, 48, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 30px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 68, 49);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.88,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(16, 4, 1);
    sprite.userData = { id: id, isLabel: true };

    this.labels.push(sprite);
    return sprite;
  }

  /**
   * Pointer raycasting for hovering and clicking celestial bodies
   */
  setupInteraction() {
    this.container.addEventListener('pointerdown', (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    this.container.addEventListener('pointerup', (e) => {
      const dx = Math.abs(e.clientX - (this.pointerDownPos?.x || 0));
      const dy = Math.abs(e.clientY - (this.pointerDownPos?.y || 0));
      if (dx < 6 && dy < 6) {
        this.handleClick(e);
      }
    });

    this.container.addEventListener('pointermove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.handleHover();
    });
  }

  handleHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      this.container.style.cursor = 'pointer';
      this.hoveredObject = hit.userData.id;
    } else {
      this.container.style.cursor = 'default';
      this.hoveredObject = null;
    }
  }

  handleClick(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes);

    if (intersects.length > 0) {
      const hitId = intersects[0].object.userData.id;
      if (this.onPlanetSelected) {
        this.onPlanetSelected(hitId);
      }
    }
  }

  /**
   * Main Physics & Kinematics Update Loop with Real-Time Planetary Ephemeris
   */
  update(deltaSeconds) {
    if (!this.isPaused) {
      // 1 real second = timeMultiplier simulation seconds
      const simDeltaMs = deltaSeconds * this.timeMultiplier * 1000;
      this.currentSimDate = new Date(this.currentSimDate.getTime() + simDeltaMs);

      // 1. Update Sun rotation and corona breathing
      const sun = this.celestialObjects.get('sun');
      if (sun) {
        // Sun rotation (25.38 days)
        sun.mesh.rotation.y += (simDeltaMs / (2192832 * 1000)) * Math.PI * 2;
        if (this.sunCorona) {
          const pulse = 1.0 + Math.sin(performance.now() * 0.002) * 0.03;
          this.sunCorona.scale.set(pulse, pulse, pulse);
        }
      }

      // 2. Update all Planets at their exact real-time astronomical positions
      this.celestialObjects.forEach((obj, id) => {
        if (id === 'sun' || id === 'moon') return;

        if (ORBITAL_ELEMENTS[id]) {
          const pos = calculateHeliocentricCoords(id, this.currentSimDate);
          const baseRadius = obj.orbitRadius;
          const aAU = ORBITAL_ELEMENTS[id].a;
          const scaledDist = baseRadius * (pos.r / aAU);
          const angle = Math.atan2(pos.y, pos.x);
          const inclY = pos.z * (baseRadius / aAU) * 0.7;

          obj.positionerGroup.position.set(
            Math.cos(angle) * scaledDist,
            inclY,
            Math.sin(angle) * scaledDist
          );

          // Axial rotation based on real planetary rotation period
          let rotSec = 86164; // Earth default sidereal day (23h 56m)
          if (id === 'mercury') rotSec = 5068800; // 58.65 days
          else if (id === 'venus') rotSec = -20996800; // -243 days (retrograde)
          else if (id === 'mars') rotSec = 88642; // 24.62 hours
          else if (id === 'jupiter') rotSec = 35730; // 9.93 hours
          else if (id === 'saturn') rotSec = 38340; // 10.65 hours
          else if (id === 'uranus') rotSec = -62064; // -17.24 hours (retrograde)
          else if (id === 'neptune') rotSec = 57996; // 16.11 hours
          else if (id === 'pluto') rotSec = -552096; // -6.39 days (retrograde)

          obj.mesh.rotation.y += (simDeltaMs / (rotSec * 1000)) * Math.PI * 2;

          // Earth Clouds rotation
          if (id === 'earth' && this.earthClouds) {
            this.earthClouds.rotation.y += (simDeltaMs / (82000 * 1000)) * Math.PI * 2;
          }
        }
      });

      // 3. Update Moon orbit around Earth (sidereal period: 27.32166 days)
      if (this.moonObject) {
        const moonCycleSec = 27.32166 * 86400;
        const moonEpochSec = this.currentSimDate.getTime() / 1000;
        const moonAngle = (moonEpochSec / moonCycleSec) * Math.PI * 2;
        const mDist = this.moonObject.orbitRadius;
        this.moonObject.posGroup.position.set(
          Math.cos(moonAngle) * mDist,
          Math.sin(moonAngle * 0.5) * 0.5,
          Math.sin(moonAngle) * mDist
        );
        this.moonObject.mesh.rotation.y = moonAngle;
      }

      // 4. Update Galilean Moons of Jupiter
      this.galileanMoons.forEach(m => {
        const moonCycleSec = m.periodDays * 86400;
        m.angle += (simDeltaMs / (moonCycleSec * 1000)) * Math.PI * 2;
        m.posGroup.position.set(
          Math.cos(m.angle) * m.distance,
          0,
          Math.sin(m.angle) * m.distance
        );
      });

      // 5. Update Asteroid Belt individual tumbling & revolution
      if (this.asteroidBelt && this.showAsteroids) {
        const dummy = new THREE.Object3D();
        for (let i = 0; i < this.asteroidData.length; i++) {
          const ast = this.asteroidData[i];
          ast.angle += ast.speed * (this.timeMultiplier * 0.00002 + deltaSeconds * 0.02);

          dummy.position.set(
            Math.cos(ast.angle) * ast.radius,
            ast.height,
            Math.sin(ast.angle) * ast.radius
          );
          dummy.rotation.x += ast.rotX;
          dummy.rotation.y += ast.rotY;
          dummy.scale.set(0.4, 0.4, 0.4);
          dummy.updateMatrix();
          this.asteroidBelt.setMatrixAt(i, dummy.matrix);
        }
        this.asteroidBelt.instanceMatrix.needsUpdate = true;
      }

      // Slow Kuiper Belt drift
      if (this.kuiperBelt) {
        this.kuiperBelt.rotation.y += 0.00002 * (this.timeMultiplier * 0.0005 + 1);
      }
    }

    // 6. Keep 3D Labels Facing Camera
    if (this.showLabels) {
      this.labels.forEach(label => {
        const dist = this.camera.position.distanceTo(label.getWorldPosition(new THREE.Vector3()));
        const scale = Math.max(8, Math.min(28, dist * 0.06));
        label.scale.set(scale, scale * 0.25, 1);
      });
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Helper: Get celestial object instance by ID
   */
  getCelestialObject(id) {
    return this.celestialObjects.get(id);
  }

  /**
   * UI Toggles
   */
  toggleOrbits(visible) {
    this.showOrbits = visible;
    this.orbitLines.forEach(l => l.visible = visible);
  }

  toggleLabels(visible) {
    this.showLabels = visible;
    this.labels.forEach(lbl => lbl.visible = visible);
  }

  toggleAsteroids(visible) {
    this.showAsteroids = visible;
    if (this.asteroidBelt) this.asteroidBelt.visible = visible;
    if (this.kuiperBelt) this.kuiperBelt.visible = visible;
  }

  toggleGrid(visible) {
    this.showGrid = visible;
    if (this.eclipticGrid) this.eclipticGrid.visible = visible;
  }

  /**
   * Sync simulation time directly back to live real-time
   */
  syncToRealTime() {
    this.currentSimDate = new Date();
    this.timeMultiplier = 1.0;
    this.isPaused = false;
  }

  /**
   * Calculate current simulated date
   */
  getSimulatedDate() {
    return this.currentSimDate;
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
