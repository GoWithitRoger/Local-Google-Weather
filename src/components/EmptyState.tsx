import { RefreshCw, PlayCircle, CloudOff, MapPin } from 'lucide-react';

interface EmptyStateProps {
    loading: boolean;
    onLoadDemo: () => void;
    onGeolocate: () => void;
    isLocating: boolean;
}

export function EmptyState({ loading, onLoadDemo, onGeolocate, isLocating }: EmptyStateProps) {
    if (loading) {
        return (
            <div className="text-center py-20 animate-fade-in">
                <div className="inline-flex bg-blue-100 dark:bg-blue-900/30 p-5 rounded-full mb-4">
                    <RefreshCw className="text-blue-500 animate-spin" size={40} />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                    Loading Forecast Data...
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Connecting to Google Weather API
                </p>
            </div>
        );
    }

    return (
        <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-5 rounded-full mb-4">
                <CloudOff className="text-slate-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                No Weather Data
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto mb-8">
                Search for a location above, or use your current location to see the forecast.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={onGeolocate}
                    disabled={isLocating}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLocating ? (
                        <RefreshCw size={18} className="animate-spin" />
                    ) : (
                        <MapPin size={18} />
                    )}
                    {isLocating ? 'Locating...' : 'Use My Location'}
                </button>

                <div className="text-slate-400 text-sm font-medium px-2">or</div>

                <button
                    onClick={onLoadDemo}
                    className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-lg text-sm font-bold transition-all"
                >
                    <PlayCircle size={18} />
                    Load Demo Data
                </button>
            </div>
        </div>
    );
}
