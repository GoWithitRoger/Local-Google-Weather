// ============================================================================
// ICE ACCRETION CALCULATIONS - MAKKONEN HEAT BALANCE MODEL
// Physics-based thermodynamic model for ice accumulation (ISO 12494 standard)
// ============================================================================

/**
 * Calculates radial ice accretion using the Makkonen Heat Balance Model (ISO 12494).
 * IMPORTANT: This signature matches processing.ts (Temp first).
 * * @param tempF Air Temperature (°F) - CRITICAL: Must be Air Temp, not Wet Bulb
 * @param windSpeed Wind Speed (mph)
 * @param qpf Liquid Precipitation Rate (in/hr)
 * @param dewPointF Dew Point (°F)
 * @param diameterIn Diameter of the line/wire (inches). Default 0.5.
 * @returns Radial Ice Thickness Growth Rate (inches per hour)
 */
export function calculatePreciseAccretion(
    tempF: number,
    windSpeed: number,
    qpf: number,
    dewPointF: number,
    diameterIn: number = 0.5
): number {
    // 1. Safety Checks
    if (qpf <= 0) return 0;

    // Physics Check: If air is properly warm (above 35F) and dewpoint is above freezing, no ice.
    // We allow up to 35F because evaporative cooling can freeze water even if air is > 32F.
    if (tempF > 35 && dewPointF > 32) return 0;

    // 2. Constants & Unit Conversions
    const PI = Math.PI;
    const Ta = (tempF - 32) * 5 / 9;      // Air Temp (C)
    const Td = (dewPointF - 32) * 5 / 9;  // Dew Point (C)
    const V = windSpeed * 0.44704;        // Wind (m/s)
    const D = diameterIn * 0.0254;        // Diameter (m)

    // Precip Flux (Vertical)
    // Convert in/hr -> mm/hr -> kg/m2/s
    const P_flux = (qpf * 25.4) / 3600;   // kg/m2/s

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
    // LWC (g/m3) = 0.072 * P(mm/hr)^0.88
    const P_mm_hr = qpf * 25.4;
    const LWC_g_m3 = 0.072 * Math.pow(P_mm_hr, 0.88);
    const LWC_kg = LWC_g_m3 / 1000;

    // Total Water Mass Flux (M_w) hitting the wire (kg/m/s)
    // Combines vertical falling rain + horizontal wind-blown rain
    const horizontal_flux = LWC_kg * V;     // kg/m2/s
    const vertical_flux = P_flux;           // kg/m2/s
    const J_imp = Math.sqrt(Math.pow(horizontal_flux, 2) + Math.pow(vertical_flux, 2)); // Total Flux kg/m2/s
    const M_w = D * J_imp; // Mass per meter of wire (kg/m/s)

    // 4. Thermodynamics (Heat Balance Terms)
    // Calculate Reynolds & Nusselt Numbers for Heat Transfer Coeff (h)
    let Re = (rho_air * V * D) / mu_air;
    if (Re < 1) Re = 1;
    // Nusselt correlation for cylinder in cross-flow (McAdams)
    const Nu = 0.3 + (0.62 * Math.sqrt(Re) * Math.pow(0.71, 0.33)) /
        Math.pow(1 + Math.pow(0.4 / 0.71, 0.66), 0.25) * Math.pow(1 + Math.pow(Re / 282000, 0.625), 0.8);
    const h = (Nu * k_air) / D; // Convective Heat Transfer Coefficient (W/m2K)

    // Vapor Pressures for Evaporation (Pascals)
    const es_0 = 611.2; // Saturation at 0C (Surface)
    const e_a = 611.2 * Math.exp((17.67 * Td) / (Td + 243.5)); // Vapor pressure of air

    // Heat Fluxes (W/m2)
    // Q_c: Convection (Cooling if Ta < 0)
    const q_c = h * (0 - Ta);

    // Q_e: Evaporation (Cooling if air is dry)
    // Simplified mass transfer via Lewis relation
    const q_e = h * 0.622 * (L_e / (1004 * 101325)) * (es_0 - e_a) * 1004 * rho_air;

    // Q_s: Sensible Heat of Rain (Warming if rain is warmer than 0C)
    // Rain arrives at Ta, must cool to 0C.
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
    // Mass Rate Frozen = alpha * M_w (kg/m/s)
    const mass_rate_frozen = alpha * M_w;

    // Radial Growth dR/dt = MassRate / (rho_ice * PI * D) approx
    const dr_dt_m_s = mass_rate_frozen / (rho_ice * PI * D);

    // Convert to inches per hour
    return dr_dt_m_s * 39.3701 * 3600;
}

/**
 * Legacy placeholder - Do not use.
 * @deprecated Use calculatePreciseAccretion instead
 */
export function calculateProvisionalAccretion(
    _qpf: number,
    _wetBulb: number,
    _windSpeed: number,
    _dewPoint?: number
): number {
    // Satisfy linter for unused vars in deprecated placeholder
    void _qpf;
    void _wetBulb;
    void _windSpeed;
    void _dewPoint;
    return 0; // Disabled to prevent fallback errors
}
