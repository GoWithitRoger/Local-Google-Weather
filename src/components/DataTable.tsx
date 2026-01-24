import { getRiskColor, formatIce, formatPrecipType } from '@/utils';
import type { ChartDataPoint } from '@/types';

interface DataTableProps {
    data: ChartDataPoint[];
}

export function DataTable({ data }: DataTableProps) {
    return (
        <div className="h-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-sm text-left data-table">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800">
                    <tr>
                        <th scope="col" className="px-3 py-3 font-semibold sticky left-0 bg-slate-100 dark:bg-slate-800 z-20">Time</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Temp</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Feels</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Humidity</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Precip</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Type</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Ice</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Radial Ice</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Snow</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Snow Depth</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Wind</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Gusts</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Clouds</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Condition</th>
                        <th scope="col" className="px-3 py-3 font-semibold">Risk</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800/50">
                    {data.map((row, i) => (
                        <tr
                            key={i}
                            className={`transition-colors ${row.iceThickness > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                } ${row.riskScore >= 70 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                        >
                            <td className="px-3 py-2 sticky left-0 bg-white dark:bg-slate-800 z-10">
                                <div className="font-bold text-slate-700 dark:text-slate-200">{row.dayLabel}</div>
                                <div className="text-xs text-slate-400 dark:text-slate-500">{row.shortLabel}</div>
                            </td>
                            <td className={`px-3 py-2 font-medium ${row.temp <= 32 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {row.temp.toFixed(0)}°
                            </td>
                            <td className={`px-3 py-2 text-sm ${row.feelsLike <= 32 ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                {row.feelsLike.toFixed(0)}°
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                                {row.humidity > 0 ? `${row.humidity.toFixed(0)}%` : '—'}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                                {row.precipProb >= 0 ? `${row.precipProb.toFixed(0)}%` : '—'}
                            </td>
                            <td className="px-3 py-2">
                                {(row.precipType && row.precipType !== 'NONE' && (row.precipProb > 20 || row.precipAmount > 0)) ? (
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${row.precipType.includes('FREEZ') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                                        row.precipType.includes('SNOW') || row.precipType.includes('SLEET') ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' :
                                            'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                                        }`}>
                                        {formatPrecipType(row.precipType)}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                            </td>
                            <td className="px-3 py-2">
                                {row.iceThickness > 0 ? (
                                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-xs">
                                        {formatIce(row.iceThickness)}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                            </td>
                            <td className="px-3 py-2">
                                {row.radialWireIce > 0 ? (
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-xs">
                                        {formatIce(row.radialWireIce)}
                                    </span>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                            </td>
                            <td className="px-3 py-2">
                                {row.snowAccumulation > 0 ? (
                                    <span className="text-cyan-600 dark:text-cyan-400 text-sm">
                                        {row.snowAccumulation.toFixed(1)}"
                                    </span>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                            </td>
                            <td className="px-3 py-2">
                                {row.snowDepth > 0 ? (
                                    <span className="text-teal-600 dark:text-teal-400 text-sm">
                                        {row.snowDepth.toFixed(1)}"
                                    </span>
                                ) : (
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                )}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-sm">
                                {row.windSpeed.toFixed(0)}
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-medium">
                                {row.windGust.toFixed(0)} mph
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-sm">
                                {row.cloudCover > 0 ? `${row.cloudCover.toFixed(0)}%` : '—'}
                            </td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs max-w-[100px] truncate" title={row.condition}>
                                {row.condition || '—'}
                            </td>
                            <td className="px-3 py-2">
                                <span
                                    className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                                    style={{ backgroundColor: getRiskColor(row.riskScore) }}
                                >
                                    {row.riskScore.toFixed(0)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
