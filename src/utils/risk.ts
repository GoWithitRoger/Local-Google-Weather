import { ICE_THRESHOLDS, WIND_THRESHOLDS, RISK_WEIGHTS, RISK_LEVELS } from '@/constants';
import type { RiskLevel } from '@/types';

// ============================================================================
// RISK CALCULATION
// Functions for calculating and classifying power outage risk
// ============================================================================

/**
 * Calculate power outage risk score based on weather conditions
 * @param iceThickness Ice accumulation in inches
 * @param windGust Wind gust speed in mph
 * @returns Risk score from 0-100
 */
export function calculateRiskScore(iceThickness: number, windGust: number): number {
    let riskScore = 0;

    if (iceThickness > ICE_THRESHOLDS.LIGHT) riskScore += RISK_WEIGHTS.ICE_LIGHT;
    if (iceThickness > ICE_THRESHOLDS.MODERATE) riskScore += RISK_WEIGHTS.ICE_MODERATE;
    if (iceThickness > ICE_THRESHOLDS.HEAVY) riskScore += RISK_WEIGHTS.ICE_HEAVY;
    if (iceThickness > ICE_THRESHOLDS.SEVERE) riskScore += RISK_WEIGHTS.ICE_SEVERE;

    if (windGust > WIND_THRESHOLDS.DANGEROUS) {
        riskScore += RISK_WEIGHTS.WIND_DANGEROUS;
    } else if (windGust > WIND_THRESHOLDS.ELEVATED && iceThickness > ICE_THRESHOLDS.MODERATE) {
        riskScore += RISK_WEIGHTS.WIND_WITH_ICE;
    }

    return Math.min(riskScore, 100);
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
