/**
 * Astronomy Data & Scientific Parameters for the Solar System
 * Accurately calibrated orbital periods, physical properties, and telemetry metrics.
 */

export const CELESTIAL_DATA = {
  sun: {
    id: 'sun',
    name: 'The Sun',
    type: 'Yellow Dwarf Star (G2V)',
    radius: 1392700, // km
    visualRadius: 18, // visual units in scene
    color: '#ffaa00',
    emissive: '#ff7700',
    mass: '1.989 × 10³⁰ kg (333,000 Earths)',
    surfaceTemp: '5,500 °C (Core: 15,000,000 °C)',
    rotationPeriod: '25.38 Earth days',
    axialTilt: 7.25,
    distanceKm: 0,
    distanceAU: 0,
    orbitalSpeed: '220 km/s (Galactic Orbit)',
    orbitalPeriodDays: 0,
    atmosphere: '73.4% Hydrogen, 25.0% Helium, 0.9% Oxygen',
    gravity: '274.0 m/s² (28x Earth)',
    moons: 0,
    description: 'The luminous heart of our solar system, containing 99.86% of the total system mass. Powered by nuclear fusion in its core, converting 600 million tons of hydrogen into helium every second.',
    funFact: 'About 1.3 million Earths could fit inside the Sun!'
  },
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial Planet',
    radius: 2439.7, // km
    visualRadius: 2.2,
    orbitRadius: 36, // scene distance units
    eccentricity: 0.2056,
    inclination: 7.0, // degrees
    orbitalPeriodDays: 87.97, // Earth days
    speedFactor: 365.25 / 87.97, // ~4.15x Earth speed
    rotationPeriod: '58.65 Earth days',
    axialTilt: 0.034,
    color: '#a39f99',
    mass: '3.301 × 10²³ kg (0.055 Earths)',
    surfaceTemp: '-180 °C to 430 °C',
    distanceKm: '57.9 million km',
    distanceAU: '0.387 AU',
    orbitalSpeed: '47.36 km/s',
    gravity: '3.7 m/s² (0.38x Earth)',
    atmosphere: 'Trace exosphere: Oxygen, Sodium, Hydrogen, Helium',
    moons: 0,
    description: 'The smallest planet and closest to the Sun. With virtually no atmosphere to trap heat, it experiences the most extreme temperature swings in the solar system.',
    funFact: 'A year on Mercury is just 88 days, but a single solar day lasts 176 Earth days!'
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial Planet',
    radius: 6051.8,
    visualRadius: 3.5,
    orbitRadius: 52,
    eccentricity: 0.0067,
    inclination: 3.39,
    orbitalPeriodDays: 224.7,
    speedFactor: 365.25 / 224.7, // ~1.625x
    rotationPeriod: '243.02 Earth days (Retrograde)',
    axialTilt: 177.36, // Retrograde spin
    color: '#e3bb76',
    mass: '4.867 × 10²⁴ kg (0.815 Earths)',
    surfaceTemp: '465 °C (Hottest in Solar System)',
    distanceKm: '108.2 million km',
    distanceAU: '0.723 AU',
    orbitalSpeed: '35.02 km/s',
    gravity: '8.87 m/s² (0.90x Earth)',
    atmosphere: '96.5% Carbon Dioxide, 3.5% Nitrogen (Clouds of Sulfuric Acid)',
    moons: 0,
    description: 'Often called Earth\'s twin due to similar size and mass, Venus is wrapped in a runaway greenhouse atmosphere with crushing surface pressure 92 times that of Earth.',
    funFact: 'Venus rotates backwards compared to most planets, so the Sun rises in the west and sets in the east!'
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial Planet (Habitable World)',
    radius: 6371.0,
    visualRadius: 3.8,
    orbitRadius: 72,
    eccentricity: 0.0167,
    inclination: 0.0, // reference plane
    orbitalPeriodDays: 365.25,
    speedFactor: 1.0,
    rotationPeriod: '23.93 hours (1.00 day)',
    axialTilt: 23.44,
    color: '#2b82c9',
    mass: '5.972 × 10²⁴ kg (1.00 Earth)',
    surfaceTemp: '-88 °C to 58 °C (Avg: 15 °C)',
    distanceKm: '149.6 million km',
    distanceAU: '1.000 AU',
    orbitalSpeed: '29.78 km/s',
    gravity: '9.807 m/s² (1.00 g)',
    atmosphere: '78.1% Nitrogen, 20.9% Oxygen, 0.9% Argon, 0.04% CO₂',
    moons: 1,
    description: 'Our vibrant home oasis, the only known celestial harbor of life in the cosmos. Liquid water oceans cover 71% of its surface, shielded by an active magnetosphere.',
    funFact: 'Earth is not a perfect sphere; its rotation causes a slight equatorial bulge!'
  },
  moon: {
    id: 'moon',
    name: 'The Moon (Luna)',
    type: 'Natural Satellite',
    radius: 1737.4,
    visualRadius: 1.1,
    orbitRadius: 7.5, // around Earth
    orbitalPeriodDays: 27.32,
    speedFactor: 365.25 / 27.32, // ~13.37x around Earth
    rotationPeriod: '27.32 days (Tidally Locked)',
    axialTilt: 1.54,
    color: '#c4c4c4',
    mass: '7.342 × 10²² kg (0.012 Earths)',
    surfaceTemp: '-130 °C to 120 °C',
    distanceKm: '384,400 km from Earth',
    gravity: '1.62 m/s² (0.166x Earth)',
    atmosphere: 'Negligible surface-boundary exosphere',
    description: 'Earth\'s sole natural satellite, formed 4.5 billion years ago likely from a colossal impact between proto-Earth and a Mars-sized body named Theia.',
    funFact: 'The Moon is slowly drifting away from Earth at roughly 3.8 cm per year!'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial Planet (The Red Planet)',
    radius: 3389.5,
    visualRadius: 2.8,
    orbitRadius: 94,
    eccentricity: 0.0934,
    inclination: 1.85,
    orbitalPeriodDays: 686.98,
    speedFactor: 365.25 / 686.98, // ~0.531x
    rotationPeriod: '24.62 hours (1.029 Earth days)',
    axialTilt: 25.19,
    color: '#d14f2e',
    mass: '6.417 × 10²³ kg (0.107 Earths)',
    surfaceTemp: '-140 °C to 20 °C (Avg: -63 °C)',
    distanceKm: '227.9 million km',
    distanceAU: '1.524 AU',
    orbitalSpeed: '24.07 km/s',
    gravity: '3.72 m/s² (0.38x Earth)',
    atmosphere: '95.3% Carbon Dioxide, 2.6% Nitrogen, 1.9% Argon',
    moons: 2,
    description: 'The rust-hued desert world, home to Olympus Mons (the largest volcano in the solar system, 21 km high) and the giant rift valley Valles Marineris.',
    funFact: 'Mars has giant dust storms that can envelop the entire planet for months!'
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant (King of Planets)',
    radius: 69911,
    visualRadius: 8.5,
    orbitRadius: 135,
    eccentricity: 0.0484,
    inclination: 1.30,
    orbitalPeriodDays: 4332.59, // 11.86 Earth years
    speedFactor: 365.25 / 4332.59, // ~0.0843x
    rotationPeriod: '9.93 hours (Fastest rotation)',
    axialTilt: 3.13,
    color: '#c88b3a',
    mass: '1.898 × 10²⁷ kg (317.8 Earths)',
    surfaceTemp: '-110 °C (Cloud tops)',
    distanceKm: '778.6 million km',
    distanceAU: '5.204 AU',
    orbitalSpeed: '13.07 km/s',
    gravity: '24.79 m/s² (2.53x Earth)',
    atmosphere: '89.8% Hydrogen, 10.2% Helium, traces of Methane & Ammonia',
    moons: 95,
    galileanMoons: [
      { name: 'Io', distance: 13, radius: 0.7, color: '#f7d340', periodDays: 1.77 },
      { name: 'Europa', distance: 16, radius: 0.6, color: '#d8e5ed', periodDays: 3.55 },
      { name: 'Ganymede', distance: 20, radius: 0.9, color: '#9f9b96', periodDays: 7.15 },
      { name: 'Callisto', distance: 25, radius: 0.85, color: '#7a7671', periodDays: 16.69 }
    ],
    description: 'The colossal gas titan possessing more mass than all other planets combined. Its iconic Great Red Spot is an anticyclonic storm larger than Earth raging for centuries.',
    funFact: 'Jupiter acts as a gravitational shield for Earth, deflecting or capturing many incoming comets and asteroids!'
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas Giant (Jeweled Ringed Titan)',
    radius: 58232,
    visualRadius: 7.2,
    orbitRadius: 178,
    eccentricity: 0.0541,
    inclination: 2.49,
    orbitalPeriodDays: 10759.22, // 29.46 Earth years
    speedFactor: 365.25 / 10759.22, // ~0.0339x
    rotationPeriod: '10.7 hours',
    axialTilt: 26.73,
    color: '#e4c988',
    mass: '5.683 × 10²⁶ kg (95.2 Earths)',
    surfaceTemp: '-140 °C (Cloud tops)',
    distanceKm: '1.434 billion km',
    distanceAU: '9.582 AU',
    orbitalSpeed: '9.68 km/s',
    gravity: '10.44 m/s² (1.06x Earth)',
    atmosphere: '96.3% Hydrogen, 3.25% Helium, traces of Methane',
    moons: 146,
    hasRings: true,
    ringInnerRadius: 9.0,
    ringOuterRadius: 16.5,
    description: 'Adorned by the most spectacular ring system in the solar system, composed of billions of chunks of pure water ice ranging from dust specks to house-sized boulders.',
    funFact: 'Saturn is the only planet less dense than water; if you found a bathtub large enough, Saturn would float!'
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    radius: 25362,
    visualRadius: 5.2,
    orbitRadius: 218,
    eccentricity: 0.0472,
    inclination: 0.77,
    orbitalPeriodDays: 30685.4, // 84.01 Earth years
    speedFactor: 365.25 / 30685.4, // ~0.0119x
    rotationPeriod: '17.24 hours (Retrograde)',
    axialTilt: 97.77, // Rotates on its side!
    color: '#71c5cf',
    mass: '8.681 × 10²⁵ kg (14.5 Earths)',
    surfaceTemp: '-195 °C (Coldest atmosphere: -224 °C)',
    distanceKm: '2.871 billion km',
    distanceAU: '19.20 AU',
    orbitalSpeed: '6.80 km/s',
    gravity: '8.69 m/s² (0.89x Earth)',
    atmosphere: '82.5% Hydrogen, 15.2% Helium, 2.3% Methane (gives cyan tint)',
    moons: 28,
    hasRings: true,
    ringInnerRadius: 6.2,
    ringOuterRadius: 8.8,
    description: 'The sideways ice giant. A colossal ancient collision likely knocked Uranus onto its side, causing extreme 42-year seasons of continuous sunlight and darkness at each pole.',
    funFact: 'Uranus rolls around the Sun on its equator like a spinning bowling ball!'
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant (The Windy Blue World)',
    radius: 24622,
    visualRadius: 5.0,
    orbitRadius: 258,
    eccentricity: 0.0086,
    inclination: 1.77,
    orbitalPeriodDays: 60189.0, // 164.8 Earth years
    speedFactor: 365.25 / 60189.0, // ~0.00607x
    rotationPeriod: '16.11 hours',
    axialTilt: 28.32,
    color: '#3466d6',
    mass: '1.024 × 10²⁶ kg (17.1 Earths)',
    surfaceTemp: '-201 °C',
    distanceKm: '4.495 billion km',
    distanceAU: '30.05 AU',
    orbitalSpeed: '5.43 km/s',
    gravity: '11.15 m/s² (1.14x Earth)',
    atmosphere: '80.0% Hydrogen, 19.0% Helium, 1.5% Methane',
    moons: 16,
    description: 'The most distant major planet in our solar system. Despite its frigid distance from the Sun, it features supersonic storm winds exceeding 2,100 km/h—the fastest in the solar system.',
    funFact: 'Neptune completed its first full orbit since its discovery in 1846 in the year 2011!'
  },
  pluto: {
    id: 'pluto',
    name: 'Pluto',
    type: 'Dwarf Planet (Kuiper Belt King)',
    radius: 1188.3,
    visualRadius: 1.8,
    orbitRadius: 295,
    eccentricity: 0.2488,
    inclination: 17.16, // Pronounced tilt!
    orbitalPeriodDays: 90560.0, // 247.9 Earth years
    speedFactor: 365.25 / 90560.0, // ~0.00403x
    rotationPeriod: '6.39 Earth days (Retrograde)',
    axialTilt: 122.53,
    color: '#c29f82',
    mass: '1.303 × 10²² kg (0.0022 Earths)',
    surfaceTemp: '-230 °C',
    distanceKm: '5.906 billion km (Avg)',
    distanceAU: '39.48 AU',
    orbitalSpeed: '4.74 km/s',
    gravity: '0.62 m/s² (0.063x Earth)',
    atmosphere: 'Tenous: Nitrogen, Methane, Carbon Monoxide (sublimates near perihelion)',
    moons: 5,
    description: 'Beloved icy dwarf world in the Kuiper Belt with a vast heart-shaped glacier named Tombaugh Regio. Its highly inclined and eccentric orbit periodically brings it closer to the Sun than Neptune.',
    funFact: 'Pluto and its largest moon Charon are mutually tidally locked, always facing the same side to each other!'
  }
};

