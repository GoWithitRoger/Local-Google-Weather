import { AlertTriangle, Info, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import type { WeatherAlert } from '@/types';

interface AlertsPanelProps {
    alerts: WeatherAlert[];
}

const severityConfig = {
    info: {
        icon: Info,
        bgClass: 'bg-blue-50 dark:bg-blue-900/20',
        borderClass: 'border-blue-200 dark:border-blue-800',
        iconClass: 'text-blue-500',
        titleClass: 'text-blue-800 dark:text-blue-200',
        textClass: 'text-blue-700 dark:text-blue-300',
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-amber-50 dark:bg-amber-900/20',
        borderClass: 'border-amber-200 dark:border-amber-800',
        iconClass: 'text-amber-500',
        titleClass: 'text-amber-800 dark:text-amber-200',
        textClass: 'text-amber-700 dark:text-amber-300',
    },
    danger: {
        icon: AlertCircle,
        bgClass: 'bg-red-50 dark:bg-red-900/20',
        borderClass: 'border-red-200 dark:border-red-800',
        iconClass: 'text-red-500',
        titleClass: 'text-red-800 dark:text-red-200',
        textClass: 'text-red-700 dark:text-red-300',
    },
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));

    const dismissAlert = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
    };

    if (visibleAlerts.length === 0) {
        return (
            <div className="card p-6 text-center animate-fade-in">
                <div className="inline-flex bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full mb-3">
                    <Info className="text-emerald-600 dark:text-emerald-400" size={24} />
                </div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">No Active Alerts</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Weather conditions are within normal parameters.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 animate-fade-in">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Condition Flags ({visibleAlerts.length})
            </h3>

            {visibleAlerts.map((alert, index) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;

                return (
                    <div
                        key={alert.id}
                        className={`${config.bgClass} ${config.borderClass} border rounded-lg p-4 animate-slide-up relative group`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <button
                            onClick={() => dismissAlert(alert.id)}
                            className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                            aria-label="Dismiss alert"
                        >
                            <X size={14} className="text-slate-500" />
                        </button>

                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.bgClass}`}>
                                <Icon className={config.iconClass} size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-semibold ${config.titleClass}`}>
                                    {alert.title}
                                </h4>
                                <p className={`text-sm mt-1 ${config.textClass}`}>
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
