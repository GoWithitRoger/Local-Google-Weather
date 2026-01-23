// ============================================================================
// DATA EXTRACTION UTILITIES
// Safe extraction of values from nested API response objects
// ============================================================================

/**
 * Safely extract a numeric value from an object property
 * Handles nested objects and type coercion
 * @param obj The source object
 * @param key The property key to extract
 * @param defaultVal Default value if extraction fails
 */
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

/**
 * Safely extract a string value from an object property
 * @param obj The source object
 * @param key The property key to extract
 * @param defaultVal Default value if extraction fails
 */
export function getStringValue(obj: unknown, key: string, defaultVal = ''): string {
    if (typeof obj === 'string') return obj;
    if (obj && typeof obj === 'object' && key in obj) {
        const val = (obj as Record<string, unknown>)[key];
        return typeof val === 'string' ? val : defaultVal;
    }
    return defaultVal;
}

/**
 * Parse and validate a coordinate string
 * @param value The coordinate string
 * @param min Minimum valid value
 * @param max Maximum valid value
 * @param defaultValue Default if invalid
 */
export function parseCoordinate(value: string, min: number, max: number, defaultValue: number): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
        return defaultValue;
    }
    return num;
}
