import { useState, useCallback, useRef } from 'react';
import { WEATHER_API_URL, HOURS_TO_FETCH, DEFAULT_LOCATION, CACHE_DURATION_MS } from '@/constants';
import { parseCoordinate } from '@/utils';
import type { WeatherApiResponse, ForecastHour, CacheEntry, Location } from '@/types';

// ============================================================================
// WEATHER API HOOK
// Handles fetching and caching weather data from Google Weather API
// ============================================================================

interface UseWeatherApiReturn {
    rawData: WeatherApiResponse | null;
    loading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    isCached: boolean;
    lastFetchTime: Date | null;
    fetchWeather: (location: Location, forceRefresh?: boolean) => Promise<void>;
    setRawData: (data: WeatherApiResponse | null) => void;
}

/**
 * Create a cache key from location coordinates
 */
function getCacheKey(lat: string, lon: string): string {
    return `${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;
}

/**
 * Hook for fetching and caching weather data
 * @param apiKey Google Weather API key
 */
export function useWeatherApi(apiKey: string): UseWeatherApiReturn {
    const [rawData, setRawData] = useState<WeatherApiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
    const [isCached, setIsCached] = useState(false);

    // Cache ref to persist across renders
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

    // Check cache for valid data
    const getCachedData = useCallback((lat: string, lon: string): WeatherApiResponse | null => {
        const key = getCacheKey(lat, lon);
        const cached = cacheRef.current.get(key);

        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        if (age > CACHE_DURATION_MS) {
            cacheRef.current.delete(key);
            return null;
        }

        return cached.data;
    }, []);

    // Save data to cache
    const setCachedData = useCallback((lat: string, lon: string, data: WeatherApiResponse) => {
        const key = getCacheKey(lat, lon);
        cacheRef.current.set(key, {
            data,
            timestamp: Date.now(),
            location: { lat, lon },
        });
    }, []);

    // Fetch weather data from API
    const fetchWeather = useCallback(async (location: Location, forceRefresh = false) => {
        const cleanKey = apiKey.trim();
        if (!cleanKey) {
            setError('Please enter your Google Maps API Key.');
            return;
        }

        const parsedLat = parseCoordinate(location.lat, -90, 90, parseFloat(DEFAULT_LOCATION.lat));
        const parsedLon = parseCoordinate(location.lon, -180, 180, parseFloat(DEFAULT_LOCATION.lon));

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = getCachedData(location.lat, location.lon);
            if (cached) {
                setRawData(cached);
                setIsCached(true);
                setError(null);
                return;
            }
        }

        setLoading(true);
        setError(null);
        setIsCached(false);

        // Fetch all hours with pagination support
        let allHours: ForecastHour[] = [];
        let pageToken: string | undefined = undefined;
        let fetchCount = 0;
        const MAX_FETCHES = 5; // Safety limit

        console.log(`Starting fetch for ${HOURS_TO_FETCH} hours...`);

        try {
            do {
                fetchCount++;
                const params = new URLSearchParams({
                    key: cleanKey,
                    'location.latitude': parsedLat.toString(),
                    'location.longitude': parsedLon.toString(),
                    hours: HOURS_TO_FETCH.toString(),
                    unitsSystem: 'IMPERIAL',
                    pageSize: '96', // Request full amount (API might limit to 24)
                });

                if (pageToken) {
                    params.append('pageToken', pageToken);
                }

                const url = `${WEATHER_API_URL}?${params.toString()}`;

                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    let errMsg = `Error ${response.status}`;
                    try {
                        const errData = await response.json();
                        if (errData.error?.message) {
                            errMsg = errData.error.message;
                        }
                    } catch {
                        // Response wasn't JSON
                    }
                    throw new Error(errMsg);
                }

                const data: WeatherApiResponse = await response.json();

                if (data.forecastHours) {
                    allHours = [...allHours, ...data.forecastHours];
                }

                pageToken = data.nextPageToken;
                console.log(`Page ${fetchCount}: Received ${data.forecastHours?.length || 0} hours. Next token: ${pageToken ? 'Yes' : 'No'}`);

            } while (pageToken && allHours.length < HOURS_TO_FETCH && fetchCount < MAX_FETCHES);

            // Construct final response object
            const finalData: WeatherApiResponse = {
                forecastHours: allHours,
            };

            // Log total
            console.log(`Total hours received: ${allHours.length}`);

            if (allHours.length < HOURS_TO_FETCH) {
                console.warn(`API returned fewer hours than requested: ${allHours.length}/${HOURS_TO_FETCH}`);
            }

            setRawData(finalData);
            setCachedData(location.lat, location.lon, finalData);
            setLastFetchTime(new Date());

        } catch (err) {
            console.error('Weather API Error:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            if (message === 'Failed to fetch' || message === 'Load failed') {
                setError('Network/CORS Block. Try demo data or check API key permissions.');
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }, [apiKey, getCachedData, setCachedData]);

    return {
        rawData,
        loading,
        error,
        setError,
        isCached,
        lastFetchTime,
        fetchWeather,
        setRawData,
    };
}
