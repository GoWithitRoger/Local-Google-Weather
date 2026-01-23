
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/david/Downloads/weather-data-75218___white_rock_lake-2026-01-23 (1).json', 'utf8'));

console.log("Total hours:", data.forecastHours.length);

let icingHours = 0;

data.forecastHours.forEach(h => {
    const wetBulb = h.wetBulbTemperature?.degrees;
    const precip = h.precipitation?.qpf?.quantity || 0;
    const precipType = h.precipitation?.probability?.type || h.precipitation?.type || 'NONE';
    const temp = h.temperature?.degrees;

    if (wetBulb <= 32 && precip > 0) {
        icingHours++;
        console.log(`\nMatch Found: ${h.interval.startTime}`);
        console.log(`  Temp: ${temp}°F`);
        console.log(`  WetBulb: ${wetBulb}°F`);
        console.log(`  QPF: ${precip}"`);
        console.log(`  Type: ${precipType}`);

        // Test the logic directly
        const typeUpper = precipType.toUpperCase();
        const isLiquidSource = typeUpper.includes('RAIN') ||
            typeUpper.includes('MIX') ||
            typeUpper.includes('SLEET') ||
            typeUpper.includes('DRIZZLE');
        console.log(`  Is Liquid Source? ${isLiquidSource}`);

        if (isLiquidSource) {
            let efficiency = 0.5;
            efficiency += (32 - wetBulb) * 0.05;
            const windSpeed = h.wind?.speed?.value || 0;
            efficiency += windSpeed * 0.02;
            efficiency = Math.min(Math.max(efficiency, 0), 1.0);
            const provisionalIce = precip * efficiency;
            console.log(`  Calculated Provisional Ice: ${provisionalIce.toFixed(4)}"`);
        } else {
            console.log(`  Skipped due to non-liquid type`);
        }
    }
});

if (icingHours === 0) {
    console.log("\nNo hours found with WetBulb <= 32 and QPF > 0");
}
