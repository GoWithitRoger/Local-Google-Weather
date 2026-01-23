// ============================================================================
// ICE ACCRETION CALCULATIONS
// Thermodynamic models for estimating ice accumulation on power lines
// ============================================================================

/**
 * Estimates the "Freezing Fraction" efficiency based on thermodynamic conditions.
 * Modeled after simplified CRREL/Makkonen logic for power line accretion.
 * 
 * The freezing fraction represents the proportion of impinging water that
 * freezes on contact vs. dripping off or being shed by wind.
 * 
 * @param qpf Liquid precipitation amount (inches)
 * @param wetBulb Wet bulb temperature (°F)
 * @param windSpeed Wind speed (mph)
 * @returns Estimated ice accretion in inches
 */
export function calculateProvisionalAccretion(qpf: number, wetBulb: number, windSpeed: number): number {
    // If it's too warm, nothing freezes
    if (wetBulb > 32 || qpf <= 0) return 0;

    // Base freezing efficiency (fraction of water that freezes vs drips off)
    // At 32F, efficiency is low (~40-60%). As it gets colder, it approaches 100%.
    let efficiency = 0.5;

    // Temperature Factor: Colder = higher efficiency
    // Add ~5% efficiency for every degree below 32
    efficiency += (32 - wetBulb) * 0.05;

    // Wind Factor: Wind increases convective cooling, allowing more latent heat release
    // Add ~2% efficiency per mph of wind (up to a limit)
    efficiency += windSpeed * 0.02;

    // Cap efficiency between 0 and 1.0 (cannot freeze more water than falls)
    efficiency = Math.min(Math.max(efficiency, 0), 1.0);

    // Apply efficiency to liquid equivalent
    return qpf * efficiency;
}
