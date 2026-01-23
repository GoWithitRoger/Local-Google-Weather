import { useState, useCallback, useMemo, useEffect } from 'react';
import { processWeatherData, calculateMetrics, generateAlerts, downloadCSV, downloadJSON } from '@/utils';
import { useWeatherApi } from './useWeatherApi';
import { useGeolocation } from './useGeolocation';
import { generateDemoData } from './demoData';
import type { WeatherApiResponse, ChartDataPoint, ForecastMetrics, Location, WeatherAlert } from '@/types';

// ============================================================================
// WEATHER DATA COMPOSITION HOOK
// Orchestrates weather API, geolocation, and data processing
// ============================================================================

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
 * Main hook for weather data management
 * Composes useWeatherApi and useGeolocation hooks with data processing
 * 
 * @param apiKey Google API key for Weather and Geocoding APIs
 */
export function useWeatherData(apiKey: string): UseWeatherDataReturn {
    const [isDemoData, setIsDemoData] = useState(false);

    // Weather API hook
    const {
        rawData,
        loading: apiLoading,
        error: apiError,
        setError: setApiError,
        isCached,
        lastFetchTime,
        fetchWeather: apiFetchWeather,
        setRawData,
    } = useWeatherApi(apiKey);

    // Geolocation hook
    const {
        location,
        setLocation,
        geolocating,
        searchingLocation,
        error: geoError,
        setError: setGeoError,
        useCurrentLocation,
        searchLocation,
    } = useGeolocation(apiKey);

    // Loading state combines API loading
    const loading = apiLoading;

    // Merge errors from both hooks
    const error = apiError || geoError;

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

    // Fetch weather for current location
    const fetchWeather = useCallback(async (forceRefresh = false) => {
        setIsDemoData(false);
        await apiFetchWeather(location, forceRefresh);
    }, [apiFetchWeather, location]);

    // Load demo data
    const loadDemoData = useCallback(() => {
        setApiError(null);
        setGeoError(null);
        setRawData(generateDemoData());
        setIsDemoData(true);
    }, [setApiError, setGeoError, setRawData]);

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
