import { CSV_COLUMNS } from '@/constants';
import type { ChartDataPoint } from '@/types';

// ============================================================================
// DATA EXPORT
// Functions for exporting weather data to various formats
// ============================================================================

/**
 * Generate CSV content from chart data
 * @param data Processed chart data points
 * @param locationName Name of the forecast location
 * @returns CSV string with metadata header
 */
export function generateCSV(data: ChartDataPoint[], locationName: string): string {
    const headers = CSV_COLUMNS.map(col => col.label).join(',');

    const rows = data.map(row => {
        return CSV_COLUMNS.map(col => {
            const value = row[col.key as keyof ChartDataPoint];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            if (typeof value === 'number') {
                return col.key.includes('temp') || col.key === 'feelsLike' || col.key === 'dewPoint'
                    ? value.toFixed(1)
                    : col.key.includes('ice') || col.key.includes('snow') || col.key === 'precipAmount'
                        ? value.toFixed(3)
                        : value.toFixed(1);
            }
            return value ?? '';
        }).join(',');
    }).join('\n');

    const metadata = [
        `# Ice Storm Monitor - Weather Forecast Export`,
        `# Location: ${locationName}`,
        `# Generated: ${new Date().toISOString()}`,
        `# Forecast Period: ${data[0]?.timestamp || ''} to ${data[data.length - 1]?.timestamp || ''}`,
        `# Hours: ${data.length}`,
        '',
    ].join('\n');

    return metadata + headers + '\n' + rows;
}

/**
 * Trigger CSV file download
 * @param data Processed chart data points
 * @param locationName Name of the forecast location
 */
export function downloadCSV(data: ChartDataPoint[], locationName: string): void {
    console.log('downloadCSV called', { dataLength: data.length, locationName });
    const csv = generateCSV(data, locationName);
    // Use data URL directly - more compatible
    const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
    const filename = `weather-forecast-${new Date().toISOString().split('T')[0]}.csv`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('CSV download triggered via data URL');
}

/**
 * Trigger JSON file download
 * @param data Data to export (any serializable object)
 * @param filename Name for the downloaded file
 */
export function downloadJSON(data: unknown, filename: string): void {
    console.log('downloadJSON called', { filename });
    const json = JSON.stringify(data, null, 2);
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('JSON download triggered via data URL');
}
