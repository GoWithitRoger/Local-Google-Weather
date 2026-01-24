// ============================================================================
// ROAD WEATHER HAZARD DETECTION
// Physics-based models for detecting dangerous road conditions
// ============================================================================

import type { ChartDataPoint } from '@/types';

/**
 * Risk labels for flash freeze detection
 */
export type FlashFreezeRisk = 'NONE' | 'HIGH: Flash Freeze' | 'SEVERE: Snow Covering Ice';

/**
 * Detects flash freeze risk by running a stateful simulation over forecast hours.
 * 
 * Algorithm:
 * 1. Track `standingWater`: A bucket representing water depth on the road
 *    - Input: Adds QPF only when temp > 32°F
 *    - Drainage: Decays by 50% per hour (evaporation/runoff)
 * 
 * 2. Track `roadTemp`: A lagged temperature value
 *    - Logic: roadTemp moves 30% toward airTemp each hour (simulates asphalt thermal mass)
 * 
 * 3. Trigger Flash Freeze:
 *    - If roadTemp crosses below 32°F AND standingWater > 0.01"
 *    - If snow is also falling when this happens, it's "SEVERE: Snow Covering Ice"
 * 
 * @param chartData Processed chart data points with temperature and precipitation
 * @returns Risk label: 'NONE', 'HIGH: Flash Freeze', or 'SEVERE: Snow Covering Ice'
 */
export function detectFlashFreezeRisk(chartData: ChartDataPoint[]): FlashFreezeRisk {
    if (chartData.length === 0) return 'NONE';

    // Initialize State
    // Assume road starts at the same temp as the first air temp reading
    let roadTemp = chartData[0].temp;
    let standingWater = 0;
    let maxRiskFound: FlashFreezeRisk = 'NONE';

    for (const hour of chartData) {
        const airTemp = hour.temp;
        const precip = hour.precipAmount || 0;

        // Update Road Temp (Simple Thermal Inertia Model)
        // Road lags behind air temperature changes.
        // 0.3 factor means road closes 30% of the gap to air temp per hour.
        roadTemp += (airTemp - roadTemp) * 0.3;

        // Manage Water Bucket
        if (airTemp > 32) {
            // If it's warm, rain adds to standing water
            standingWater += precip;
        }
        // If it's freezing, new precip is snow/ice (doesn't add to LIQUID water)
        // But existing water is now in danger of freezing

        // Drainage / Evaporation
        // Assume 50% of standing water drains/dries per hour if not replenished
        standingWater *= 0.5;

        // Risk Detection
        // THRESHOLD: 0.01 inches of water is enough for a glaze
        if (roadTemp <= 32 && standingWater > 0.01) {
            // If snow is also falling, it covers the ice (Deadly "Cobblestone Ice")
            const isSnowing = (hour.snowAccumulation || 0) > 0;

            if (isSnowing) {
                // Immediate return - this is the most severe case
                return 'SEVERE: Snow Covering Ice';
            } else {
                // Mark HIGH risk (can be overwritten by SEVERE later if snow starts)
                maxRiskFound = 'HIGH: Flash Freeze';
            }
        }
    }

    return maxRiskFound;
}
