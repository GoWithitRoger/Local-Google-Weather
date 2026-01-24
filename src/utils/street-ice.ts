// ============================================================================
// STREET ICE BURNOFF MODEL - SURFACE ENERGY BALANCE
// Estimates the rate at which road ice melts based on thermodynamics.
// ============================================================================

/**
 * Calculates the rate at which road ice melts (inches per hour).
 * 
 * Uses Surface Energy Balance (SEB):
 * - Solar shortwave radiation (absorbed)
 * - Longwave IR radiation (sky vs surface exchange)
 * - Convective heat transfer (sensible + latent)
 * - Ground heat flux (minor contribution)
 * 
 * @param airTempF Air Temperature (°F)
 * @param dewPointF Dew Point (°F) - for humidity/evaporation calcs
 * @param windSpeedMph Wind Speed (mph)
 * @param cloudCoverPercent Cloud Cover (0-100)
 * @param uvIndex UV Index (proxy for solar intensity)
 * @param isDaytime Boolean for day/night
 * @returns Ice melt rate (inches per hour). Returns 0 if conditions favor freezing.
 */
export function calculateStreetIceBurnoff(
    airTempF: number,
    dewPointF: number,
    windSpeedMph: number,
    cloudCoverPercent: number,
    uvIndex: number,
    isDaytime: boolean
): number {
    // 1. Physical Constants
    const STEFAN_BOLTZMANN = 5.67e-8;  // W/m²K⁴
    const L_FUSION = 334000;            // J/kg (latent heat of fusion for ice)
    const L_EVAP = 2257000;             // J/kg (latent heat of evaporation)
    const RHO_ICE = 917;                // kg/m³ (density of ice)

    // Albedo for dirty road ice (darker than pure ice)
    const ALBEDO_ROAD_ICE = 0.50;

    // 2. Unit Conversions
    const Ta_K = (airTempF - 32) * 5 / 9 + 273.15;  // Air temp (Kelvin)
    const Ts_K = 273.15;                           // Surface pinned at 0°C (melting ice)
    const Td_C = (dewPointF - 32) * 5 / 9;          // Dew point (Celsius)
    const Wind_m_s = windSpeedMph * 0.44704;      // Wind (m/s)

    // ------------------------------------------------------------------------
    // A. SHORTWAVE RADIATION (Solar)
    // ------------------------------------------------------------------------
    let solarIrradiance = 0;
    if (isDaytime) {
        // Use UV index as proxy for solar intensity if available
        if (uvIndex >= 0) {
            // Approximate: UV index of 10 ≈ 1000 W/m² clear sky
            solarIrradiance = uvIndex * 100;
        } else {
            // Fallback: estimate from cloud cover
            const clearSkyMax = 800; // W/m² typical mid-latitude
            solarIrradiance = clearSkyMax * (1 - (cloudCoverPercent / 100) * 0.75);
        }
    }
    // Net absorbed = incident * (1 - albedo)
    const Q_sw = solarIrradiance * (1 - ALBEDO_ROAD_ICE);

    // ------------------------------------------------------------------------
    // B. LONGWAVE RADIATION (IR exchange between sky and surface)
    // ------------------------------------------------------------------------
    // Sky emissivity depends on humidity and clouds
    const vaporPressureMb = 6.11 * Math.pow(10, (7.5 * Td_C) / (237.3 + Td_C));
    const epsilon_clear = 9.2e-6 * Math.pow(Ta_K, 2);
    const cloudFactor = 1 + (0.2 * Math.pow(cloudCoverPercent / 100, 2));
    const epsilon_sky = Math.min(1.0, epsilon_clear * cloudFactor);

    // Net longwave = incoming from sky - outgoing from surface
    const Q_lw = (epsilon_sky * STEFAN_BOLTZMANN * Math.pow(Ta_K, 4)) -
        (0.99 * STEFAN_BOLTZMANN * Math.pow(Ts_K, 4)); // Ice emissivity ≈ 0.99

    // ------------------------------------------------------------------------
    // C. CONVECTIVE HEAT TRANSFER (Sensible + Latent)
    // ------------------------------------------------------------------------
    // Heat transfer coefficient (W/m²K) - empirical for rough surfaces
    const h_c = 5.8 + (4.2 * Wind_m_s);

    // Sensible heat: proportional to temp difference
    const Q_sensible = h_c * (Ta_K - Ts_K);

    // Latent heat: evaporation/sublimation if air is dry
    const es_0 = 6.11; // Saturation vapor pressure at 0°C (mb)
    // Lewis relation: mass transfer ≈ heat transfer / (Cp * Le)
    const Q_latent = (h_c / 0.66) * (vaporPressureMb - es_0) * 0.622 * L_EVAP / (1004 * 101.325);

    // ------------------------------------------------------------------------
    // D. GROUND HEAT FLUX
    // ------------------------------------------------------------------------
    // Ground typically provides ~5-10 W/m² in winter
    const Q_ground = 5.0;

    // ------------------------------------------------------------------------
    // TOTAL ENERGY BALANCE
    // ------------------------------------------------------------------------
    const Q_total = Q_sw + Q_lw + Q_sensible + Q_latent + Q_ground;

    // If net energy is negative, ice is growing (or stable), not melting
    if (Q_total <= 0) return 0;

    // ------------------------------------------------------------------------
    // MELT RATE CALCULATION
    // ------------------------------------------------------------------------
    // Energy (W/m²) = J/s/m² → Mass melt rate = Q / L_fusion (kg/s/m²)
    const massMeltRate = Q_total / L_FUSION;

    // Depth rate = mass rate / density (m/s)
    const depthRate_m_s = massMeltRate / RHO_ICE;

    // Convert to inches per hour
    return depthRate_m_s * 39.3701 * 3600;
}

/**
 * Determines road ice status from depth.
 * @param depth Ice depth in inches
 * @returns Status string for display
 */
export function getRoadIceStatus(depth: number): string {
    if (depth < 0.01) return 'Clear';
    return `Icy (${depth.toFixed(2)}")`;
}
