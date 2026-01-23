// ============================================================================
// FORMATTING UTILITIES
// Functions for formatting weather values for display
// ============================================================================

/**
 * Format ice thickness for display
 */
export function formatIce(val: number): string {
    return val > 0 ? `${val.toFixed(2)}"` : '0';
}

/**
 * Format temperature for display
 */
export function formatTemp(val: number): string {
    return `${val.toFixed(0)}°F`;
}

/**
 * Format wind speed for display
 */
export function formatWind(val: number): string {
    return `${val.toFixed(0)} mph`;
}

/**
 * Format percentage for display
 */
export function formatPercent(val: number): string {
    return `${val.toFixed(0)}%`;
}

/**
 * Format precipitation type code for human-readable display
 */
export function formatPrecipType(type: string): string {
    const typeMap: Record<string, string> = {
        'RAIN': 'Rain',
        'SNOW': 'Snow',
        'FREEZING_RAIN': 'Freezing Rain',
        'SLEET': 'Sleet',
        'MIXED': 'Wintry Mix',
        'RAIN_AND_SNOW': 'Rain/Snow',
        'NONE': 'None',
    };
    return typeMap[type] || type;
}
