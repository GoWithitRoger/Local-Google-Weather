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
        <div className="space-y-4">


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* CARD 1: POWER RISK */}
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

                {/* CARD 2: ICE ACCRETION - Road vs Wire with Burnoff Sparkline */}
                <div className="card p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '100ms' }}>
                    <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
                        {/* Sparkline shows tracked road ice depth with burnoff */}
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <Area type="monotone" dataKey="roadIceDepth" stroke="#3b82f6" fill="#3b82f6" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Droplets size={14} className="text-blue-500" />
                            Ice Accretion
                        </h3>

                        <div className="mt-2 text-xs space-y-2">
                            {/* Road Ice (flat surface from API) */}
                            <div className="border-b border-slate-100 dark:border-slate-700 pb-2">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500">Road Ice (Flat):</span>
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {metrics.totalIce.toFixed(2)}"
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">API model • sparkline shows burnoff</p>
                            </div>

                            {/* Radial Wire Accretion (Makkonen model) */}
                            <div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500">Radial Wire:</span>
                                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                        {metrics.totalRadialWireIce.toFixed(2)}"
                                    </span>
                                </div>
                                <p className={`text-[10px] mt-0.5 font-medium ${metrics.totalRadialWireIce >= 0.50
                                    ? 'text-red-600 dark:text-red-400'
                                    : metrics.totalRadialWireIce >= 0.25
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                    {metrics.totalRadialWireIce >= 0.50
                                        ? '⚠️ NWS Ice Storm Warning'
                                        : metrics.totalRadialWireIce >= 0.25
                                            ? '⚠️ Significant Risk'
                                            : '✓ Low risk'}
                                </p>
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

                {/* CARD 4: SNOW - New Snow + Tracked Depth with Melt Sparkline */}
                {metrics.snowAccumulation > 0 || metrics.maxSnowDepth > 0 ? (
                    <div className="card p-4 animate-fade-in relative overflow-hidden" style={{ animationDelay: '200ms' }}>
                        <div className="absolute inset-x-0 bottom-0 h-16 opacity-20 pointer-events-none">
                            {/* Sparkline shows tracked snow depth with melt applied */}
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <Area type="monotone" dataKey="snowDepth" stroke="#06b6d4" fill="#06b6d4" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Snowflake size={14} className="text-cyan-500" />
                                Snow Cover
                            </h3>

                            <div className="mt-2 text-xs space-y-1.5">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500">New Snow:</span>
                                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                        {metrics.snowAccumulation.toFixed(1)}"
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline border-t border-slate-100 dark:border-slate-700 pt-1.5">
                                    <span className="text-slate-500">Max Depth:</span>
                                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300 text-lg">
                                        {metrics.maxSnowDepth.toFixed(1)}"
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Sparkline tracks melt + compaction
                            </p>
                        </div>
                    </div>
                ) : (
                    /* CARD 4 ALT: TEMP RANGE (Fallback when no snow) */
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


            </div>
        </div>
    );
}

