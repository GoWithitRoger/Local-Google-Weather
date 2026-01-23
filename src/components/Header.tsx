import { useState, KeyboardEvent } from 'react';
import { CloudRain, Lock, Navigation, RefreshCw, MapPin, Calendar, Moon, Sun, Monitor, Download, FileJson, Clock, Search, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { Location, ForecastMetrics } from '@/types';

interface HeaderProps {
    apiKey: string;
    setApiKey: (key: string) => void;
    location: Location;
    metrics: ForecastMetrics;
    loading: boolean;
    geolocating: boolean;
    isDemoData: boolean;
    isCached: boolean;
    lastFetchTime: Date | null;
    hasData: boolean;
    hoursReturned: number;
    searchingLocation: boolean;
    onRefresh: (forceRefresh?: boolean) => void;
    onGeolocate: () => void;
    onExportCSV: () => void;
    onExportJSON: () => void;
    onSearchLocation: (query: string) => void;
}

export function Header({
    apiKey,
    setApiKey,
    location,
    metrics,
    loading,
    geolocating,
    isDemoData,
    isCached,
    lastFetchTime,
    hasData,
    hoursReturned,
    searchingLocation,
    onRefresh,
    onGeolocate,
    onExportCSV,
    onExportJSON,
    onSearchLocation,
}: HeaderProps) {
    const { theme, setTheme } = useTheme();
    const [locationQuery, setLocationQuery] = useState('');

    const themeIcon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor;
    const ThemeIcon = themeIcon;

    const cycleTheme = () => {
        const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const handleLocationSearch = () => {
        if (locationQuery.trim()) {
            onSearchLocation(locationQuery.trim());
            setLocationQuery('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLocationSearch();
        }
    };

    const formatLastFetch = (date: Date | null) => {
        if (!date) return null;
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'just now';
        if (diffMins === 1) return '1 min ago';
        if (diffMins < 60) return `${diffMins} mins ago`;
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const daysInForecast = Math.ceil(hoursReturned / 24);

    return (
        <header className="glass text-white p-4 shadow-xl shrink-0 z-10 sticky top-0">
            <div className="max-w-7xl mx-auto flex flex-col gap-4">
                {/* Top Row: Logo & Main Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Logo & Info */}
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg">
                            <CloudRain className="text-white" size={26} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                                Ice Storm Monitor
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-blue-200 flex-wrap mt-0.5">
                                <span className="bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-700/50 flex items-center gap-1.5">
                                    <MapPin size={10} />
                                    {location.name}
                                </span>
                                {hoursReturned > 0 && (
                                    <>
                                        <span className="text-blue-400">•</span>
                                        <span className="text-blue-300">{daysInForecast}-Day / {hoursReturned}h Forecast</span>
                                    </>
                                )}
                                {metrics.dateRange && (
                                    <>
                                        <span className="text-blue-400">•</span>
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <Calendar size={10} /> {metrics.dateRange}
                                        </span>
                                    </>
                                )}
                                {isDemoData && (
                                    <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30 text-xs font-semibold uppercase tracking-wider">
                                        Demo
                                    </span>
                                )}
                                {isCached && !isDemoData && (
                                    <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                                        <Clock size={10} />
                                        Cached
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Last Fetch Time */}
                        {lastFetchTime && !isDemoData && (
                            <span className="text-xs text-slate-400 hidden sm:block">
                                Updated {formatLastFetch(lastFetchTime)}
                            </span>
                        )}

                        {/* API Key Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={14} className="text-slate-500" />
                            </div>
                            <input
                                type="password"
                                placeholder="API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="bg-slate-800/80 border border-slate-700 text-sm text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-32 transition-all placeholder:text-slate-500"
                            />
                        </div>

                        {/* CSV Export Button */}
                        {hasData && (
                            <>
                                <button
                                    onClick={() => { console.log('CSV button clicked'); onExportCSV(); }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                                    title="Download CSV"
                                    aria-label="Download CSV"
                                >
                                    <Download size={14} />
                                    <span className="hidden sm:inline">CSV</span>
                                </button>
                                <button
                                    onClick={() => { console.log('JSON button clicked'); onExportJSON(); }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                                    title="Download JSON"
                                    aria-label="Download JSON"
                                >
                                    <FileJson size={14} />
                                    <span className="hidden sm:inline">JSON</span>
                                </button>
                            </>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={cycleTheme}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                            title={`Theme: ${theme}`}
                            aria-label={`Switch to ${theme === 'dark' ? 'system' : theme === 'light' ? 'dark' : 'light'} theme`}
                        >
                            <ThemeIcon size={14} />
                        </button>

                        {/* Refresh Button */}
                        <button
                            onClick={() => onRefresh(true)}
                            disabled={loading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${loading
                                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25'
                                }`}
                            title={isCached ? 'Force refresh from API' : 'Refresh forecast'}
                            aria-label="Refresh forecast"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Location Search */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Location Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {searchingLocation ? (
                                <Loader2 size={14} className="text-blue-400 animate-spin" />
                            ) : (
                                <Search size={14} className="text-slate-500" />
                            )}
                        </div>
                        <input
                            type="text"
                            placeholder="Enter zip code, city, or address..."
                            value={locationQuery}
                            onChange={(e) => setLocationQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={searchingLocation}
                            className="w-full bg-slate-800/80 border border-slate-700 text-sm text-white rounded-lg pl-9 pr-20 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 disabled:opacity-50"
                        />
                        <button
                            onClick={handleLocationSearch}
                            disabled={searchingLocation || !locationQuery.trim()}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                        >
                            Search
                        </button>
                    </div>

                    {/* GPS Button */}
                    <button
                        onClick={onGeolocate}
                        disabled={geolocating}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 disabled:opacity-50"
                        title="Use current location"
                    >
                        <Navigation size={14} className={geolocating ? 'animate-pulse text-blue-400' : ''} />
                        <span>{geolocating ? 'Locating...' : 'Use My Location'}</span>
                    </button>

                    {/* Coordinates Display */}
                    <span className="text-xs text-slate-500 hidden md:block">
                        {location.lat}, {location.lon}
                    </span>
                </div>
            </div>
        </header>
    );
}
