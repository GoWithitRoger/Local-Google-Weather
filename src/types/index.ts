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
    // Actual API field name (not apparentTemperature)
    feelsLikeTemperature?: {
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

    // Precipitation - actual API has probability as nested object
    precipitation?: {
        probability?: {
            type?: string;   // NONE, RAIN, SNOW, FREEZING_RAIN, etc.
            percent: number; // 0-100
        };
        type?: string;       // Fallback location for type
        qpf?: { quantity: number; unit?: string };      // Liquid equivalent
        snowQpf?: { quantity: number; unit?: string };  // Snow liquid equivalent
    };

    // Wind - actual API has nested value objects
    wind?: {
        speed?: { value: number; unit?: string } | number;
        gust?: { value: number; unit?: string } | number;
        direction?: { degrees: number; cardinal?: string } | number;
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
    // Actual API uses airPressure
    airPressure?: {
        meanSeaLevelMillibars: number;
    };

    // Conditions
    uvIndex?: {
        value: number;
        category?: string;
    } | number;
    // Actual API has nested description object
    weatherCondition?: string | {
        iconBaseUri?: string;
        description?: { text: string; languageCode?: string } | string;
        type?: string;  // e.g., "CLOUDY", "LIGHT_RAIN"
        value?: string; // Fallback
    };
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
    /** Radial ice on wires (inches) - NWS standard for Ice Storm Warnings */
    radialWireIce: number;
    /** Road surface ice depth (inches) - tracks accumulation vs burnoff */
    roadIceDepth: number;
    /** Road status: 'Clear' | 'Icy (X.XX")' */
    roadStatus: string;
    /** Tracked snow depth (inches) - accumulates and melts */
    snowDepth: number;
    /** Snow status: 'Clear' | 'Snow Cover (X.X")' */
    snowStatus: string;

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
    thunderstormProbability: number;
    /** Flash freeze risk level */
    flashFreezeRisk: FlashFreezeRisk;

    // Theme
    isDaytime: boolean;
}

/**
 * Risk labels for flash freeze detection
 */
export type FlashFreezeRisk = 'NONE' | 'HIGH: Flash Freeze' | 'SEVERE: Snow Covering Ice';


/**
 * Computed metrics from forecast data
 */
export interface ForecastMetrics {
    dateRange: string;
    maxRisk: number;
    totalIce: number;
    provisionalTotalIce: number;
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

    // Road/snow state tracking
    /** Maximum road ice depth during forecast (inches) */
    maxRoadIce: number;
    /** Estimated time when roads will be clear (ISO string or null) */
    roadClearTime: string | null;
    /** Maximum tracked snow depth (inches) */
    maxSnowDepth: number;
    /** Total radial wire ice accretion (inches) */
    totalRadialWireIce: number;
    /** Flash freeze risk level: 'NONE', 'HIGH: Flash Freeze', or 'SEVERE: Snow Covering Ice' */
    flashFreezeRisk: FlashFreezeRisk;
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
