import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { WEATHER_API_URL, HOURS_TO_FETCH, DEFAULT_LOCATION, CACHE_DURATION_MS } from '@/constants';
import { processWeatherData, calculateMetrics, generateAlerts, parseCoordinate, downloadCSV, downloadJSON } from '@/utils';
import type { WeatherApiResponse, ForecastHour, ChartDataPoint, ForecastMetrics, Location, WeatherAlert, CacheEntry } from '@/types';

// Google Geocoding API for address lookup
const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

interface UseWeatherDataReturn {
    // Data
    chartData: ChartDataPoint[];
    metrics: ForecastMetrics;
    alerts: WeatherAlert[];
    rawData: WeatherApiResponse | null;

    // State
    loading: boolean;
    error: string | null;
    isDemoData: boolean;
    lastFetchTime: Date | null;
    isCached: boolean;
    hoursReturned: number;

    // Location
    location: Location;
    setLocation: (location: Location) => void;
    searchLocation: (query: string) => Promise<void>;
    searchingLocation: boolean;

    // Actions
    fetchWeather: (forceRefresh?: boolean) => Promise<void>;
    loadDemoData: () => void;
    useCurrentLocation: () => void;
    exportCSV: () => void;
    exportJSON: () => void;
    geolocating: boolean;
}

/**
 * Generate realistic demo data simulating a freeze event
 */
function generateDemoData(): WeatherApiResponse {
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
                    probability: (isFreezing || isRainy) ? 60 + Math.random() * 30 : 5 + Math.random() * 15,
                    qpf: { quantity: (isFreezing || isRainy) ? 0.01 + Math.random() * 0.05 : 0 },
                    snowQpf: { quantity: 0 },
                    type: precipType
                },
                wind: {
                    speed: 5 + Math.random() * 10,
                    gust: (isPeakIce ? 25 : 10) + Math.random() * 15,
                    direction: 270 + Math.random() * 90,
                    directionCardinal: 'NW'
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

/**
 * Create a cache key from location
 */
function getCacheKey(lat: string, lon: string): string {
    return `${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;
}

export function useWeatherData(apiKey: string): UseWeatherDataReturn {
    const [rawData, setRawData] = useState<WeatherApiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDemoData, setIsDemoData] = useState(false);
    const [geolocating, setGeolocating] = useState(false);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
    const [isCached, setIsCached] = useState(false);

    // Cache ref to persist across renders
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

    // Process raw data into chart format
    const chartData = useMemo(() => {
        if (!rawData?.forecastHours) return [];
        return processWeatherData(rawData.forecastHours);
    }, [rawData]);

    // Calculate hours returned
    const hoursReturned = chartData.length;

    // Calculate aggregate metrics
    const metrics = useMemo(() => calculateMetrics(chartData), [chartData]);

    // Generate alerts based on forecast
    const alerts = useMemo(() => generateAlerts(chartData, metrics), [chartData, metrics]);

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

    // Search for location by address/zip code
    const searchLocation = useCallback(async (query: string) => {
        const cleanKey = apiKey.trim();
        if (!cleanKey) {
            setError('Please enter your Google Maps API Key first.');
            return;
        }

        if (!query.trim()) {
            setError('Please enter a location to search.');
            return;
        }

        setSearchingLocation(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                address: query,
                key: cleanKey,
            });

            const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'ZERO_RESULTS') {
                setError(`No location found for "${query}". Try a different search.`);
                return;
            }

            if (data.status !== 'OK' || !data.results?.[0]) {
                setError(`Geocoding error: ${data.status}`);
                return;
            }

            const result = data.results[0];
            const { lat, lng } = result.geometry.location;

            // Extract a readable name
            const addressComponents = result.address_components || [];
            const city = addressComponents.find((c: { types: string[] }) => c.types.includes('locality'))?.short_name;
            const state = addressComponents.find((c: { types: string[] }) => c.types.includes('administrative_area_level_1'))?.short_name;
            const zip = addressComponents.find((c: { types: string[] }) => c.types.includes('postal_code'))?.short_name;

            let name = query;
            if (city && state) {
                name = zip ? `${city}, ${state} ${zip}` : `${city}, ${state}`;
            } else if (result.formatted_address) {
                // Use first part of formatted address
                name = result.formatted_address.split(',')[0];
            }

            setLocation({
                lat: lat.toFixed(4),
                lon: lng.toFixed(4),
                name,
            });
        } catch (err) {
            console.error('Geocoding error:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Location search failed: ${message}`);
        } finally {
            setSearchingLocation(false);
        }
    }, [apiKey]);

    // Fetch weather data from API
    const fetchWeather = useCallback(async (forceRefresh = false) => {
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
                setIsDemoData(false);
                setIsCached(true);
                setError(null);
                return;
            }
        }

        setLoading(true);
        setError(null);
        setIsDemoData(false);
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
    }, [apiKey, location, getCachedData, setCachedData]);

    // Load demo data
    const loadDemoData = useCallback(() => {
        setLoading(true);
        setError(null);
        setTimeout(() => {
            setRawData(generateDemoData());
            setIsDemoData(true);
            setIsCached(false);
            setLastFetchTime(new Date());
            setLoading(false);
        }, 400);
    }, []);

    // Use browser geolocation
    const useCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGeolocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude.toFixed(4),
                    lon: position.coords.longitude.toFixed(4),
                    name: 'Current Location',
                });
                setGeolocating(false);
            },
            (err) => {
                setError(`Geolocation error: ${err.message}`);
                setGeolocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    }, []);

    // Export CSV
    const exportCSV = useCallback(() => {
        if (chartData.length === 0) return;
        downloadCSV(chartData, location.name);
    }, [chartData, location.name]);

    // Export JSON
    const exportJSON = useCallback(() => {
        if (!rawData) return;
        downloadJSON(rawData, `weather-data-${location.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`);
    }, [rawData, location.name]);

    // Auto-fetch on mount if API key is available
    useEffect(() => {
        if (apiKey) {
            fetchWeather();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-fetch when location changes
    useEffect(() => {
        if (apiKey && location.lat && location.lon) {
            fetchWeather(true); // Force refresh on location change
        }
    }, [location.lat, location.lon]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        chartData,
        metrics,
        alerts,
        rawData,
        loading,
        error,
        isDemoData,
        lastFetchTime,
        isCached,
        hoursReturned,
        location,
        setLocation,
        searchLocation,
        searchingLocation,
        fetchWeather,
        loadDemoData,
        useCurrentLocation,
        exportCSV,
        exportJSON,
        geolocating,
    };
}
