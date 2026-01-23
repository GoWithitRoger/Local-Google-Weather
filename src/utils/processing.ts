import type { ChartDataPoint, ForecastHour, ForecastMetrics } from '@/types';
import { getNumericValue, getStringValue } from './extraction';
import { calculateRiskScore } from './risk';
import { calculateProvisionalAccretion } from './ice-accretion';

// ============================================================================
// DATA PROCESSING
// Functions for transforming raw API data into chart-ready format
// ============================================================================

/**
 * Process raw API data into chart-ready format
 * @param forecastHours Array of raw forecast hours from API
 * @returns Processed chart data points
 */
export function processWeatherData(forecastHours: ForecastHour[]): ChartDataPoint[] {
    return forecastHours.map(hour => {
        const dateStr = hour.interval?.startTime || hour.forecastTime || new Date().toISOString();
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const fullDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

        // Temperature
        const temp = getNumericValue(hour.temperature, 'degrees');
        // Fix: API uses feelsLikeTemperature, not apparentTemperature
        const feelsLike = getNumericValue(hour.feelsLikeTemperature, 'degrees') ||
            getNumericValue(hour.apparentTemperature, 'degrees', temp);
        const dewPoint = getNumericValue(hour.dewPoint, 'degrees');
        const wetBulbTemp = getNumericValue(hour.wetBulbTemperature, 'degrees', temp);

        // Precipitation - Fix: probability is nested object with { type, percent }
        const precipProb = getNumericValue(hour.precipitation?.probability, 'percent');
        const precipAmount = getNumericValue(hour.precipitation?.qpf, 'quantity');
        // Fix: type is in probability object, not directly on precipitation
        const precipType = getStringValue(hour.precipitation?.probability, 'type') ||
            getStringValue(hour.precipitation, 'type', 'NONE');

        // Ice and Snow
        const iceThickness = getNumericValue(hour.iceThickness, 'thickness');
        const snowAccumulation = getNumericValue(hour.precipitation?.snowQpf, 'quantity');

        // Wind (Fix: Access 'value' inside the nested speed/gust objects)
        // The API returns { speed: { value: 9 }, gust: { value: 16 } }
        const windRaw = hour.wind as any;
        const windSpeed = getNumericValue(windRaw?.speed, 'value') || getNumericValue(hour.wind, 'speed');
        const windGust = getNumericValue(windRaw?.gust, 'value') || getNumericValue(hour.wind, 'gust');
        const windDirection = getNumericValue(windRaw?.direction, 'degrees') || getNumericValue(hour.wind, 'direction');

        // Atmospheric
        const humidity = hour.relativeHumidity ?? hour.humidity ?? 0;
        const cloudCover = hour.cloudCover ?? 0;
        const visibility = getNumericValue(hour.visibility, 'distance');

        // Pressure (Fix: Map 'airPressure.meanSeaLevelMillibars' to pressure)
        const pressureRaw = (hour as any).airPressure ?? hour.pressure;
        const pressure = getNumericValue(pressureRaw, 'meanSeaLevelMillibars') || getNumericValue(pressureRaw, 'value');

        // Conditions
        const uvRaw = hour.uvIndex;
        const uvIndex = typeof uvRaw === 'object'
            ? getNumericValue(uvRaw, 'value')
            : (uvRaw as number) ?? 0;

        // Condition Text - Fix: Prioritize description.text path
        let condition = '';
        const wc = hour.weatherCondition as any;

        if (typeof wc === 'string') {
            condition = wc;
        } else if (wc && typeof wc === 'object') {
            // Priority 1: description.text is the correct API path
            if (wc.description && typeof wc.description === 'object' && wc.description.text) {
                condition = wc.description.text;
            } else if (typeof wc.description === 'string') {
                condition = wc.description;
                // Priority 2: type field as fallback (e.g., "CLOUDY", "LIGHT_RAIN")
            } else if (wc.type && typeof wc.type === 'string') {
                condition = wc.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
                // Priority 3: value property as last resort
            } else if (wc.value && typeof wc.value === 'string') {
                condition = wc.value;
            } else {
                condition = wc.text || wc.main || '';
            }
        }

        // Computed risk
        const riskScore = calculateRiskScore(iceThickness, windGust);

        // Robust check for any liquid presence (Fixes the RAIN_AND_SNOW bug)
        const typeUpper = precipType.toUpperCase();
        const isLiquidSource = typeUpper.includes('RAIN') ||
            typeUpper.includes('MIX') ||
            typeUpper.includes('SLEET') ||
            typeUpper.includes('DRIZZLE');

        let provisionalIce = 0;
        if (isLiquidSource && wetBulbTemp <= 32 && precipAmount > 0) {
            provisionalIce = calculateProvisionalAccretion(precipAmount, wetBulbTemp, windSpeed, dewPoint);
        }

        return {
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
        };
    });
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
        };
    }

    const riskScores = chartData.map(d => d.riskScore);
    const iceValues = chartData.map(d => d.iceThickness);
    const temps = chartData.map(d => d.temp);
    const windGusts = chartData.map(d => d.windGust);

    const maxRiskIndex = riskScores.indexOf(Math.max(...riskScores));

    // Calculate provisional ice accretion using thermodynamic efficiency model
    // Now pre-calculated in processWeatherData
    const totalProvisionalIce = chartData.reduce((sum, d) => sum + d.provisionalIce, 0);

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
        snowAccumulation: Math.max(...chartData.map(d => d.snowAccumulation)),
        hoursWithPrecip: chartData.filter(d => d.precipProb > 30).length,
        precipTypes: Array.from(precipTypesSet),
    };
}
