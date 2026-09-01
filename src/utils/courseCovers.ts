// Standard Vite & ESM compliant static asset resolution
const coverEng041 = new URL('../assets/images/eng_041_physics_1787578206860.jpg', import.meta.url).href;
const coverEng021 = new URL('../assets/images/eng_021_mechanics_1787578218848.jpg', import.meta.url).href;
const coverEng011 = new URL('../assets/images/eng_011_math1_1787578232449.jpg', import.meta.url).href;
const coverHum011 = new URL('../assets/images/hum_011_english_1787578245974.jpg', import.meta.url).href;
const coverEng051 = new URL('../assets/images/eng_051_chemistry_1787578260346.jpg', import.meta.url).href;
const coverEng031 = new URL('../assets/images/eng_031_drawing_1787578273231.jpg', import.meta.url).href;
const coverAie101 = new URL('../assets/images/aie_101_circuits_1787578285551.jpg', import.meta.url).href;
const coverEngX13 = new URL('../assets/images/eng_x13_math3_1787578299239.jpg', import.meta.url).href;
const coverHum131 = new URL('../assets/images/hum_131_it_1787578314903.jpg', import.meta.url).href;
const coverHumX32 = new URL('../assets/images/hum_x32_comm_1787578328462.jpg', import.meta.url).href;
const coverAie103 = new URL('../assets/images/aie_103_logic_1787578341110.jpg', import.meta.url).href;
const coverAie111 = new URL('../assets/images/aie_111_structprog_1787578354689.jpg', import.meta.url).href;
const coverPde111 = new URL('../assets/images/pde_111_strength_1787578373105.jpg', import.meta.url).href;
const coverMpe121 = new URL('../assets/images/mpe_121_thermal_1787578385853.jpg', import.meta.url).href;
const coverHumXe1 = new URL('../assets/images/hum_xe1_elective_1787578398468.jpg', import.meta.url).href;
const coverEpe111 = new URL('../assets/images/epe_111_electriceng_1787578411825.jpg', import.meta.url).href;
const coverEle201 = new URL('../assets/images/ele_201_phasors_1787578429544.jpg', import.meta.url).href;
const coverEle303 = new URL('../assets/images/ele_303_dsp_1787578440707.jpg', import.meta.url).href;

// Vite-bundled static image asset map for instant and bulletproof rendering
const COURSE_IMAGES_MAP: Record<string, string> = {
  'ENG041': coverEng041,
  'ENG021': coverEng021,
  'ENG011': coverEng011,
  'HUM011': coverHum011,
  'ENG051': coverEng051,
  'ENG031': coverEng031,
  'AIE101': coverAie101,
  'ENGX13': coverEngX13,
  'HUM131': coverHum131,
  'HUMX32': coverHumX32,
  'AIE103': coverAie103,
  'AIE111': coverAie111,
  'PDE111': coverPde111,
  'MPE121': coverMpe121,
  'HUMXE1': coverHumXe1,
  'EPE111': coverEpe111,
  'ELE201': coverEle201,
  'ELE303': coverEle303,
};

// Clean normalization for course codes (e.g. "ENG 041" -> "ENG041", "eng-041" -> "ENG041")
export function normalizeCourseCode(code: string): string {
  return (code || '').replace(/[\s\-_]/g, '').toUpperCase();
}

/**
 * Returns the bundled cover image URL for a given course code.
 */
export function getCourseCoverUrl(code: string): string {
  const normalized = normalizeCourseCode(code);

  if (COURSE_IMAGES_MAP[normalized]) {
    return COURSE_IMAGES_MAP[normalized];
  }

  // Substring search for flexible matches
  for (const [key, assetUrl] of Object.entries(COURSE_IMAGES_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return assetUrl;
    }
  }

  // Fallback to default bundled cover
  return coverEng011;
}

/**
 * Alias for backward compatibility
 */
export function getCourseCoverSvg(code: string): string {
  return getCourseCoverUrl(code);
}

/**
 * Generates an instant, standalone dark-mode engineering SVG graphic as bulletproof fallback
 */
export function getCourseFallbackSvg(code: string): string {
  const norm = normalizeCourseCode(code);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="%230d1b2a"/>
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="%231e293b" stroke-width="1" opacity="0.6"/>
      </pattern>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23f59e0b" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="%23d97706" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(%23grid)"/>
    <circle cx="400" cy="225" r="140" fill="none" stroke="url(%23glow)" stroke-width="2" stroke-dasharray="6,6"/>
    <circle cx="400" cy="225" r="90" fill="none" stroke="%2338bdf8" stroke-width="1.5" opacity="0.5"/>
    <path d="M 220 225 L 580 225 M 400 110 L 400 340" stroke="%2364748b" stroke-width="1.5" stroke-dasharray="4"/>
    <circle cx="400" cy="225" r="8" fill="%23fbbf24"/>
    <circle cx="400" cy="135" r="5" fill="%2338bdf8"/>
    <circle cx="490" cy="225" r="5" fill="%23f59e0b"/>
    <text x="50" y="390" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="%23cbd5e1" letter-spacing="3">${norm || 'ENGINEERING'}</text>
  </svg>`;
}
