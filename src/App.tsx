import { useState } from 'react';
import { calculateMetrics } from '@/utils';
import { useWeatherData } from '@/hooks/useWeatherData';
import {
    Header,
    KpiCards,
    AlertsPanel,
    RiskCharts,
    DataTable,
    ErrorDisplay,
    RawDataInspector,
    EmptyState,
} from '@/components';
import type { TabOption } from '@/types';

export default function App() {
    // API Key state - reads from env or empty
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_WEATHER_API_KEY || '');

    // Active tab state
    const [activeTab, setActiveTab] = useState<TabOption>('dashboard');

    // Raw data inspector toggle
    const [showRawData, setShowRawData] = useState(false);

    // Weather data hook
    const {
        chartData,
        alerts,
        rawData,
        loading,
        error,
        isDemoData,
        isCached,
        lastFetchTime,
        location,
        searchLocation,
        searchingLocation,
        fetchWeather,
        loadDemoData,
        useCurrentLocation,
        exportCSV,
        exportJSON,
        geolocating,
    } = useWeatherData(apiKey);

    const hasData = chartData.length > 0;

    // FORECAST LENGTH CONTROL
    // Default to 5 days, allow 1-10
    const [forecastDays, setForecastDays] = useState(5);

    // Slice data based on selected duration
    const displayedData = chartData.slice(0, forecastDays * 24);
    const displayedHours = displayedData.length;

    // Recalculate metrics for the specific slice
    // We need to import calculateMetrics if not already available in scope from useWeatherData 
    // BUT useWeatherData returns calculated metrics for the WHOLE set.
    // We should probably recalculate for the displayed set to make the KPIs accurate to the view.
    // Since calculateMetrics is imported in useWeatherData from @/utils, let's import it here too.
    // Wait, I need to check imports.
    // ... Actually, I'll update the imports in a separate Edit if needed, but for now assuming I can add it.
    // Let's check imports first in next step or assume I need to add it.
    // The previous view_file showed `import { ... } from '@/components';` and `import { useWeatherData } from ...`
    // I need to add `calculateMetrics` to imports. 

    // Let's do the slicing logic now.

    const displayedMetrics = calculateMetrics(displayedData);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Header */}
            <Header
                apiKey={apiKey}
                setApiKey={setApiKey}
                location={location}
                metrics={displayedMetrics}
                loading={loading}
                geolocating={geolocating}
                isDemoData={isDemoData}
                isCached={isCached}
                lastFetchTime={lastFetchTime}
                hasData={hasData}
                hoursReturned={displayedHours}
                searchingLocation={searchingLocation}
                onRefresh={fetchWeather}
                onGeolocate={useCurrentLocation}
                onExportCSV={exportCSV}
                onExportJSON={exportJSON}
                onSearchLocation={searchLocation}
            />

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Error State */}
                    {error && (
                        <ErrorDisplay error={error} onLoadDemo={loadDemoData} />
                    )}

                    {/* Empty/Loading State */}
                    {!hasData && !error && (
                        <EmptyState
                            loading={loading}
                            onLoadDemo={loadDemoData}
                            onGeolocate={useCurrentLocation}
                            isLocating={geolocating}
                        />
                    )}

                    {/* Main Dashboard */}
                    {hasData && (
                        <>
                            {/* KPI Cards */}
                            <KpiCards metrics={displayedMetrics} data={displayedData} />

                            {/* Charts & Alerts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Charts Section - Takes 2 columns */}
                                <div className="lg:col-span-2 card overflow-hidden flex flex-col h-[600px]">
                                    {/* Tabs & Controls */}
                                    <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                        <div
                                            role="tablist"
                                            aria-label="View selection"
                                            className="flex flex-1"
                                        >
                                            <button
                                                role="tab"
                                                aria-selected={activeTab === 'dashboard'}
                                                aria-controls="panel-dashboard"
                                                id="tab-dashboard"
                                                onClick={() => setActiveTab('dashboard')}
                                                className={`px-6 py-4 text-sm font-bold transition-all border-b-2 flex-1 sm:flex-none ${activeTab === 'dashboard'
                                                    ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800'
                                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                Risk Visualizer
                                            </button>
                                            <button
                                                role="tab"
                                                aria-selected={activeTab === 'details'}
                                                aria-controls="panel-details"
                                                id="tab-details"
                                                onClick={() => setActiveTab('details')}
                                                className={`px-6 py-4 text-sm font-bold transition-all border-b-2 flex-1 sm:flex-none ${activeTab === 'details'
                                                    ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800'
                                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                    }`}
                                            >
                                                Hourly Data
                                            </button>
                                        </div>

                                        {/* Forecast Length Control */}
                                        <div className="flex items-center px-4 py-3 sm:py-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sm:bg-transparent">
                                            <label htmlFor="forecast-days" className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-3 whitespace-nowrap">
                                                Forecast Length:
                                            </label>
                                            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600">
                                                <button
                                                    onClick={() => setForecastDays(Math.max(1, forecastDays - 1))}
                                                    disabled={forecastDays <= 1}
                                                    className="w-8 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    aria-label="Decrease days"
                                                >
                                                    -
                                                </button>
                                                <span className="w-12 text-center text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                                    {forecastDays}d
                                                </span>
                                                <button
                                                    onClick={() => setForecastDays(Math.min(5, forecastDays + 1))}
                                                    disabled={forecastDays >= 5}
                                                    className="w-8 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    aria-label="Increase days"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tab Content */}
                                    <div
                                        className="p-6 flex-1 overflow-hidden"
                                        role="tabpanel"
                                        id={`panel-${activeTab}`}
                                        aria-labelledby={`tab-${activeTab}`}
                                    >
                                        {activeTab === 'dashboard' ? (
                                            <RiskCharts data={displayedData} />
                                        ) : (
                                            <DataTable data={displayedData} />
                                        )}
                                    </div>
                                </div>

                                {/* Alerts Panel - Takes 1 column */}
                                <div className="lg:col-span-1">
                                    <AlertsPanel alerts={alerts} />
                                </div>
                            </div>

                            {/* Raw Data Inspector */}
                            {rawData && (
                                <RawDataInspector
                                    data={rawData}
                                    show={showRawData}
                                    onToggle={() => setShowRawData(!showRawData)}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-700 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-500">
                <p>
                    Powered by <span className="font-semibold">Google Weather API</span> •
                    Data cached for 15 min to reduce API costs •
                    Search by zip code, city, or address
                </p>
            </footer>
        </div>
    );
}
