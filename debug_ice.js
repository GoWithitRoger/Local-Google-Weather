
function calculatePreciseAccretion(tempF, windSpeed, qpf, dewPointF, diameterIn = 0.5) {
    if (qpf <= 0) return 0;
    if (tempF > 35 && dewPointF > 32) return 0;

    const PI = Math.PI;
    const Ta = (tempF - 32) * 5 / 9;
    const Td = (dewPointF - 32) * 5 / 9;
    const V = windSpeed * 0.44704;
    const D = diameterIn * 0.0254;

    const P_flux = (qpf * 25.4) / 3600;

    const L_f = 334000;
    const L_e = 2257000;
    const Cp_w = 4186;
    const rho_ice = 917;
    const k_air = 0.024;
    const mu_air = 1.78e-5;
    const rho_air = 1.29;

    const P_mm_hr = qpf * 25.4;
    const LWC_g_m3 = 0.072 * Math.pow(P_mm_hr, 0.88);
    const LWC_kg = LWC_g_m3 / 1000;

    const horizontal_flux = LWC_kg * V;
    const vertical_flux = P_flux;
    const J_imp = Math.sqrt(Math.pow(horizontal_flux, 2) + Math.pow(vertical_flux, 2));
    const M_w = D * J_imp;

    let Re = (rho_air * V * D) / mu_air;
    if (Re < 1) Re = 1;
    const Nu = 0.3 + (0.62 * Math.sqrt(Re) * Math.pow(0.71, 0.33)) /
        Math.pow(1 + Math.pow(0.4 / 0.71, 0.66), 0.25) * Math.pow(1 + Math.pow(Re / 282000, 0.625), 0.8);
    const h = (Nu * k_air) / D;

    const es_0 = 611.2;
    const e_a = 611.2 * Math.exp((17.67 * Td) / (Td + 243.5));

    const q_c = h * (0 - Ta);
    const Cp_air = 1004;
    // q_e = (h / Cp_air) * L_e * 0.622 * (es_0 - e_a) / 101325
    const q_e = (h / Cp_air) * L_e * 0.622 * (es_0 - e_a) / 101325;
    const q_s = J_imp * Cp_w * (0 - Ta);

    const total_cooling = q_c + q_e + q_s;

    console.log(`Inputs: T=${tempF}, Td=${dewPointF}, V=${windSpeed}, QPF=${qpf}`);
    console.log(`Terms (W/m2): Qc=${q_c.toFixed(2)}, Qe=${q_e.toFixed(2)}, Qs=${q_s.toFixed(5)}`);
    console.log(`Total Cooling: ${total_cooling.toFixed(2)}`);

    let alpha = 0;
    if (J_imp > 0) {
        alpha = total_cooling / (J_imp * L_f);
    }
    alpha = Math.max(0, Math.min(alpha, 1.0));

    const mass_rate_frozen = alpha * M_w;
    const dr_dt_m_s = mass_rate_frozen / (rho_ice * PI * D);
    const rateInHr = dr_dt_m_s * 39.3701 * 3600;

    console.log(`Alpha: ${alpha.toFixed(3)}, Rate: ${rateInHr.toFixed(4)} in/hr`);
    return rateInHr;
}

// Case 1: Warm Rain (Hour 3)
// Temp 35.2, Dew 31.2, Wind 12, QPF 0.0492
calculatePreciseAccretion(35.2, 12, 0.0492, 31.2);

// Case 2: Near Freezing (Hour 5/6)
// Temp 32.5, Dew 28.9, Wind 12, QPF 0.0548
calculatePreciseAccretion(32.5, 12, 0.0548, 28.9);

// Case 3: Clear Freezing Rain (Hypothetical)
// Temp 30.0, Dew 28.0, Wind 12, QPF 0.1
calculatePreciseAccretion(30.0, 12, 0.1, 28.0);
