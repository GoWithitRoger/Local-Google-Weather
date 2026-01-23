// ============================================================================
// ICE ACCRETION CALCULATIONS - MAKKONEN HEAT BALANCE MODEL
// Physics-based thermodynamic model for ice accumulation (ISO 12494 standard)
// ============================================================================

/**
 * Calculates radial ice accretion using the Makkonen Heat Balance Model (ISO 12494).
 * This solves for the thermodynamic limit of freezing (Glaze vs Rime) by balancing
 * the heat released by freezing against the heat removed by convection and evaporation.
 * 
 * This replaces the simplified linear heuristic with a first-principles approach that:
 * - Handles "warm" rain with evaporative cooling (wet-bulb effects)
 * - Models wind as both increasing water flux AND cooling (finds balance point)
 * - Accounts for wire diameter sensitivity
 * 
 * @param tempF Air Temperature (°F)
 * @param windSpeed Wind Speed (mph)
 * @param qpf Liquid Precipitation Rate (in/hr)
 * @param dewPointF Dew Point (°F) - Required for evaporative cooling calculation
 * @param diameterIn Diameter of the line/wire (inches). Standard distribution line ~0.5.
 * @returns Radial Ice Thickness Growth Rate (inches per hour)
 */
export function calculatePreciseAccretion(
    tempF: number,
    windSpeed: number,
    qpf: number,
    dewPointF: number,
    diameterIn: number = 0.5
): number {
    // 1. Filter Warm Conditions (Physics cut-off)
    // Accretion is impossible if Wet Bulb > 32, but we use precise heat balance below.
    // Quick check: If air temp is well above freezing, return 0.
    if (tempF > 33 && dewPointF > 32) return 0;
    if (qpf <= 0) return 0;

    // 2. Constants & Unit Conversions
    const PI = Math.PI;
    const Ta = (tempF - 32) * 5 / 9;      // Air Temp (C)
    const Td = (dewPointF - 32) * 5 / 9;  // Dew Point (C)
    const V = windSpeed * 0.44704;        // Wind (m/s)
    const D = diameterIn * 0.0254;        // Diameter (m)
    const P_flux = qpf * 25.4 / 3600;     // Precip flux (kg/m2/s vertical approx)

    // Physical Constants
    const L_f = 334000;    // Latent Heat of Freezing (J/kg)
    const L_e = 2257000;   // Latent Heat of Evaporation (J/kg)
    const Cp_w = 4186;     // Specific Heat of Water (J/kgK)
    const rho_ice = 917;   // Density of Glaze Ice (kg/m3)
    const k_air = 0.024;   // Thermal Conductivity of Air (W/mK)
    const mu_air = 1.78e-5;// Dynamic Viscosity (kg/ms)
    const rho_air = 1.29;  // Density of Air (kg/m3)

    // 3. Aerodynamics (Water Flux Impingement)
    // Estimate Liquid Water Content (LWC) in kg/m3 from Precip Rate (Best 1950)
    // LWC = 0.072 * P(mm/hr)^0.88 g/m3
    const P_mm_hr = qpf * 25.4;
    const LWC_kg = (0.072 * Math.pow(P_mm_hr, 0.88)) / 1000;

    // Total Water Mass Flux (M_w) hitting the wire (kg/m/s)
    // Combines vertical falling rain + horizontal wind-blown rain
    const horizontal_flux = LWC_kg * V;     // kg/m2/s
    const vertical_flux = P_flux * 1000;    // kg/m2/s (approx)
    const J_imp = Math.sqrt(Math.pow(horizontal_flux, 2) + Math.pow(vertical_flux, 2)); // Total Flux kg/m2/s
    const M_w = D * J_imp; // Mass per meter of wire (kg/m/s)

    // 4. Thermodynamics (Heat Balance Terms)
    // Calculate Reynolds & Nusselt Numbers for Heat Transfer Coeff (h)
    let Re = (rho_air * V * D) / mu_air;
    if (Re < 1) Re = 1;
    // Nusselt correlation for cylinder in cross-flow
    const Nu = 0.3 + (0.62 * Math.sqrt(Re) * Math.pow(0.71, 0.33)) /
        Math.pow(1 + Math.pow(0.4 / 0.71, 0.66), 0.25) * Math.pow(1 + Math.pow(Re / 282000, 0.625), 0.8);
    const h = (Nu * k_air) / D; // Convective Heat Transfer Coefficient (W/m2K)

    // Vapor Pressures for Evaporation (Pascals)
    // Saturation vapor pressure at Surface (0C) vs Air (Td)
    const es_0 = 611.2;
    const e_a = 611.2 * Math.exp((17.67 * Td) / (Td + 243.5));

    // Heat Fluxes (W/m2) - Positive means removing heat (cooling)
    // Q_c: Convection (Cooling if Ta < 0)
    const q_c = h * (0 - Ta);

    // Q_e: Evaporation (Cooling if air is dry)
    // Simplified mass transfer via Lewis relation
    const q_e = h * 0.622 * (L_e / (1004 * 101325)) * (es_0 - e_a) * 1004 * rho_air;

    // Q_s: Sensible Heat of Rain (Warming if rain is warmer than 0C)
    // Rain arrives at Ta, must cool to 0C. This ADDS heat to the surface (Negative cooling).
    const q_s = J_imp * Cp_w * (0 - Ta);

    // Total Cooling Available to Freeze Water (W/m2)
    const total_cooling = q_c + q_e + q_s;

    // 5. Solve for Freezing Fraction (Alpha)
    // Heat Balance: Alpha * Flux * L_f = Total_Cooling
    let alpha = 0;
    if (J_imp > 0) {
        alpha = total_cooling / (J_imp * L_f);
    }

    // Bound Alpha between 0 (wet, dripping) and 1.0 (all freezes / rime)
    alpha = Math.max(0, Math.min(alpha, 1.0));

    // 6. Calculate Radial Growth Rate
    // Mass Rate Frozen = alpha * M_w
    // Radial Growth dR/dt = MassRate / (rho_ice * PI * D) approx
    const mass_rate_frozen = alpha * M_w;
    const dr_dt_m_s = mass_rate_frozen / (rho_ice * PI * D);

    // Convert to inches per hour
    return dr_dt_m_s * 39.3701 * 3600;
}

/**
 * @deprecated Use calculatePreciseAccretion instead - this linear heuristic is physically inaccurate.
 * Kept for backward compatibility during transition.
 */
export function calculateProvisionalAccretion(
    qpf: number,
    wetBulb: number,
    windSpeed: number,
    dewPoint?: number
): number {
    // If dewPoint is provided, use the precise model
    if (dewPoint !== undefined) {
        return calculatePreciseAccretion(wetBulb, windSpeed, qpf, dewPoint);
    }

    // Legacy fallback (linear heuristic) - kept for backward compatibility
    if (wetBulb > 32 || qpf <= 0) return 0;

    let efficiency = 0.5;
    efficiency += (32 - wetBulb) * 0.05;
    efficiency += windSpeed * 0.02;
    efficiency = Math.min(Math.max(efficiency, 0), 1.0);

    return qpf * efficiency;
}
