import { WIND_STRESS_MULTIPLIERS, RISK_LEVELS } from '@/constants';
import type { RiskLevel } from '@/types';

// ============================================================================
// RISK CALCULATION
// Functions for calculating and classifying power outage risk
// Uses a Multiplicative Stress Model: Risk = (Ice Load) × (Wind Factor)
// ============================================================================

/**
 * Calculate power outage risk score based on RADIAL ice and wind
 * Uses a Multiplicative Stress Model (Ice Load × Wind Factor)
 * 
 * Physics: Wind stress on ice-coated lines is multiplicative, not additive.
 * Ice acts as a "sail" that exponentially increases mechanical load under wind.
 * 
 * @param radialIceThickness Radial ice accumulation (inches) from Makkonen model
 * @param windGust Wind gust speed (mph)
 * @returns Risk score from 0-100
 */
export function calculateRiskScore(radialIceThickness: number, windGust: number): number {
    // 1. Determine Base Ice Impact Score (0-100 scale based on NWS thresholds)
    let baseIceScore = 0;

    if (radialIceThickness < 0.1) {
        // Linear ramp up to 0.1" (0.05" = score 10)
        baseIceScore = (radialIceThickness / 0.1) * 20;
    } else if (radialIceThickness < 0.25) {
        // 0.10" to 0.25" -> Score 20 to 50
        baseIceScore = 20 + ((radialIceThickness - 0.1) / 0.15) * 30;
    } else if (radialIceThickness < 0.50) {
        // 0.25" to 0.50" -> Score 50 to 80
        baseIceScore = 50 + ((radialIceThickness - 0.25) / 0.25) * 30;
    } else {
        // > 0.50" -> Score 80 to 100+
        baseIceScore = 80 + ((radialIceThickness - 0.50) / 0.25) * 20;
    }

    // 2. Determine Wind Stress Multiplier
    let windMultiplier: number = WIND_STRESS_MULTIPLIERS.LOW;

    if (windGust >= 45) {
        windMultiplier = WIND_STRESS_MULTIPLIERS.EXTREME;
    } else if (windGust >= 30) {
        windMultiplier = WIND_STRESS_MULTIPLIERS.HIGH;
    } else if (windGust >= 15) {
        windMultiplier = WIND_STRESS_MULTIPLIERS.MODERATE;
    }

    // 3. Calculate Final Physics-Based Score
    // Example: 0.25" Ice (Score 50) × 30mph Wind (2.0x) = 100 (Critical)
    // Example: 0.25" Ice (Score 50) × 10mph Wind (1.0x) = 50 (Moderate)
    const finalScore = baseIceScore * windMultiplier;

    // Cap at 100
    return Math.min(Math.round(finalScore), 100);
}

/**
 * Convert a numeric risk score to a risk level category
 */
export function getRiskLevel(score: number): RiskLevel {
    if (score < RISK_LEVELS.low.max) return 'low';
    if (score < RISK_LEVELS.moderate.max) return 'moderate';
    if (score < RISK_LEVELS.high.max) return 'high';
    return 'critical';
}

/**
 * Get the display color for a risk score
 */
export function getRiskColor(score: number): string {
    return RISK_LEVELS[getRiskLevel(score)].color;
}

/**
 * Get the human-readable label for a risk score
 */
export function getRiskLabel(score: number): string {
    return RISK_LEVELS[getRiskLevel(score)].label;
}
