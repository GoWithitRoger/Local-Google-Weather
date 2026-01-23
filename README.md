# 🧊 Ice Storm Monitor

A real-time ice storm monitoring and power outage risk assessment dashboard powered by Google's WeatherNext AI API. Built with React, TypeScript, and Tailwind CSS.

![Ice Storm Monitor Dashboard](https://via.placeholder.com/800x400?text=Ice+Storm+Monitor+Dashboard)

## ✨ Features

- **🔮 Power Outage Risk Prediction** - Proprietary algorithm based on NWS ice storm severity scales
- **📊 Real-time Visualization** - Interactive charts showing ice accumulation, temperature, and wind data
- **⚠️ Smart Alerts** - Automatic weather warnings based on forecast thresholds
- **📥 CSV Export** - Download complete forecast data for offline analysis
- **💾 Smart Caching** - 15-minute cache reduces API costs on repeated refreshes
- **🌙 Dark Mode** - Full dark mode support with system preference detection
- **📍 Geolocation** - Use your current location or enter custom coordinates
- **📱 Responsive Design** - Works great on desktop, tablet, and mobile
- **🧪 Demo Mode** - Try the app without an API key using simulated data


## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- Google Cloud account with Weather API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ice-storm-monitor.git
cd ice-storm-monitor

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API key to .env
# VITE_WEATHER_API_KEY=your_key_here

# Start development server
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🔑 Getting a Google Weather API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the [Weather API](https://console.cloud.google.com/apis/library/weather.googleapis.com)
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > API Key**
6. (Optional) Restrict the key to the Weather API for security
7. Add the key to your `.env` file

> ⚠️ **Note**: The Weather API requires billing to be enabled, though it includes a free tier.

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx       # App header with controls
│   ├── KpiCards.tsx     # Metric display cards
│   ├── AlertsPanel.tsx  # Weather alerts
│   ├── RiskCharts.tsx   # Data visualizations
│   ├── DataTable.tsx    # Hourly data table
│   └── ...
├── hooks/
│   └── useWeatherData.ts # Main data fetching hook
├── context/
│   └── ThemeContext.tsx  # Dark mode provider
├── utils/
│   └── index.ts          # Risk calculation & helpers
├── constants/
│   └── index.ts          # Configuration & thresholds
├── types/
│   └── index.ts          # TypeScript definitions
├── App.tsx               # Main application
└── main.tsx              # Entry point
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_WEATHER_API_KEY` | Google Weather API key | Yes |
| `VITE_DEFAULT_LAT` | Default latitude | No (default: 32.846) |
| `VITE_DEFAULT_LON` | Default longitude | No (default: -96.711) |

### Risk Thresholds

The power outage risk algorithm uses these configurable thresholds:

```typescript
// Ice accumulation thresholds (inches)
ICE_THRESHOLDS = {
  LIGHT: 0.01,      // Minimal risk
  MODERATE: 0.10,   // Tree limbs stressed
  HEAVY: 0.25,      // Significant damage likely
  SEVERE: 0.50,     // Catastrophic
}

// Wind gust thresholds (mph)
WIND_THRESHOLDS = {
  ELEVATED: 20,     // Elevated risk with ice
  DANGEROUS: 40,    // High risk of downed lines
}
```

## 🏗️ Development

```bash
# Start dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

## 📊 Risk Algorithm

The power outage probability is calculated using a weighted scoring system:

1. **Ice Accumulation** (0-100 points)
   - Light glaze (>0.01"): +10 points
   - Moderate ice (>0.10"): +20 points
   - Heavy ice (>0.25"): +40 points
   - Severe ice (>0.50"): +30 points

2. **Wind Stress Multiplier**
   - Dangerous gusts (>40 mph): +30 points
   - Elevated gusts with ice (>20 mph + >0.10" ice): +20 points

The final score is capped at 100 and categorized as:
- **Low Risk** (0-19): Normal conditions
- **Moderate** (20-39): Be prepared
- **High Risk** (40-69): Likely outages
- **Critical** (70-100): Widespread outages expected

## 🎨 Customization

### Theming

The app supports three theme modes:
- **Light** - Clean, bright interface
- **Dark** - Easy on the eyes at night
- **System** - Follows your OS preference

Click the theme toggle button in the header to cycle through modes.

### Styling

Built with Tailwind CSS. Customize colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      risk: {
        low: '#10b981',
        moderate: '#eab308',
        high: '#f97316',
        critical: '#ef4444',
      }
    }
  }
}
```

## 📝 License

MIT License - feel free to use this project however you like.

## 🙏 Acknowledgments

- [Google Weather API](https://developers.google.com/maps/documentation/weather) for forecast data
- [Recharts](https://recharts.org/) for beautiful charts
- [Lucide](https://lucide.dev/) for icons
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

Built with ☕ in Dallas, TX
