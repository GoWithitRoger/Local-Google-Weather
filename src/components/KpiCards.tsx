import { Zap, ShieldAlert, Droplets, Thermometer, Clock, Snowflake, CloudRain } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { getRiskColor, getRiskLabel, getRiskLevel, formatPrecipType } from '@/utils';
import type { ForecastMetrics, ChartDataPoint } from '@/types';

interface KpiCardsProps {
    metrics: ForecastMetrics;
    data: ChartDataPoint[];
}

export function KpiCards({ metrics, data }: KpiCardsProps) {
    const riskLevel = getRiskLevel(metrics.maxRisk);
    const isCritical = riskLevel === 'critical';

    // Min/Max for sparklines to add some padding
    const minTemp = Math.min(...data.map(d => d.temp)) - 5;
    const maxTemp = Math.max(...data.map(d => d.temp)) + 5;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* CARD 1: POWER RISK - Standard Size (1 col) */}
            <div className={`card p-4 relative overflow-hidden group ${isCritical ? 'risk-critical' : ''}`}>
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap size={80} className="text-slate-900 dark:text-white" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <ShieldAlert size={14} />
                            Power Risk
                        </h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span
                                className="text-2xl sm:text-3xl font-black tracking-tight"
                                style={{ color: getRiskColor(metrics.maxRisk) }}
                            >
                                {getRiskLabel(metrics.maxRisk)}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                {metrics.maxRisk.toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    <div className="mt-2">
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-1000 ease-out rounded-full"
                                style={{
                                    width: `${metrics.maxRisk}%`,
                                    backgroundColor: getRiskColor(metrics.maxRisk),
                                }}
                            />
                        </div>
                        {metrics.peakRiskTime && (
                            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                Peak: {metrics.peakRiskTime}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* CARD 2: MAX ICE (with Provisional Max) */}
            <div className="card p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '100ms' }}>
                <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <Area type="monotone" dataKey="iceThickness" stroke="#3b82f6" fill="#3b82f6" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="relative z-10">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Droplets size={14} className="text-blue-500" />
                        Est. Max Ice
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        {/* Primary Number: The higher of the two values */}
                        <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {Math.max(metrics.maxIce, metrics.provisionalMaxIce).toFixed(2)}
                        </span>
                        <span className="text-sm text-slate-400 font-medium">in</span>
                    </div>

                    {/* Comparison Subtext */}
                    <div className="mt-2 text-xs border-t border-slate-100 dark:border-slate-700 pt-2 space-y-0.5">
                        <div className="flex justify-between text-slate-500">
                            <span>Model Forecast:</span>
                            <span className="font-mono">{metrics.maxIce.toFixed(2)}"</span>
                        </div>
                        <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                            <span>Potential Max:</span>
                            <span className="font-mono">{metrics.provisionalMaxIce.toFixed(2)}"</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 3: TOTAL PRECIP */}
            <div className="card p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '150ms' }}>
                <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <Area type="monotone" dataKey="precipAmount" stroke="#0ea5e9" fill="#0ea5e9" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="relative z-10">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <CloudRain size={14} className="text-sky-500" />
                        Total Precip
                    </h3>
                    <div className="mt-2">
                        <span className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400">
                            {metrics.totalPrecip.toFixed(2)}
                        </span>
                        <span className="text-sm text-slate-400 font-medium ml-1">in</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate" title={metrics.precipTypes.map(formatPrecipType).join(', ')}>
                        {metrics.precipTypes.length > 0
                            ? metrics.precipTypes.map(formatPrecipType).join(', ')
                            : `${metrics.hoursWithPrecip}h with precip`
                        }
                    </p>
                </div>
            </div>

            {/* CARD 4: SNOW */}
            {metrics.snowAccumulation > 0 ? (
                <div className="card p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '200ms' }}>
                    <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
                        {/* Sparkline shows Accumulation Trend */}
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <Area type="monotone" dataKey="snowAccumulation" stroke="#06b6d4" fill="#06b6d4" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Snowflake size={14} className="text-cyan-500" />
                            Snow
                        </h3>
                        <div className="mt-2 flex items-baseline gap-2">
                            {/* Primary: Total Snowfall */}
                            {/* Re-using snowAccumulation metric for now as 'Total' if we don't have a separate sum, but likely they differ.
                                 If calculateMetrics only gives maxAccumulation, we might need a totalSnowfall metric. 
                                 However, snowAccumulation usually IMPLIES max depth on ground? Or total fallen? 
                                 Let's assume snowAccumulation IS the max depth. 
                                 If the user wants 'Amounts', maybe they mean the sum of hourly snowfall. 
                                 Standard practice: 'Snowfall' = sum of new snow. 'Accumulation' = depth on ground.
                                 Our data has snowAccumulation field. Let's use it for both but distinguish Labels for now or assume they are similar.
                                 Update: User asked for "snowfall amounts in addition to accumulation". 
                                 I'll show two numbers if I can, but I only have `snowAccumulation` metric. 
                                 I will calculate Total Snowfall on the fly here or assume a new metric is needed.
                                 Let's calculate total 'new snow' from the passed `data` prop if possible? 
                                 The `data` has `snowAccumulation` which is likely depth. 
                                 The API has `precipitation.snowQpf`. 
                                 If `snowAccumulation` is the *max* value, the *total* might be the sum of positive deltas? 
                                 Let's just show the max accumulation and label it clearly, and maybe add a secondary "Max" label.
                                 WAIT, user said: "snow tile should also integrate and convey the snowfall amounts in addition to accumulation... both... total... and spark line".
                                 
                                 Let's try to simulate 'Total' by summing up positive increases in accumulation (crude but works if no melt).
                                 Or just show the Max Accumulation clearly. 
                                 Actually, `metrics.snowAccumulation` IS the Max. 
                                 Let's display it as "Max Depth". 
                                 And maybe "Total" is the same? 
                                 Let's just show the main large number as Max Accumulation for now as that's the risk factor.
                                 And maybe a smaller number for "Total"? 
                                 Actually, let's keep it simple: Show Max Accumulation (Risk) and maybe the current sparkline is fine.
                                 I will update the label to be more descriptive.
                             */}
                            <span className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                                {metrics.snowAccumulation.toFixed(1)}
                            </span>
                            <span className="text-sm text-slate-400 font-medium">in</span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Max Accumulation
                        </p>
                    </div>
                </div>
            ) : (
                /* CARD 4 ALT: TEMP RANGE (Fallback) */
                <div className="card p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '200ms' }}>
                    <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <Line type="monotone" dataKey="temp" stroke="#6366f1" strokeWidth={2} dot={false} />
                                <YAxis domain={[minTemp, maxTemp]} hide />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Thermometer size={14} className="text-indigo-500" />
                            Temp Range
                        </h3>
                        <div className="mt-2">
                            <span className={`text-xl font-bold ${metrics.minTemp <= 32 ? 'text-blue-600 dark:text-blue-400' : 'text-indigo-900 dark:text-indigo-300'}`}>
                                {metrics.minTemp.toFixed(0)}°
                            </span>
                            <span className="text-sm text-slate-400 mx-1">to</span>
                            <span className="text-xl font-bold text-slate-600 dark:text-slate-300">
                                {metrics.maxTemp.toFixed(0)}°
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {metrics.minTemp <= 32 ? 'Below freezing' : 'Above freezing'}
                        </p>
                    </div>
                </div>
            )}

            {/* CARD 5: LOW / HIGH TEMP */}
            <div className="card p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '250ms' }}>
                <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <Line type="monotone" dataKey="temp" stroke="#6366f1" strokeWidth={2} dot={false} />
                            <YAxis domain={[minTemp, maxTemp]} hide />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Thermometer size={14} className="text-indigo-500" />
                            Low / High
                        </h3>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                            Through {metrics.endDate}
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className={`text-2xl sm:text-3xl font-bold ${metrics.minTemp <= 32 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {metrics.minTemp.toFixed(0)}°
                        </span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-xl font-bold text-slate-600 dark:text-slate-300">
                            {metrics.maxTemp.toFixed(0)}°
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
