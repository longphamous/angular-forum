import { Injectable, Logger } from "@nestjs/common";

export interface WeatherData {
    location: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    description: string;
    icon: string;
    windSpeed: number;
    windDirection: string;
    condition: string;
    isDay: boolean;
}

interface WttrResponse {
    current_condition: {
        temp_C: string;
        FeelsLikeC: string;
        humidity: string;
        weatherDesc: { value: string }[];
        weatherCode: string;
        windspeedKmph: string;
        winddir16Point: string;
    }[];
    nearest_area: { areaName: { value: string }[]; country: { value: string }[] }[];
}

const WEATHER_ICONS: Record<string, string> = {
    "113": "☀️", "116": "⛅", "119": "☁️", "122": "☁️",
    "143": "🌫️", "176": "🌦️", "179": "🌨️", "182": "🌧️",
    "185": "🌧️", "200": "⛈️", "227": "❄️", "230": "❄️",
    "248": "🌫️", "260": "🌫️", "263": "🌦️", "266": "🌧️",
    "281": "🌧️", "284": "🌧️", "293": "🌦️", "296": "🌧️",
    "299": "🌧️", "302": "🌧️", "305": "🌧️", "308": "🌧️",
    "311": "🌧️", "314": "🌧️", "317": "🌧️", "320": "🌨️",
    "323": "🌨️", "326": "🌨️", "329": "❄️", "332": "❄️",
    "335": "❄️", "338": "❄️", "350": "🌧️", "353": "🌦️",
    "356": "🌧️", "359": "🌧️", "362": "🌨️", "365": "🌨️",
    "368": "🌨️", "371": "❄️", "374": "🌧️", "377": "🌧️",
    "386": "⛈️", "389": "⛈️", "392": "⛈️", "395": "❄️"
};

const CONDITION_MAP: Record<string, string> = {
    "113": "clear", "116": "partly_cloudy", "119": "cloudy", "122": "overcast",
    "143": "fog", "200": "thunderstorm", "227": "snow", "230": "blizzard"
};

@Injectable()
export class WeatherService {
    private readonly logger = new Logger(WeatherService.name);
    private readonly cache = new Map<string, { data: WeatherData; expiry: number }>();
    private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

    async getWeather(location: string): Promise<WeatherData | null> {
        if (!location || location.trim().length < 2) return null;

        const cacheKey = location.toLowerCase().trim();
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }

        try {
            const res = await fetch(
                `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
                { signal: AbortSignal.timeout(5000) }
            );
            if (!res.ok) return null;

            const json = (await res.json()) as WttrResponse;
            const current = json.current_condition?.[0];
            const area = json.nearest_area?.[0];
            if (!current) return null;

            const code = current.weatherCode;
            const hour = new Date().getHours();
            const data: WeatherData = {
                location: area ? `${area.areaName[0]?.value}, ${area.country[0]?.value}` : location,
                temperature: parseInt(current.temp_C),
                feelsLike: parseInt(current.FeelsLikeC),
                humidity: parseInt(current.humidity),
                description: current.weatherDesc?.[0]?.value ?? "Unknown",
                icon: WEATHER_ICONS[code] ?? "🌤️",
                windSpeed: parseInt(current.windspeedKmph),
                windDirection: current.winddir16Point,
                condition: CONDITION_MAP[code] ?? "cloudy",
                isDay: hour >= 6 && hour < 20
            };

            this.cache.set(cacheKey, { data, expiry: Date.now() + this.CACHE_TTL });
            this.logger.debug(`Weather for "${location}": ${data.temperature}°C ${data.icon}`);
            return data;
        } catch (err) {
            this.logger.warn(`Failed to fetch weather for "${location}": ${(err as Error).message}`);
            return null;
        }
    }
}
