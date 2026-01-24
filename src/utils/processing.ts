import type { ChartDataPoint, ForecastHour, ForecastMetrics } from '@/types';
import { getNumericValue, getStringValue } from './extraction';
import { calculateRiskScore } from './risk';
import { calculatePreciseAccretion } from './ice-accretion';
import { calculateStreetIceBurnoff, getRoadIceStatus } from './street-ice';
import { calculateSnowMeltRate, getSnowStatus, calculateSnowCompaction } from './snow-melt';
import { detectFlashFreezeRisk } from './road-weather';

// ============================================================================
// DATA PROCESSING
// Functions for transforming raw API data into chart-ready format
// ============================================================================

/**
 * Process raw API data into chart-ready format.
 * Uses "bucket model" to track road ice and snow depth over time,
 * applying accumulation and burnoff/melt physics.
 * @param forecastHours Array of raw forecast hours from API
 * @returns Processed chart data points
 */
export function processWeatherData(forecastHours: ForecastHour[]): ChartDataPoint[] {
    // Initialize "buckets" for state tracking
    let currentRoadIceDepth = 0;
    let currentSnowDepth = 0;

    const results: ChartDataPoint[] = [];

    for (const hour of forecastHours) {
        const dateStr = hour.interval?.startTime || hour.forecastTime || new Date().toISOString();
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const fullDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        const hourOfDay = date.getHours();
        const isDaytime = hourOfDay >= 7 && hourOfDay < 19;

        // Temperature
        const temp = getNumericValue(hour.temperature, 'degrees');
        const feelsLike = getNumericValue(hour.feelsLikeTemperature, 'degrees') ||
            getNumericValue(hour.apparentTemperature, 'degrees', temp);
        const dewPoint = getNumericValue(hour.dewPoint, 'degrees');
        const wetBulbTemp = getNumericValue(hour.wetBulbTemperature, 'degrees', temp);

        // Precipitation
        const precipProb = getNumericValue(hour.precipitation?.probability, 'percent');
        const precipAmount = getNumericValue(hour.precipitation?.qpf, 'quantity');
        const precipType = getStringValue(hour.precipitation?.probability, 'type') ||
            getStringValue(hour.precipitation, 'type', 'NONE');

        // Ice and Snow from API
        const iceThickness = getNumericValue(hour.iceThickness, 'thickness');
        const snowAccumulation = getNumericValue(hour.precipitation?.snowQpf, 'quantity');

        // Wind
        const windRaw = hour.wind as any;
        const windSpeed = getNumericValue(windRaw?.speed, 'value') || getNumericValue(hour.wind, 'speed');
        const windGust = getNumericValue(windRaw?.gust, 'value') || getNumericValue(hour.wind, 'gust');
        const windDirection = getNumericValue(windRaw?.direction, 'degrees') || getNumericValue(hour.wind, 'direction');

        // Atmospheric
        const humidity = hour.relativeHumidity ?? hour.humidity ?? 0;
        const cloudCover = hour.cloudCover ?? 0;
        const visibility = getNumericValue(hour.visibility, 'distance');

        // Pressure
        const pressureRaw = (hour as any).airPressure ?? hour.pressure;
        const pressure = getNumericValue(pressureRaw, 'meanSeaLevelMillibars') || getNumericValue(pressureRaw, 'value');

        // UV Index
        const uvRaw = hour.uvIndex;
        const uvIndex = typeof uvRaw === 'object'
            ? getNumericValue(uvRaw, 'value')
            : (uvRaw as number) ?? 0;

        // Condition Text
        let condition = '';
        const wc = hour.weatherCondition as any;
        if (typeof wc === 'string') {
            condition = wc;
        } else if (wc && typeof wc === 'object') {
            if (wc.description && typeof wc.description === 'object' && wc.description.text) {
                condition = wc.description.text;
            } else if (typeof wc.description === 'string') {
                condition = wc.description;
            } else if (wc.type && typeof wc.type === 'string') {
                condition = wc.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
            } else if (wc.value && typeof wc.value === 'string') {
                condition = wc.value;
            } else {
                condition = wc.text || wc.main || '';
            }
        }

        // Precipitation type analysis
        const typeUpper = precipType.toUpperCase();
        const isLiquidSource = typeUpper.includes('RAIN') ||
            typeUpper.includes('MIX') ||
            typeUpper.includes('SLEET') ||
            typeUpper.includes('DRIZZLE');

        // ================================================================
        // RADIAL WIRE ICE - Hourly Rate (Makkonen model)
        // ================================================================
        let radialWireIce = 0;
        if (isLiquidSource && temp <= 35 && precipAmount > 0) {
            radialWireIce = calculatePreciseAccretion(temp, windSpeed, precipAmount, dewPoint);
        }
        const provisionalIce = radialWireIce; // Alias for backwards compatibility

        // Computed risk (uses THIS HOUR's radial ice rate)
        const riskScore = calculateRiskScore(radialWireIce, windGust);

        // ================================================================
        // ROAD ICE BUCKET MODEL
        // ================================================================
        // INPUT: New deposits from API ice thickness
        const newRoadIceDeposit = iceThickness;

        // OUTPUT: Burnoff rate (only when not actively precipitating)
        let roadIceBurnoff = 0;
        if (newRoadIceDeposit === 0 && currentRoadIceDepth > 0) {
            roadIceBurnoff = calculateStreetIceBurnoff(
                temp, dewPoint, windSpeed, cloudCover, uvIndex, isDaytime
            );
        }

        // Update bucket: add deposit, subtract burnoff, clamp at 0
        currentRoadIceDepth = Math.max(0, currentRoadIceDepth + newRoadIceDeposit - roadIceBurnoff);
        const roadStatus = getRoadIceStatus(currentRoadIceDepth);

        // ================================================================
        // SNOW DEPTH BUCKET MODEL
        // ================================================================
        // INPUT: New snow accumulation (API snowQpf already in inches of snow)
        const newSnowDepth = snowAccumulation;

        // OUTPUT: Melt rate (only when not actively snowing)
        let snowMelt = 0;
        if (newSnowDepth === 0 && currentSnowDepth > 0) {
            // Pass rain amount only if it's liquid rain (not frozen)
            const liquidRain = (isLiquidSource && temp > 32) ? precipAmount : 0;
            snowMelt = calculateSnowMeltRate(
                temp, dewPoint, windSpeed, liquidRain, cloudCover, uvIndex, isDaytime
            );
        }

        // Compaction (snow settles ~1% per hour even without melting)
        const compaction = calculateSnowCompaction(currentSnowDepth);

        // Update bucket: add snow, subtract melt and compaction, clamp at 0
        currentSnowDepth = Math.max(0, currentSnowDepth + newSnowDepth - snowMelt - compaction);
        const snowStatus = getSnowStatus(currentSnowDepth);

        results.push({
            fullDate: date,
            timestamp: date.toISOString(),
            label: `${day} ${time}`,
            shortLabel: time,
            dayLabel: day,
            fullDayLabel: fullDay,
            temp,
            feelsLike,
            dewPoint,
            wetBulbTemp,
            precipProb,
            precipAmount,
            precipType,
            iceThickness,
            provisionalIce,
            snowAccumulation,
            radialWireIce,
            roadIceDepth: currentRoadIceDepth,
            roadStatus,
            snowDepth: currentSnowDepth,
            snowStatus,
            windSpeed,
            windGust,
            windDirection,
            humidity,
            cloudCover,
            visibility,
            pressure,
            uvIndex,
            condition,
            riskScore,
            thunderstormProbability: hour.thunderstormProbability ?? 0,
        });
    }

    return results;
}


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

    // FIX 1: "New Snow" = TOTAL SUM of hourly accumulation
    const totalSnowAccumulation = chartData.reduce((sum, d) => sum + d.snowAccumulation, 0);

    // FIX 2: "Max Depth" = PEAK of the bucket model (accounts for melt/compaction)
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