export const ASTEROID_BELT_CONFIG = {
  innerRadius: 105,
  outerRadius: 122,
  count: 1400,
  minSize: 0.15,
  maxSize: 0.65,
  heightVariance: 4.5
};

export const KUIPER_BELT_CONFIG = {
  innerRadius: 275,
  outerRadius: 330,
  count: 1800,
  minSize: 0.12,
  maxSize: 0.55,
  heightVariance: 12.0
};

/**
 * NASA JPL Keplerian Orbital Elements for real-time planetary positioning
 * Referenced to the J2000.0 epoch (2000-01-01 12:00 UTC)
 */
export const ORBITAL_ELEMENTS = {
  mercury: { a: 0.38709927, e: 0.20563593, I: 7.004979, L: 252.250323, L_dot: 149472.674111, wBar: 77.457796, Omega: 48.330765 },
  venus:   { a: 0.72333566, e: 0.00677672, I: 3.394676, L: 181.979099, L_dot: 58517.815387, wBar: 131.602467, Omega: 76.679842 },
  earth:   { a: 1.00000261, e: 0.01671123, I: 0.000015, L: 100.464571, L_dot: 35999.372449, wBar: 102.937681, Omega: 0.0 },
  mars:    { a: 1.52371034, e: 0.09339410, I: 1.849691, L: -4.553432,  L_dot: 19140.302684, wBar: -23.943629, Omega: 49.559538 },
  jupiter: { a: 5.20288700, e: 0.04838624, I: 1.304396, L: 34.396440,  L_dot: 3034.746128,  wBar: 14.728479, Omega: 100.473909 },
  saturn:  { a: 9.53667594, e: 0.05386179, I: 2.485991, L: 49.954244,  L_dot: 1222.493622,  wBar: 92.598878, Omega: 113.662424 },
  uranus:  { a: 19.18916464, e: 0.04725744, I: 0.772637, L: 313.238104, L_dot: 428.482027,  wBar: 170.954276, Omega: 74.016925 },
  neptune: { a: 30.06992276, e: 0.00860610, I: 1.770043, L: -55.120029, L_dot: 218.459453,  wBar: 44.964762, Omega: 131.784225 },
  pluto:   { a: 39.48211675, e: 0.24882730, I: 17.140012, L: 238.929038, L_dot: 145.207805, wBar: 224.068799, Omega: 110.303936 }
};

