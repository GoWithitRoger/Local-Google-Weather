import { HOURS_TO_FETCH } from '@/constants';
import type { WeatherApiResponse } from '@/types';

// ============================================================================
// DEMO DATA GENERATION
// Creates realistic demo data simulating a winter storm event
// ============================================================================

/**
 * Generate realistic demo data simulating a freeze event
 * Creates 120 hours of forecast data with a realistic ice storm pattern:
 * - Hours 0-10: Normal weather
 * - Hours 10-25: Rain moving in
 * - Hours 30-54: Freezing conditions with ice
 * - Hours 36-48: Peak ice event
 * 
 * @returns WeatherApiResponse with simulated forecast data
 */
export function generateDemoData(): WeatherApiResponse {
    const now = new Date();
    return {
        forecastHours: Array.from({ length: HOURS_TO_FETCH }, (_, i) => {
            const time = new Date(now.getTime() + i * 3600000);
            const isFreezing = i > 30 && i < 54;
            const isPeakIce = i > 36 && i < 48;
            const isRainy = i > 10 && i < 25;
            const hour = time.getHours();
            const isDaytime = hour >= 7 && hour <= 19;

            // Determine precipitation type
            let precipType = 'NONE';
            if (isPeakIce) precipType = 'FREEZING_RAIN';
            else if (isFreezing) precipType = 'SLEET';
            else if (isRainy) precipType = 'RAIN';

            return {
                interval: { startTime: time.toISOString() },
                temperature: {
                    degrees: isFreezing ? 26 + Math.random() * 4 : 45 - (i * 0.15) + Math.random() * 8
                },
                apparentTemperature: {
                    degrees: isFreezing ? 20 + Math.random() * 4 : 40 - (i * 0.15) + Math.random() * 8
                },
                dewPoint: {
                    degrees: isFreezing ? 24 + Math.random() * 2 : 35 + Math.random() * 5
                },
                precipitation: {
                    probability: {
                        type: precipType,
                        percent: (isFreezing || isRainy) ? 60 + Math.random() * 30 : 5 + Math.random() * 15
                    },
                    qpf: { quantity: (isFreezing || isRainy) ? 0.01 + Math.random() * 0.05 : 0 },
                    snowQpf: { quantity: 0 }
                },
                wind: {
                    speed: { value: 5 + Math.random() * 10 },
                    gust: { value: (isPeakIce ? 25 : 10) + Math.random() * 15 },
                    direction: { degrees: 270 + Math.random() * 90, cardinal: 'NW' }
                },
                iceThickness: {
                    thickness: isPeakIce ? 0.1 + (Math.random() * 0.25) : (isFreezing ? 0.01 + Math.random() * 0.05 : 0),
                    value: 0
                },
                snowAccumulation: {
                    amount: isFreezing && !isPeakIce ? 0.5 + Math.random() * 1.5 : 0,
                    value: 0
                },
                relativeHumidity: 65 + Math.random() * 30,
                cloudCover: (isFreezing || isRainy) ? 80 + Math.random() * 20 : 20 + Math.random() * 40,
                visibility: {
                    distance: isPeakIce ? 1 + Math.random() * 3 : 8 + Math.random() * 2
                },
                pressure: {
                    value: 1010 + (Math.random() - 0.5) * 15
                },
                uvIndex: isDaytime && !isFreezing && !isRainy ? 2 + Math.random() * 5 : 0,
                weatherCondition: isPeakIce ? 'Freezing Rain' :
                    isFreezing ? 'Wintry Mix' :
                        isRainy ? 'Rain' :
                            isDaytime ? 'Partly Cloudy' : 'Clear',
                isDaytime,
            };
        }),
    };
}
