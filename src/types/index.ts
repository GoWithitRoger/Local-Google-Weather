// ============================================================================
// Type Definitions for Ice Storm Monitor
// ============================================================================

/**
 * Raw API response from Google Weather API
 */
export interface WeatherApiResponse {
    forecastHours: ForecastHour[];
    nextPageToken?: string;
}

/**
 * Single hour forecast from the API
 */
export interface ForecastHour {
    interval?: {
        startTime: string;
        endTime?: string;
    };
    forecastTime?: string;

    // Temperature
    temperature?: {
        degrees: number;
        unit?: string;
    };
    apparentTemperature?: {
        degrees: number;
        unit?: string;
    };
    dewPoint?: {
        degrees: number;
        unit?: string;
    };
    wetBulbTemperature?: {
        degrees: number;
        unit?: string;
    };

    // Precipitation
    precipitation?: {
        probability: number;
        type?: string;
        qpf?: { quantity: number; unit?: string };      // Liquid equivalent
        snowQpf?: { quantity: number; unit?: string };  // Snow liquid equivalent
    };

    // Wind
    wind?: {
        speed: number;
        gust: number;
        direction?: number;
        directionCardinal?: string;
    };

    // Ice and Snow
    iceThickness?: {
        thickness?: number; // Correct API field
        value?: number;     // Deprecated?
        unit?: string;
    };
    snowAccumulation?: {
        amount?: number;    // Correct API field
        value?: number;     // Deprecated?
        unit?: string;
    };

    // Atmospheric
    humidity?: number;
    relativeHumidity?: number;
    visibility?: {
        distance: number;
        unit?: string;
    };
    cloudCover?: number;
    pressure?: {
        value: number;
        unit?: string;
    };

    // Conditions
    uvIndex?: {
        value: number;
        category?: string;
    } | number;
    weatherCondition?: string; // Or object structure
    weatherCode?: number;
    isDaytime?: boolean;

    // Thunderstorm
    thunderstormProbability?: number;
}

/**
 * Processed chart data point - expanded with more fields
 */
export interface ChartDataPoint {
    fullDate: Date;
    timestamp: string; // ISO string for CSV
    label: string;
    shortLabel: string;
    dayLabel: string;
    fullDayLabel: string;

    // Temperature
    temp: number;
    feelsLike: number;
    dewPoint: number;
    wetBulbTemp: number;

    // Precipitation
    precipProb: number;
    precipAmount: number; // Total liquid equivalent
    precipType: string;   // RAIN, SNOW, FREEZING_RAIN, SLEET, etc.

    // Ice and Snow
    iceThickness: number;
    provisionalIce: number;
    snowAccumulation: number;

    // Wind
    windSpeed: number;
    windGust: number;
    windDirection: number;

    // Atmospheric
    humidity: number;
    cloudCover: number;
    visibility: number;
    pressure: number;

    // Conditions
    uvIndex: number;
    condition: string;

    // Computed
    riskScore: number;
}

/**
 * Computed metrics from forecast data
 */
export interface ForecastMetrics {
    dateRange: string;
    maxRisk: number;
    maxIce: number;
    provisionalMaxIce: number;
    minTemp: number;
    maxTemp: number;
    avgWindGust: number;
    hoursWithIce: number;
    peakRiskTime: string;
    endDate: string;

    // Precipitation totals
    totalPrecip: number;      // Total liquid equivalent (inches)
    snowAccumulation: number; // Max snow (inches)
    hoursWithPrecip: number;  // Hours with any precipitation
    precipTypes: string[];    // Types observed (RAIN, SNOW, etc.)
}

/**
 * Location state
 */
export interface Location {
    lat: string;
    lon: string;
    name: string;
}

/**
 * Risk level classification
 */
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

/**
 * Tab options for the dashboard
 */
export type TabOption = 'dashboard' | 'details' | 'alerts';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'danger';

/**
 * Weather alert
 */
export interface WeatherAlert {
    id: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    time: Date;
    metric?: string;
    value?: number;
}

/**
 * Cache entry for API responses
 */
export interface CacheEntry {
    data: WeatherApiResponse;
    timestamp: number;
    location: { lat: string; lon: string };
}
