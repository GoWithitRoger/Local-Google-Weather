import { ICE_THRESHOLDS } from '@/constants';
import type { ChartDataPoint, ForecastMetrics, WeatherAlert } from '@/types';

// ============================================================================
// ALERT GENERATION
// Functions for creating weather alerts based on forecast metrics
// ============================================================================

/**
 * Generate weather alerts based on forecast data and computed metrics
 * @param _chartData Full hourly chart data (reserved for future use)
 * @param metrics Aggregate forecast metrics
 * @returns Array of weather alerts sorted by severity
 */
export function generateAlerts(_chartData: ChartDataPoint[], metrics: ForecastMetrics): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const now = new Date();

    if (metrics.maxRisk >= 70) {
        alerts.push({
            id: 'critical-risk',
            severity: 'danger',
            title: 'High Ice/Wind Risk Score',
            message: `The project score peaks at ${metrics.maxRisk.toFixed(0)} around ${metrics.peakRiskTime}. Check official local forecasts for guidance.`,
            time: now,
            metric: 'risk',
            value: metrics.maxRisk,
        });
    }

    if (metrics.totalIce >= ICE_THRESHOLDS.HEAVY) {
        alerts.push({
            id: 'heavy-ice',
            severity: 'danger',
            title: 'Heavy Ice Accumulation Expected',
            message: `Up to ${metrics.totalIce.toFixed(2)}" of ice expected. Significant tree and power line damage likely.`,
            time: now,
            metric: 'ice',
            value: metrics.totalIce,
        });
    }

    if (metrics.minTemp <= 32) {
        alerts.push({
            id: 'freezing',
            severity: 'warning',
            title: 'Freezing Temperatures',
            message: `Low of ${metrics.minTemp.toFixed(0)}°F expected. Protect pipes and outdoor plants.`,
            time: now,
            metric: 'temp',
            value: metrics.minTemp,
        });
    }

    if (metrics.hoursWithIce >= 12) {
        alerts.push({
            id: 'extended-ice',
            severity: 'warning',
            title: 'Extended Ice Event',
            message: `Ice accumulation expected for ${metrics.hoursWithIce} hours. Plan for extended impacts.`,
            time: now,
            metric: 'duration',
            value: metrics.hoursWithIce,
        });
    }

    if (metrics.snowAccumulation >= 2) {
        alerts.push({
            id: 'snow-accumulation',
            severity: 'warning',
            title: 'Snow Accumulation',
            message: `Up to ${metrics.snowAccumulation.toFixed(1)}" of snow expected. Travel may be hazardous.`,
            time: now,
            metric: 'snow',
            value: metrics.snowAccumulation,
        });
    }

    if (metrics.totalPrecip >= 0.5) {
        alerts.push({
            id: 'significant-precip',
            severity: 'info',
            title: 'Significant Precipitation',
            message: `Total precipitation of ${metrics.totalPrecip.toFixed(2)}" expected over the forecast period.`,
            time: now,
            metric: 'precip',
            value: metrics.totalPrecip,
        });
    }

    return alerts;
}
