import type { ChartDataPoint, ForecastMetrics } from '@/types';
import { detectFlashFreezeRisk } from './road-weather';

/**
 * Calculate aggregate metrics from chart data
 * @param chartData Processed chart data points
 * @returns Aggregate forecast metrics
 */
export function calculateMetrics(chartData: ChartDataPoint[]): ForecastMetrics {
    if (chartData.length === 0) {
        return {
            dateRange: '',
            maxRisk: 0,
            totalIce: 0,
            provisionalTotalIce: 0,
            minTemp: 0,
            maxTemp: 0,
            avgWindGust: 0,
            hoursWithIce: 0,
            peakRiskTime: '',
            endDate: '',
            totalPrecip: 0,
            snowAccumulation: 0,
            hoursWithPrecip: 0,
            precipTypes: [],
            maxRoadIce: 0,
            roadClearTime: null,
            maxSnowDepth: 0,
            totalRadialWireIce: 0,
            flashFreezeRisk: 'NONE',
        };
    }

    const riskScores = chartData.map(d => d.riskScore);
    const iceValues = chartData.map(d => d.iceThickness);
    const temps = chartData.map(d => d.temp);
    const windGusts = chartData.map(d => d.windGust);

    const maxRiskIndex = riskScores.indexOf(Math.max(...riskScores));

    // Total radial wire ice accretion (sum of hourly rates)
    // d.provisionalIce stores the hourly accretion rate
    const totalRadialWireIce = chartData.reduce((sum, d) => sum + d.provisionalIce, 0);

    // For backwards compatibility, provisionalTotalIce = totalRadialWireIce
    const totalProvisionalIce = totalRadialWireIce;

    // Road ice metrics
    const maxRoadIce = Math.max(...chartData.map(d => d.roadIceDepth));

    // Find road clear time - first hour where road ice returns to 0 after being > 0
    let roadClearTime: string | null = null;
    let sawIce = false;
    for (const d of chartData) {
        if (d.roadIceDepth > 0.01) {
            sawIce = true;
        } else if (sawIce && d.roadIceDepth < 0.01) {
            roadClearTime = d.timestamp;
            break;
        }
    }

    // "New Snow" = TOTAL SUM of hourly accumulation
    const totalSnowAccumulation = chartData.reduce((sum, d) => sum + d.snowAccumulation, 0);

    // "Max Depth" = PEAK of the bucket model (accounts for melt/compaction)
    const peakSnowDepth = Math.max(...chartData.map(d => d.snowDepth));

    // Gather all precipitation types observed (excluding NONE)
    const precipTypesSet = new Set<string>();
    chartData.forEach(d => {
        if (d.precipType && d.precipType !== 'NONE' && d.precipProb > 20) {
            precipTypesSet.add(d.precipType);
        }
    });

    return {
        dateRange: `${chartData[0].fullDayLabel} - ${chartData[chartData.length - 1].fullDayLabel}`,
        maxRisk: Math.max(...riskScores),
        totalIce: iceValues.reduce((a, b) => a + b, 0),
        provisionalTotalIce: totalProvisionalIce,
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        avgWindGust: windGusts.reduce((a, b) => a + b, 0) / windGusts.length,
        hoursWithIce: iceValues.filter(v => v > 0).length,
        peakRiskTime: chartData[maxRiskIndex]?.label || '',
        endDate: chartData[chartData.length - 1].fullDayLabel,
        totalPrecip: chartData.reduce((sum, d) => sum + d.precipAmount, 0),
        // "New Snow" label -> total accumulation over forecast period
        snowAccumulation: totalSnowAccumulation,
        hoursWithPrecip: chartData.filter(d => d.precipProb > 30).length,
        precipTypes: Array.from(precipTypesSet),
        maxRoadIce,
        roadClearTime,
        maxSnowDepth: peakSnowDepth,  // "Max Depth" -> peak from bucket model
        totalRadialWireIce,
        flashFreezeRisk: detectFlashFreezeRisk(chartData),
    };
}