/**
 * Calculates exact real-time heliocentric coordinates (in AU and relative radians)
 * using NASA JPL Keplerian orbital mechanics.
 */
export function calculateHeliocentricCoords(planetKey, date) {
  const el = ORBITAL_ELEMENTS[planetKey];
  if (!el) return { x: 0, y: 0, z: 0, r: 0, trueAnomaly: 0, longitudeDeg: 0 };

  const jd = (date.getTime() / 86400000) + 2440587.5;
  const t = (jd - 2451545.0) / 36525; // Centuries since J2000.0

  const degToRad = Math.PI / 180;
  const a = el.a;
  const e = el.e;
  const I = el.I * degToRad;
  const L = (el.L + el.L_dot * t) % 360;
  const wBar = el.wBar % 360;
  const Omega = el.Omega * degToRad;
  const omega = (wBar - el.Omega) * degToRad;

  let M = (L - wBar) % 360;
  if (M < 0) M += 360;
  M = M * degToRad;

  // Solve Kepler's equation for Eccentric Anomaly E
  let E = M;
  for (let i = 0; i < 6; i++) {
    E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }

  // Coordinates in orbital plane
  const xP = a * (Math.cos(E) - e);
  const yP = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const r = Math.sqrt(xP * xP + yP * yP);
  const trueAnomaly = Math.atan2(yP, xP);

  // Rotation to 3D heliocentric ecliptic frame
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

  const longitudeDeg = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;

  return { x, y, z, r, trueAnomaly, longitudeDeg };
}

