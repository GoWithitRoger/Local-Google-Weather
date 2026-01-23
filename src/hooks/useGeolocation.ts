import { useState, useCallback } from 'react';
import type { Location } from '@/types';
import { DEFAULT_LOCATION } from '@/constants';

// ============================================================================
// GEOLOCATION HOOK
// Manages browser geolocation and geocoding via Google Geocoding API
// ============================================================================

const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

interface UseGeolocationReturn {
    location: Location;
    setLocation: (location: Location) => void;
    geolocating: boolean;
    searchingLocation: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    useCurrentLocation: () => void;
    searchLocation: (query: string) => Promise<void>;
}

/**
 * Parses address components from Google Geocoding API response into a readable name
 */
function parseLocationName(
    addressComponents: Array<{ types: string[]; short_name: string }>,
    formattedAddress?: string,
    fallback = 'Unknown Location'
): string {
    const city = addressComponents.find((c) => c.types.includes('locality'))?.short_name;
    const neighborhood = addressComponents.find((c) => c.types.includes('neighborhood'))?.short_name;
    const sublocality = addressComponents.find((c) => c.types.includes('sublocality'))?.short_name;
    const state = addressComponents.find((c) => c.types.includes('administrative_area_level_1'))?.short_name;

    // Prefer city, fall back to neighborhood or sublocality
    const locality = city || neighborhood || sublocality;

    if (locality && state) {
        return `${locality}, ${state}`;
    } else if (formattedAddress) {
        // Use first two parts of formatted address for context
        const parts = formattedAddress.split(',').slice(0, 2);
        return parts.join(',').trim();
    }
    return fallback;
}

/**
 * Reverse geocodes coordinates to a location name
 */
async function reverseGeocode(
    lat: string,
    lon: string,
    apiKey: string
): Promise<string> {
    const params = new URLSearchParams({
        latlng: `${lat},${lon}`,
        key: apiKey,
    });

    const response = await fetch(`${GEOCODING_API_URL}?${params.toString()}`);

    if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    // Debug logging to diagnose API issues
    if (data.status !== 'OK') {
        console.error('Geocoding API response:', data);
        console.error('Request URL (key redacted):', `${GEOCODING_API_URL}?latlng=${lat},${lon}&key=***`);
        throw new Error(`Reverse geocoding error: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`);
    }

    if (!data.results?.[0]) {
        throw new Error('Reverse geocoding returned no results');
    }

    const result = data.results[0];
    return parseLocationName(
        result.address_components || [],
        result.formatted_address,
        'Current Location'
    );
}

/**
 * Hook for managing location state and geolocation/geocoding operations
 * @param apiKey Google Maps API key for geocoding
 */
export function useGeolocation(apiKey: string): UseGeolocationReturn {
    const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
    const [geolocating, setGeolocating] = useState(false);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use browser geolocation with reverse geocoding
    const useCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGeolocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lon = position.coords.longitude.toFixed(4);

                // Attempt reverse geocoding if API key is available
                let name = 'Current Location';
                const cleanKey = apiKey.trim();
                if (cleanKey) {
                    try {
                        name = await reverseGeocode(lat, lon, cleanKey);
                    } catch (err) {
                        console.warn('Reverse geocoding failed, using fallback:', err);
                        // Keep default name on failure
                    }
                }

                setLocation({ lat, lon, name });
                setGeolocating(false);
            },
            (err) => {
                setError(`Geolocation error: ${err.message}`);
                setGeolocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    }, [apiKey]);

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

            // Use shared helper for consistent name parsing
            const name = parseLocationName(
                result.address_components || [],
                result.formatted_address,
                query
            );

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

    return {
        location,
        setLocation,
        geolocating,
        searchingLocation,
        error,
        setError,
        useCurrentLocation,
        searchLocation,
    };
}
