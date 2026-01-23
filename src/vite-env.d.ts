/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WEATHER_API_KEY: string
    readonly VITE_DEFAULT_LAT?: string
    readonly VITE_DEFAULT_LON?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
