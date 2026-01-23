// ============================================================================
// UTILITIES BARREL EXPORT
// Re-exports all utility functions for backward compatibility
// ============================================================================

// Risk calculation
export {
    calculateRiskScore,
    getRiskLevel,
    getRiskColor,
    getRiskLabel,
} from './risk';

// Data extraction
export {
    getNumericValue,
    getStringValue,
    parseCoordinate,
} from './extraction';

// Ice accretion calculations
export { calculateProvisionalAccretion, calculatePreciseAccretion } from './ice-accretion';

// Data processing
export {
    processWeatherData,
    calculateMetrics,
} from './processing';

// Alert generation
export { generateAlerts } from './alerts';

// Formatting utilities
export {
    formatIce,
    formatTemp,
    formatWind,
    formatPercent,
    formatPrecipType,
} from './formatters';

// Data export
export {
    generateCSV,
    downloadCSV,
    downloadJSON,
} from './export';
