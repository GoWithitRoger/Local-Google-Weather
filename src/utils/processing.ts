import type { ChartDataPoint, ForecastHour, FlashFreezeRisk } from '@/types';
import { getNumericValue, getStringValue } from './extraction';
import { calculateRiskScore } from './risk';
import { calculatePreciseAccretion } from './ice-accretion';
import { calculateStreetIceBurnoff, getRoadIceStatus } from './street-ice';
import { calculateSnowMeltRate, getSnowStatus, calculateSnowCompaction } from './snow-melt';

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

    // Flash Freeze State
    // Initialize road temp with first hour's air temp to avoid start-up shock
    let roadTemp = forecastHours.length > 0
        ? getNumericValue(forecastHours[0].temperature, 'degrees')
        : 32;
    let standingWater = 0;

    const results: ChartDataPoint[] = [];

    for (const hour of forecastHours) {
        const dateStr = hour.interval?.startTime || hour.forecastTime || new Date().toISOString();
        const date = new Date(dateStr);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const fullDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        const hourOfDay = date.getHours();
        // Use API provided isDaytime, or fallback to rough estimate
        const isDaytime = typeof hour.isDaytime === 'boolean'
            ? hour.isDaytime
            : (hourOfDay >= 7 && hourOfDay < 19);

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
        // FILTER: Conservation of Mass Check
        // The Google API often reports the total precipitation potential in multiple fields simultaneously.
        // For example, 0.1" of Liquid Equivalent (QPF) might be reported as BOTH 1.0" of Snow AND 0.1" of Ice
        // in the same hour when the condition is "SNOW". This is physically impossible (double counting the water).
        // Since the condition is explicitly "SNOW" (and not "MIX" or "FREEZING RAIN"), we prioritize the Snow QPF
        // and discard the Ice Thickness artifact to prevent false "Ice Storm" alerts during normal snow events.
        let newRoadIceDeposit = iceThickness;
        const isPureSnow = typeUpper.includes('SNOW') &&
            !typeUpper.includes('RAIN') &&
            !typeUpper.includes('ICE') &&
            !typeUpper.includes('FREEZING') &&
            !typeUpper.includes('MIX') &&
            !typeUpper.includes('SLEET');

        if (isPureSnow || snowAccumulation > 0) {
            newRoadIceDeposit = 0;
        }

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

        // ================================================================
        // FLASH FREEZE RISK (Standing Water + Falling Temp)
        // ================================================================
        // 1. Update Road Temp (Simple Thermal Inertia Model)
        // Road lags behind air temperature changes (30% catch-up per hour)
        roadTemp += (temp - roadTemp) * 0.3;

        // 2. Manage Water Bucket
        if (temp > 32) {
            // If it's warm, rain adds to standing water
            standingWater += precipAmount;
        }

        // 3. Drainage / Evaporation (50% per hour)
        standingWater *= 0.5;

        // 4. Risk Detection
        let flashFreezeRisk: FlashFreezeRisk = 'NONE';
        // THRESHOLD: 0.01 inches of water is enough for a glaze
        if (roadTemp <= 32 && standingWater > 0.01) {
            const isSnowing = snowAccumulation > 0;
            if (isSnowing) {
                flashFreezeRisk = 'SEVERE: Snow Covering Ice';
            } else {
                flashFreezeRisk = 'HIGH: Flash Freeze';
            }
        }

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
            flashFreezeRisk,
            isDaytime,
        });
    }

    return results;
}

