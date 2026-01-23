import { ICE_THRESHOLDS, WIND_THRESHOLDS, RISK_WEIGHTS, RISK_LEVELS, CSV_COLUMNS } from '@/constants';
import type { RiskLevel, ChartDataPoint, ForecastHour, ForecastMetrics, WeatherAlert } from '@/types';

// ============================================================================
// RISK CALCULATION
// ============================================================================

/**
 * Calculate power outage risk score based on weather conditions
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

export function getRiskLevel(score: number): RiskLevel {
    if (score < RISK_LEVELS.low.max) return 'low';
    if (score < RISK_LEVELS.moderate.max) return 'moderate';
    if (score < RISK_LEVELS.high.max) return 'high';
    return 'critical';
}

export function getRiskColor(score: number): string {
    return RISK_LEVELS[getRiskLevel(score)].color;
}

export function getRiskLabel(score: number): string {
    return RISK_LEVELS[getRiskLevel(score)].label;
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

export function getNumericValue(obj: unknown, key: string, defaultVal = 0): number {
    if (typeof obj === 'number') return obj;
    if (obj && typeof obj === 'object' && key in obj) {
        const val = (obj as Record<string, unknown>)[key];
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? defaultVal : parsed;
        }
    }
    return defaultVal;
}

export function getStringValue(obj: unknown, key: string, defaultVal = ''): string {
    if (typeof obj === 'string') return obj;
    if (obj && typeof obj === 'object' && key in obj) {
        const val = (obj as Record<string, unknown>)[key];
        return typeof val === 'string' ? val : defaultVal;
    }
    return defaultVal;
}

export function parseCoordinate(value: string, min: number, max: number, defaultValue: number): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
        return defaultValue;
    }
    return num;
}

/**
 * Estimates the "Freezing Fraction" efficiency based on thermodynamic conditions.
 * Modeled after simplified CRREL/Makkonen logic for power line accretion.
 * @param qpf Liquid precipitation amount
 * @param wetBulb Wet bulb temperature (F)
 * @param windSpeed Wind speed (mph)
 * @returns Estimated ice accretion in inches
 */
