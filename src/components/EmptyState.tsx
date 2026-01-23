import { RefreshCw, PlayCircle, CloudOff } from 'lucide-react';

interface EmptyStateProps {
    loading: boolean;
    onLoadDemo: () => void;
}

export function EmptyState({ loading, onLoadDemo }: EmptyStateProps) {
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
                    Connecting to WeatherNext AI
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
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Enter your Google Weather API key to fetch real-time forecast data, or try the demo.
            </p>
            <button
                onClick={onLoadDemo}
                className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/25"
            >
                <PlayCircle size={18} />
                Load Demo Data
            </button>
        </div>
    );
}
