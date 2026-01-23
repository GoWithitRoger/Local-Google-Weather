import { AlertTriangle, PlayCircle, ExternalLink } from 'lucide-react';

interface ErrorDisplayProps {
    error: string;
    onLoadDemo: () => void;
}

export function ErrorDisplay({ error, onLoadDemo }: ErrorDisplayProps) {
    return (
        <div className="card border-l-4 border-l-red-500 p-6 animate-fade-in">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                    <AlertTriangle className="text-red-500" size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-red-800 dark:text-red-200 text-lg">Connection Failed</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>

                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
                            Troubleshooting
                        </h4>
                        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400">1.</span>
                                Ensure the "Weather API" is enabled in Google Cloud Console
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400">2.</span>
                                Check that your API key has no IP restrictions blocking this domain
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400">3.</span>
                                Verify billing is enabled on your Google Cloud project
                            </li>
                        </ul>
                        <a
                            href="https://console.cloud.google.com/apis/library/weather.googleapis.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-3 font-medium"
                        >
                            <ExternalLink size={14} />
                            Open Google Cloud Console
                        </a>
                    </div>

                    <button
                        onClick={onLoadDemo}
                        className="mt-4 flex items-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                        <PlayCircle size={18} />
                        Load Demo Data Instead
                    </button>
                </div>
            </div>
        </div>
    );
}
