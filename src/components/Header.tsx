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
        <div className="flex flex-col shrink-0">
            {/* Fixed Top Section: Branding & Status */}
            <div className="sticky top-0 z-50 bg-slate-900 shadow-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg shrink-0">
                            <CloudRain className="text-white" size={26} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent truncate">
                                Ice Storm Monitor
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-blue-200 flex-wrap mt-0.5">
                                {location.name && (
                                    <span className="bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-700/50 flex items-center gap-1.5 whitespace-nowrap">
                                        <MapPin size={10} />
                                        {location.name}
                                    </span>
                                )}
                                {hoursReturned > 0 && (
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                        <span className="text-blue-400">•</span>
                                        <span className="text-blue-300 hidden sm:inline">{daysInForecast}-Day / {hoursReturned}h Forecast</span>
                                        <span className="text-blue-300 sm:hidden">{daysInForecast}d / {hoursReturned}h</span>
                                    </span>
                                )}
                                {metrics.dateRange && (
                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                        <span className="text-blue-400">•</span>
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <Calendar size={10} /> {metrics.dateRange}
                                        </span>
                                    </span>
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
                </div>
            </div>

            {/* Scrolling Bottom Section: Controls */}
            <div className="bg-slate-900 border-b border-slate-800/50 shadow-xl">
                <div className="max-w-7xl mx-auto p-4 pt-2">
                    <div className="flex flex-col gap-4">
                        {/* Status Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Last Fetch Time */}
                            {lastFetchTime && !isDemoData ? (
                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                    <Clock size={12} />
                                    Updated {formatLastFetch(lastFetchTime)}
                                </div>
                            ) : <div></div>} {/* Spacer */}

                            {/* Main Controls Row */}
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                {/* API Key Input */}
                                <div className="relative flex-1 min-w-[140px]">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                        <Lock size={13} className="text-slate-500" />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="API Key"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {hasData && (
                                        <>
                                            <button
                                                onClick={onExportCSV}
                                                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-800 border border-slate-700 bg-slate-900 transition-colors"
                                                title="Download CSV"
                                                aria-label="Download CSV"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                onClick={onExportJSON}
                                                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-800 border border-slate-700 bg-slate-900 transition-colors"
                                                title="Download JSON"
                                                aria-label="Download JSON"
                                            >
                                                <FileJson size={14} />
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={cycleTheme}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:bg-slate-800 border border-slate-700 bg-slate-900 transition-colors"
                                        title={`Theme: ${theme}`}
                                    >
                                        <ThemeIcon size={14} />
                                    </button>

                                    <button
                                        onClick={() => onRefresh(true)}
                                        disabled={loading}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                            ${loading
                                                ? 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                            }`}
                                    >
                                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                        <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Location Search Bar - Full Width on Mobile, Auto on Desktop if needed, but here full width looks good for accessibility */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
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
                                    className="w-full bg-slate-800/50 border border-slate-700 text-sm text-white rounded-lg pl-9 pr-20 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                                />
                                <button
                                    onClick={handleLocationSearch}
                                    disabled={searchingLocation || !locationQuery.trim()}
                                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    Search
                                </button>
                            </div>

                            <button
                                onClick={onGeolocate}
                                disabled={geolocating}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition-all border border-slate-700 whitespace-nowrap"
                            >
                                <Navigation size={14} className={geolocating ? 'animate-pulse text-blue-400' : ''} />
                                <span className="hidden sm:inline">{geolocating ? 'Locating...' : 'Use My Location'}</span>
                                <span className="sm:hidden">GPS</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
