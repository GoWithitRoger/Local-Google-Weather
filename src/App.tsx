import { useState } from 'react';
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
        metrics,
        alerts,
        rawData,
        loading,
        error,
        isDemoData,
        isCached,
        lastFetchTime,
        hoursReturned,
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
    const daysInForecast = Math.ceil(hoursReturned / 24);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
            {/* Header */}
            <Header
                apiKey={apiKey}
                setApiKey={setApiKey}
                location={location}
                metrics={metrics}
                loading={loading}
                geolocating={geolocating}
                isDemoData={isDemoData}
                isCached={isCached}
                lastFetchTime={lastFetchTime}
                hasData={hasData}
                hoursReturned={hoursReturned}
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
                            <KpiCards metrics={metrics} data={chartData} />

                            {/* Charts & Alerts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Charts Section - Takes 2 columns */}
                                <div className="lg:col-span-2 card overflow-hidden flex flex-col h-[600px]">
                                    {/* Tabs */}
                                    <div
                                        role="tablist"
                                        aria-label="View selection"
                                        className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                                    >
                                        <button
                                            role="tab"
                                            aria-selected={activeTab === 'dashboard'}
                                            aria-controls="panel-dashboard"
                                            id="tab-dashboard"
                                            onClick={() => setActiveTab('dashboard')}
                                            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'dashboard'
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
                                            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'details'
                                                ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            Hourly Data ({hoursReturned}h / {daysInForecast}d)
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    <div
                                        className="p-6 flex-1 overflow-hidden"
                                        role="tabpanel"
                                        id={`panel-${activeTab}`}
                                        aria-labelledby={`tab-${activeTab}`}
                                    >
                                        {activeTab === 'dashboard' ? (
                                            <RiskCharts data={chartData} />
                                        ) : (
                                            <DataTable data={chartData} />
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
