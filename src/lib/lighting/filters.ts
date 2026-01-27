import type { LightSettings } from '@/types';

/**
 * Generate SVG filter definitions for lighting effects
 */
export function generateLightingDefs(lighting: LightSettings): string {
  if (!lighting.enabled) {
    return '';
  }

  const defs: string[] = [];

  // Glow filter for color glow effect
  if (lighting.glow.enabled && lighting.glow.intensity > 0) {
    const blurRadius = lighting.glow.radius * lighting.glow.intensity;
    defs.push(`
    <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blurRadius}" result="blur"/>
      <feColorMatrix in="blur" type="saturate" values="1.2" result="saturatedBlur"/>
    </filter>`);
  }

  // Ray blur filter for soft god rays
  if (lighting.rays.enabled && lighting.rays.intensity > 0) {
    const rayBlur = 3 + lighting.rays.spread * 0.1;
    defs.push(`
    <filter id="rayFilter" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${rayBlur}" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${lighting.rays.intensity * 1.5} 0" result="brightBlur"/>
    </filter>`);
  }

  if (defs.length === 0) {
    return '';
  }

  return `<defs>${defs.join('')}\n  </defs>`;
}

/**
 * Get the blend mode for glow layer based on dark mode
 */
export function getGlowBlendMode(darkMode: boolean): string {
  return darkMode ? 'screen' : 'multiply';
}

/**
 * Get the glow intensity multiplier based on dark mode
 */
export function getGlowIntensityMultiplier(darkMode: boolean): number {
  return darkMode ? 1.5 : 1.0;
}
