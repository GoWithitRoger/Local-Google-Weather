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
 * Hook for managing location state and geolocation/geocoding operations
 * @param apiKey Google Maps API key for geocoding
 */
export function useGeolocation(apiKey: string): UseGeolocationReturn {
    const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
    const [geolocating, setGeolocating] = useState(false);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