function calculateProvisionalAccretion(qpf: number, wetBulb: number, windSpeed: number): number {
    // If it's too warm, nothing freezes
    if (wetBulb > 32 || qpf <= 0) return 0;

    // Base freezing efficiency (fraction of water that freezes vs drips off)
    // At 32F, efficiency is low (~40-60%). As it gets colder, it approaches 100%.
    let efficiency = 0.5;

    // Temperature Factor: Colder = higher efficiency
    // Add ~5% efficiency for every degree below 32
    efficiency += (32 - wetBulb) * 0.05;

    // Wind Factor: Wind increases convective cooling, allowing more latent heat release
    // Add ~2% efficiency per mph of wind (up to a limit)
    efficiency += windSpeed * 0.02;

    // Cap efficiency between 0 and 1.0 (cannot freeze more water than falls)
    efficiency = Math.min(Math.max(efficiency, 0), 1.0);

    // Apply efficiency to liquid equivalent
    return qpf * efficiency;
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

/**
 * Process raw API data into chart-ready format
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
        const feelsLike = getNumericValue(hour.apparentTemperature, 'degrees', temp);
        const dewPoint = getNumericValue(hour.dewPoint, 'degrees');
        const wetBulbTemp = getNumericValue(hour.wetBulbTemperature, 'degrees', temp);

        // Precipitation
        const precipProb = getNumericValue(hour.precipitation, 'probability') ||
            getNumericValue(hour.precipitation, 'pop') ||
            getNumericValue(hour.precipitation, 'precipitationProbability');
        const precipAmount = getNumericValue(hour.precipitation?.qpf, 'quantity');
        const precipType = getStringValue(hour.precipitation, 'type', 'NONE');

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

        // Condition Text
        let condition = '';
        const wc = hour.weatherCondition as any;

        if (typeof wc === 'string') {
            condition = wc;
        } else if (wc && typeof wc === 'object') {
            // Check for nested description.text (e.g. { description: { text: "Cloudy" } })
            // Or simple value property if that's what's returning [object Object]
            if (wc.value && typeof wc.value === 'string') {
                condition = wc.value;
            } else if (wc.description && typeof wc.description === 'object' && wc.description.text) {
                condition = wc.description.text;
            } else if (typeof wc.description === 'string') {
                condition = wc.description;
            } else {
                // Last ditch effort to find a string property
                condition = wc.text || wc.main || '';
            }
        }

        // Computed risk
        const riskScore = calculateRiskScore(iceThickness, windGust);

        // --- FIX START ---
        // Robust check for any liquid presence (Fixes the RAIN_AND_SNOW bug)
        const typeUpper = precipType.toUpperCase();
        const isLiquidSource = typeUpper.includes('RAIN') ||
            typeUpper.includes('MIX') ||
            typeUpper.includes('SLEET') ||
            typeUpper.includes('DRIZZLE');

        let provisionalIce = 0;
        if (isLiquidSource && wetBulbTemp <= 32 && precipAmount > 0) {
            provisionalIce = calculateProvisionalAccretion(precipAmount, wetBulbTemp, windSpeed);
        }
        // --- FIX END ---

        // DEBUG LOGGING
        if (precipAmount > 0) {
            console.log(`Debug [${time}]: Type="${precipType}" (Upper="${typeUpper}"), Liquid=${isLiquidSource}, WetBulb=${wetBulbTemp}, Amt=${precipAmount}, ProvIce=${provisionalIce}`);
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
 */
export function calculateMetrics(chartData: ChartDataPoint[]): ForecastMetrics {
    if (chartData.length === 0) {
        return {
            dateRange: '',
            maxRisk: 0,
            maxIce: 0,
            provisionalMaxIce: 0,
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
        maxIce: Math.max(...iceValues),
        provisionalMaxIce: totalProvisionalIce,
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

// ============================================================================
// ALERT GENERATION
// ============================================================================

export function generateAlerts(_chartData: ChartDataPoint[], metrics: ForecastMetrics): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const now = new Date();

    if (metrics.maxRisk >= 70) {
        alerts.push({
            id: 'critical-risk',
            severity: 'danger',
            title: 'Critical Power Outage Risk',
            message: `Peak risk of ${metrics.maxRisk.toFixed(0)}% expected ${metrics.peakRiskTime}. Prepare emergency supplies.`,
            time: now,
            metric: 'risk',
            value: metrics.maxRisk,
        });
    }

    if (metrics.maxIce >= ICE_THRESHOLDS.HEAVY) {
        alerts.push({
            id: 'heavy-ice',
            severity: 'danger',
            title: 'Heavy Ice Accumulation Expected',
            message: `Up to ${metrics.maxIce.toFixed(2)}" of ice expected. Significant tree and power line damage likely.`,
            time: now,
            metric: 'ice',
            value: metrics.maxIce,
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

// ============================================================================
// FORMATTING
// ============================================================================

export function formatIce(val: number): string {
    return val > 0 ? `${val.toFixed(2)}"` : '0';
}

export function formatTemp(val: number): string {
    return `${val.toFixed(0)}°F`;
}

export function formatWind(val: number): string {
    return `${val.toFixed(0)} mph`;
}

export function formatPercent(val: number): string {
    return `${val.toFixed(0)}%`;
}

export function formatPrecipType(type: string): string {
    const typeMap: Record<string, string> = {
        'RAIN': 'Rain',
        'SNOW': 'Snow',
        'FREEZING_RAIN': 'Freezing Rain',
        'SLEET': 'Sleet',
        'MIXED': 'Wintry Mix',
        'NONE': 'None',
    };
    return typeMap[type] || type;
}

// ============================================================================
// CSV EXPORT
// ============================================================================

export function generateCSV(data: ChartDataPoint[], locationName: string): string {
    const headers = CSV_COLUMNS.map(col => col.label).join(',');

    const rows = data.map(row => {
        return CSV_COLUMNS.map(col => {
            const value = row[col.key as keyof ChartDataPoint];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            if (typeof value === 'number') {
                return col.key.includes('temp') || col.key === 'feelsLike' || col.key === 'dewPoint'
                    ? value.toFixed(1)
                    : col.key.includes('ice') || col.key.includes('snow') || col.key === 'precipAmount'
                        ? value.toFixed(3)
                        : value.toFixed(1);
            }
            return value ?? '';
        }).join(',');
    }).join('\n');

    const metadata = [
        `# Ice Storm Monitor - Weather Forecast Export`,
        `# Location: ${locationName}`,
        `# Generated: ${new Date().toISOString()}`,
        `# Forecast Period: ${data[0]?.timestamp || ''} to ${data[data.length - 1]?.timestamp || ''}`,
        `# Hours: ${data.length}`,
        '',
    ].join('\n');

    return metadata + headers + '\n' + rows;
}


export function downloadCSV(data: ChartDataPoint[], locationName: string): void {
    const csv = generateCSV(data, locationName);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weather-forecast-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
