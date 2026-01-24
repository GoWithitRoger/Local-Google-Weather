// ============================================================================
// SNOW MELT MODEL - ADVANCED ENERGY BALANCE
// Estimates the reduction in snow depth based on environmental thermodynamics.
// ============================================================================

/**
 * Calculates the rate at which snow depth decreases (inches per hour).
 * 
 * Key differences from ice burnoff:
 * - Higher albedo (snow reflects more sunlight)
 * - Rain-on-Snow advection (rain accelerates melting dramatically)
 * - Wet snow density for depth calculations
 * 
 * @param airTempF Air Temperature (°F)
 * @param dewPointF Dew Point (°F)
 * @param windSpeedMph Wind Speed (mph)
 * @param rainAmount Liquid rain falling this hour (inches) - for rain-on-snow
 * @param cloudCoverPercent Cloud Cover (0-100)
 * @param uvIndex UV Index
 * @param isDaytime Boolean for day/night
 * @returns Snow depth reduction rate (inches per hour)
 */
export function calculateSnowMeltRate(
    airTempF: number,
    dewPointF: number,
    windSpeedMph: number,
    rainAmount: number,
    cloudCoverPercent: number,
    uvIndex: number,
    isDaytime: boolean
): number {
    // 1. Constants
    const STEFAN_BOLTZMANN = 5.67e-8;
    const L_FUSION = 334000;          // J/kg (Latent Heat of Fusion)
    const C_WATER = 4186;             // J/kg/K (Specific heat of rain)
    const RHO_WATER = 1000;           // kg/m³

    // Density of Melting Snow (The "Slush" Factor)
    // Fresh snow is ~100 kg/m³. Melting snow compacts to ~350-400 kg/m³.
    const RHO_WET_SNOW = 350;

    // Albedo: Snow is much brighter than ice.
    // Fresh snow = 0.85. Old melting snow = 0.60.
    // We use 0.65 as a conservative "Road Snow" average.
    const ALBEDO_SNOW = 0.65;

    // 2. Unit Conversions
    const Ta_K = (airTempF - 32) * 5 / 9 + 273.15;
    const Ts_K = 273.15; // Surface pinned at 0°C
    const Td_C = (dewPointF - 32) * 5 / 9;
    const Wind_m_s = windSpeedMph * 0.44704;

    // ------------------------------------------------------------------------
    // A. SURFACE ENERGY BALANCE (Solar + IR + Convection)
    // ------------------------------------------------------------------------
    let solarIrradiance = 0;
    if (isDaytime) {
        if (uvIndex >= 0) {
            solarIrradiance = uvIndex * 100;
        } else {
            solarIrradiance = 800 * (1 - (cloudCoverPercent / 100) * 0.75);
        }
    }
    const Q_sw = solarIrradiance * (1 - ALBEDO_SNOW); // Much less absorption than ice

    // Longwave (IR)
    const vaporPressureMb = 6.11 * Math.pow(10, (7.5 * Td_C) / (237.3 + Td_C));
    const epsilon_clear = 9.2e-6 * Math.pow(Ta_K, 2);
    const cloudFactor = 1 + (0.2 * Math.pow(cloudCoverPercent / 100, 2));
    const epsilon_sky = Math.min(1.0, epsilon_clear * cloudFactor);
    const Q_lw = (epsilon_sky * STEFAN_BOLTZMANN * Math.pow(Ta_K, 4)) -
        (0.99 * STEFAN_BOLTZMANN * Math.pow(Ts_K, 4));

    // Convection (Sensible + Latent)
    const h_c = 5.8 + (3.7 * Wind_m_s);
    const Q_sensible = h_c * (Ta_K - Ts_K);
    const es_0 = 6.11;
    const Q_latent = (h_c / 0.66) * (vaporPressureMb - es_0) * 0.622 * 2257000 / (1004 * 101.325);

    // Ground heat flux - snow insulates, so less contribution
    const Q_ground = 2.0;

    const Q_Environment = Q_sw + Q_lw + Q_sensible + Q_latent + Q_ground;

    // ------------------------------------------------------------------------
    // B. RAIN-ON-SNOW ADVECTION (The "Slush Maker")
    // ------------------------------------------------------------------------
    // If liquid rain (Temp > 32°F) falls on snow (at 32°F), 
    // the rain transfers its heat as it cools to 32°F.
    let Q_Rain = 0;
    if (rainAmount > 0 && airTempF > 32) {
        // Mass of rain (kg/m²)
        const rainDepthM = rainAmount * 0.0254;
        const rainMassKg = rainDepthM * RHO_WATER;

        // Energy = Mass * SpecificHeat * DeltaT
        // Convert to Watts (Joules per second) by dividing by 3600s
        const totalRainEnergyJoules = rainMassKg * C_WATER * (Ta_K - Ts_K);
        Q_Rain = totalRainEnergyJoules / 3600; // Average Flux (W/m²)
    }

    // ------------------------------------------------------------------------
    // TOTAL MELT CALCULATION
    // ------------------------------------------------------------------------
    const Q_Total = Q_Environment + Q_Rain;

    if (Q_Total <= 0) return 0; // Snow is cooling/refreezing

    // Mass Rate (kg/s/m²)
    const massMeltRate = Q_Total / L_FUSION;

    // Depth Rate (m/s) = MassRate / Density_of_Wet_Snow
    const depthRate_m_s = massMeltRate / RHO_WET_SNOW;

    // Convert to inches/hour
    return depthRate_m_s * 39.3701 * 3600;
}

/**
 * Determines snow status from depth.
 * @param depth Snow depth in inches
 * @returns Status string for display
 */
export function getSnowStatus(depth: number): string {
    if (depth < 0.1) return 'Clear';
    return `Snow Cover (${depth.toFixed(1)}")`;
}

/**
 * Calculates snow compaction rate (settling without melting).
 * Snow shrinks by ~1-2% per hour just from gravity.
 * @param currentDepth Current snow depth in inches
 * @returns Compaction amount in inches
 */
export function calculateSnowCompaction(currentDepth: number): number {
    if (currentDepth <= 0) return 0;
    // 3% per hour: fluffy snow settles rapidly
    // Results in ~50% density increase over 24 hours (10" fresh -> ~5" packed)
    return 0.03 * currentDepth;
}
