import type { RiskLevel } from '@/types';

// ============================================================================
// RISK THRESHOLDS
// Based on NWS ice storm severity scales and historical outage data
// ============================================================================

/**
 * Ice accumulation thresholds (in inches)
 * Source: National Weather Service ice storm impact categories
 */
export const ICE_THRESHOLDS = {
    /** Light glaze - minimal risk, minor travel issues */
    LIGHT: 0.01,
    /** Moderate accumulation - tree limbs stressed, some power outages likely */
    MODERATE: 0.10,
    /** Heavy accumulation - significant tree/power line damage */
    HEAVY: 0.25,
    /** Catastrophic - widespread infrastructure damage, extended outages */
    SEVERE: 0.50,
} as const;

/**
 * Wind gust thresholds (in mph)
 * Wind significantly amplifies ice storm damage
 */
export const WIND_THRESHOLDS = {
    /** Elevated risk when combined with ice accumulation */
    ELEVATED: 20,
    /** High risk of bringing down ice-laden power lines */
    DANGEROUS: 40,
} as const;

/**
 * Wind Stress Multipliers for Radial Ice
 * Wind load increases mechanically with ice diameter (Sail Effect)
 */
export const WIND_STRESS_MULTIPLIERS = {
    /** < 15 mph: Static load dominant */
    LOW: 1.0,
    /** 15-29 mph: Moderate galloping risk */
    MODERATE: 1.5,
    /** 30-45 mph: High stress, likely breaking weak branches */
    HIGH: 2.0,
    /** > 45 mph: Critical stress, widespread line failure */
    EXTREME: 3.0,
} as const;

/**
 * Risk score weights - contributes to 0-100 outage probability
 */
export const RISK_WEIGHTS = {
    ICE_LIGHT: 10,
    ICE_MODERATE: 20,
    ICE_HEAVY: 40,
    ICE_SEVERE: 30,
    WIND_DANGEROUS: 30,
    WIND_WITH_ICE: 20,
} as const;

// ============================================================================
// RISK LEVEL CONFIGURATION
// ============================================================================

export const RISK_LEVELS: Record<RiskLevel, { max: number; color: string; label: string; bgClass: string }> = {
    low: {
        max: 20,
        color: '#047857', // emerald-700 (was #10b981 emerald-500)
        label: 'Low Risk',
        bgClass: 'bg-emerald-500',
    },
    moderate: {
        max: 40,
        color: '#b45309', // amber-700 (was #eab308 yellow-500)
        label: 'Moderate',
        bgClass: 'bg-yellow-500',
    },
    high: {
        max: 70,
        color: '#c2410c', // orange-700 (was #f97316 orange-500)
        label: 'High Risk',
        bgClass: 'bg-orange-500',
    },
    critical: {
        max: 100,
        color: '#dc2626', // red-600 (was #ef4444 red-500)
        label: 'CRITICAL',
        bgClass: 'bg-red-500',
    },
};

// ============================================================================
// RADIAL ICE THRESHOLDS (NWS Standard for Wire Accretion)
// ============================================================================

/**
 * Radial ice accretion thresholds for power line ice loading (inches)
 * These are RADIAL (one side of wire), not diameter
 */
export const RADIAL_ICE_THRESHOLDS = {
    /** Some sagging, usually no outages */
    NUISANCE: 0.25,
    /** NWS Ice Storm Warning criteria - limbs break, scattered outages */
    SIGNIFICANT: 0.50,
    /** Widespread breaking of poles and lines */
    CATASTROPHIC: 0.75,
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/** 
 * Number of forecast hours to fetch
 * 72 = 3 days (reduced from 96/4 days for cost efficiency)
 */
export const HOURS_TO_FETCH = 120;

/** 
 * Cache duration in milliseconds
 * 15 minutes - weather data doesn't change that frequently
 */
export const CACHE_DURATION_MS = 15 * 60 * 1000;

/** Google Weather API base URL */
export const WEATHER_API_URL = 'https://weather.googleapis.com/v1/forecast/hours:lookup';

// ============================================================================
// DEFAULT LOCATION
// ============================================================================

export const DEFAULT_LOCATION = {
    lat: '',
    lon: '',
    name: '',
};

// ============================================================================
// CHART CONFIGURATION
// ============================================================================

export const CHART_COLORS = {
    risk: '#ef4444',
    riskGradient: 'url(#colorRisk)',
    ice: '#3b82f6',
    temp: '#6366f1',
    wind: '#94a3b8',
    grid: '#f1f5f9',
    gridDark: '#334155',
};

export const CHART_MARGINS = {
    top: 10,
    right: 0,
    left: 0,
    bottom: 0,
};

// ============================================================================
// CSV EXPORT CONFIGURATION
// ============================================================================

export const CSV_COLUMNS = [
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'dayLabel', label: 'Day' },
    { key: 'shortLabel', label: 'Time' },
    { key: 'temp', label: 'Temp (°F)' },
    { key: 'feelsLike', label: 'Feels Like (°F)' },
    { key: 'dewPoint', label: 'Dew Point (°F)' },
    { key: 'wetBulbTemp', label: 'Wet Bulb (°F)' },
    { key: 'humidity', label: 'Humidity (%)' },
    { key: 'precipProb', label: 'Precip Prob (%)' },
    { key: 'thunderstormProbability', label: 'Thunderstrom Prob (%)' },
    { key: 'precipAmount', label: 'Precip Amount (in)' },
    { key: 'precipType', label: 'Precip Type' },
    { key: 'iceThickness', label: 'Road Ice - API Model (in)' },
    { key: 'radialWireIce', label: 'Radial Wire Ice - Makkonen (in)' },
    { key: 'roadIceDepth', label: 'Road Ice Depth - Tracked (in)' },
    { key: 'roadStatus', label: 'Road Status' },
    { key: 'snowAccumulation', label: 'New Snow (in)' },
    { key: 'snowDepth', label: 'Snow Depth - Tracked (in)' },
    { key: 'snowStatus', label: 'Snow Status' },
    { key: 'windSpeed', label: 'Wind Speed (mph)' },
    { key: 'windGust', label: 'Wind Gust (mph)' },
    { key: 'windDirection', label: 'Wind Dir (°)' },
    { key: 'cloudCover', label: 'Cloud Cover (%)' },
    { key: 'visibility', label: 'Visibility (mi)' },
    { key: 'pressure', label: 'Pressure (mb)' },
    { key: 'uvIndex', label: 'UV Index' },
    { key: 'condition', label: 'Condition' },
    { key: 'riskScore', label: 'Risk Score' },
] as const;


