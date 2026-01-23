import { Code } from 'lucide-react';
import type { WeatherApiResponse } from '@/types';

interface RawDataInspectorProps {
    data: WeatherApiResponse;
    show: boolean;
    onToggle: () => void;
}

export function RawDataInspector({ data, show, onToggle }: RawDataInspectorProps) {
    return (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-3"
            >
                <Code size={14} />
                {show ? 'Hide' : 'Show'} Raw Data Inspector
            </button>

            {show && (
                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-auto max-h-80 shadow-inner animate-fade-in">
                    <p className="text-slate-500 mb-3 border-b border-slate-700 pb-2">
            // First hour of API response (verify field structure):
                    </p>
                    <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(data.forecastHours ? data.forecastHours[0] : data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
