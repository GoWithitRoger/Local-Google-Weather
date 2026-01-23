import {
    ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Bar, Area, ReferenceLine, Legend, ReferenceArea
} from 'recharts';
import { ShieldAlert, Wind } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { CHART_MARGINS } from '@/constants';
import type { ChartDataPoint } from '@/types';


interface RiskChartsProps {
    data: ChartDataPoint[];
}

export function RiskCharts({ data }: RiskChartsProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const gridColor = isDark ? '#334155' : '#f1f5f9';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Create a derived data array for the chart
    const chartData = data.map(d => ({
        ...d,
        // Display whichever is higher: The API's forecast or our thermodynamic calculation
        displayIce: Math.max(d.iceThickness, d.provisionalIce),
        // Fix for double counting: If type is SNOW, don't show precipAmount as Rain
        rainAmount: (d.precipType === 'SNOW') ? 0 : d.precipAmount
    }));

    // Find distinct days for background shading
    const days: { start: string, end: string, label: string }[] = [];
    let currentDayStr = '';

    chartData.forEach((d, i) => {
        const dayStr = d.fullDayLabel;
        if (dayStr !== currentDayStr) {
            if (currentDayStr && days.length > 0) {
                days[days.length - 1].end = data[i - 1].label;
            }
            days.push({ start: d.label, end: d.label, label: dayStr }); // End will be updated
            currentDayStr = dayStr;
        }
    });
    // Close the last day
    if (days.length > 0) {
        days[days.length - 1].end = data[data.length - 1].label;
    }
    const maxPrecip = Math.max(...chartData.map(d =>
        (d.rainAmount || 0) + (d.snowAccumulation || 0) + (d.displayIce || 0)
    ));
    // Determine integer max height (at least 1, otherwise ceil of max value)
    const yAxisMax = Math.max(1, Math.ceil(maxPrecip));

    // Generate ticks at 0.5 intervals
    const precipTicks = [];
    for (let i = 0; i <= yAxisMax; i += 0.5) {
        precipTicks.push(i);
    }

    return (
        <div className="h-full flex flex-col gap-6">
            {/* CHART: Combined Risk & Ice */}
            <div className="flex-1 min-h-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-orange-500" />
                        Outage Risk & Precipitation
                    </h4>
                    <div className="flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-red-400/60 rounded-sm" />
                            Risk Index
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                            Ice Accretion (in)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-purple-500 rounded-sm" />
                            Snowfall (in)
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                            Rain (in)
                        </div>
                    </div>
                </div>

                <div
                    role="img"
                    aria-label="Combined chart showing outage risk percentage and ice accumulation over time"
                    className="h-[90%]"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={CHART_MARGINS}>
                            <defs>
                                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorIce" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4} />
                                </linearGradient>
                                <linearGradient id="colorSnow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.4} />
                                </linearGradient>
                                <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>

                            {/* Day Backgrounds */}
                            {days.map((day, index) => (
                                index % 2 === 0 ? (
                                    <ReferenceArea
                                        key={day.label}
                                        x1={day.start}
                                        x2={day.end}
                                        yAxisId="left"
                                        fill={isDark ? '#334155' : '#e2e8f0'}
                                        fillOpacity={0.15}
                                    />
                                ) : null
                            ))}

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis
                                dataKey="label"
                                interval={11}
                                tick={{ fontSize: 11, fill: textColor }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 11, fill: textColor }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => value.toFixed(1)}
                                type="number"
                                domain={[0, yAxisMax]}
                                ticks={precipTicks}
                                width={45}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: '#ef4444' }}
                                axisLine={false}
                                tickLine={false}
                                unit="%"
                                width={40}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                labelStyle={{
                                    color: textColor,
                                    marginBottom: '0.5rem',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                }}
                            />
                            {/* Removed dashed threshold line as requested */}

                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="riskScore"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fill="url(#colorRisk)"
                                name="Outage Risk %"
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="displayIce"
                                barSize={6}
                                fill="url(#colorIce)"
                                radius={[3, 3, 0, 0]}
                                name="Est. Ice (in)"
                                stackId="precip"
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="snowAccumulation"
                                barSize={6}
                                fill="url(#colorSnow)"
                                radius={[3, 3, 0, 0]}
                                name="Snowfall (in)"
                                stackId="precip"
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="rainAmount"
                                barSize={6}
                                fill="url(#colorRain)"
                                radius={[3, 3, 0, 0]}
                                name="Rain (in)"
                                stackId="precip"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART: Wind & Temp */}
            <div className="h-44 shrink-0 border-t border-slate-100 dark:border-slate-700 pt-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Wind size={14} />
                    Temperature & Wind Gusts
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={CHART_MARGINS}>
                        {/* Day Backgrounds */}
                        {days.map((day, index) => (
                            index % 2 === 0 ? (
                                <ReferenceArea
                                    key={day.label}
                                    x1={day.start}
                                    x2={day.end}
                                    yAxisId="temp"
                                    fill={isDark ? '#334155' : '#e2e8f0'}
                                    fillOpacity={0.15}
                                />
                            ) : null
                        ))}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="label" hide />
                        <YAxis
                            yAxisId="temp"
                            domain={['auto', 'auto']}
                            tick={{ fontSize: 10, fill: textColor }}
                            axisLine={false}
                            tickLine={false}
                            unit="°"
                            width={35}
                        />
                        <YAxis
                            yAxisId="wind"
                            orientation="right"
                            tick={{ fontSize: 10, fill: textColor }}
                            axisLine={false}
                            tickLine={false}
                            unit=" mph"
                            width={40}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            }}
                            labelStyle={{ color: textColor, fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <ReferenceLine yAxisId="temp" y={32} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.7} label={{ value: '32°F', position: 'left', fontSize: 10, fill: '#3b82f6' }} />

                        <Legend verticalAlign="top" height={36} />
                        <Line
                            yAxisId="temp"
                            type="monotone"
                            dataKey="temp"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={false}
                            name="Temp (°F)"
                        />
                        <Line
                            yAxisId="wind"
                            type="monotone"
                            dataKey="windGust"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="4 4"
                            name="Gusts (mph)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
