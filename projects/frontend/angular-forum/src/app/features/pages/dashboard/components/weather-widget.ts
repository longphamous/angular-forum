import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";

import { API_CONFIG, ApiConfig } from "../../../../core/config/api.config";
import { AuthFacade } from "../../../../facade/auth/auth-facade";

interface WeatherData {
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

const STORAGE_KEY = "aniverse_weather_enabled";

const BG_GRADIENTS: Record<string, string> = {
    clear: "from-sky-400 to-blue-500",
    partly_cloudy: "from-blue-400 to-slate-500",
    cloudy: "from-slate-400 to-gray-500",
    overcast: "from-gray-400 to-gray-600",
    fog: "from-gray-300 to-gray-500",
    thunderstorm: "from-slate-600 to-gray-800",
    snow: "from-blue-100 to-slate-300",
    blizzard: "from-gray-200 to-slate-400"
};

const BG_GRADIENTS_NIGHT: Record<string, string> = {
    clear: "from-indigo-800 to-slate-900",
    partly_cloudy: "from-indigo-700 to-slate-800",
    cloudy: "from-slate-700 to-gray-800",
    overcast: "from-gray-700 to-gray-900",
    fog: "from-slate-600 to-gray-800",
    thunderstorm: "from-slate-800 to-gray-900",
    snow: "from-slate-600 to-indigo-800",
    blizzard: "from-gray-600 to-slate-800"
};

@Component({
    selector: "app-weather-widget",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslocoModule],
    template: `
        <!-- Collapsed state: small enable button -->
        @if (hasLocation() && !enabled()) {
            <button
                class="flex w-full items-center gap-2 rounded-xl border border-surface p-3 text-sm text-color-secondary cursor-pointer bg-transparent hover:bg-emphasis transition-colors"
                (click)="toggle()"
                type="button"
            >
                <span>🌤️</span>
                <span *transloco="let t">{{ t('weather.enable') }}</span>
                <i class="pi pi-chevron-down ml-auto" style="font-size: 0.7rem"></i>
            </button>
        }

        <!-- Weather card -->
        @if (weather(); as w) {
            <div
                class="overflow-hidden rounded-xl text-white"
                [class]="'bg-gradient-to-br ' + gradient()"
            >
                <div class="p-5">
                    <div class="flex items-start justify-between">
                        <div>
                            <div class="text-4xl font-bold">{{ w.temperature }}°C</div>
                            <div class="mt-1 text-sm opacity-80">{{ w.description }}</div>
                            <div class="mt-2 flex items-center gap-1 text-xs opacity-70">
                                <i class="pi pi-map-marker" style="font-size: 0.65rem"></i>
                                {{ w.location }}
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <div class="text-5xl">{{ w.icon }}</div>
                            <button
                                class="border-none bg-transparent cursor-pointer text-white/40 hover:text-white/80 transition-colors"
                                (click)="toggle()"
                                type="button"
                                title="Hide weather"
                            >
                                <i class="pi pi-eye-slash" style="font-size: 0.75rem"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-4 flex gap-4 border-t border-white/20 pt-3 text-xs opacity-80">
                        <span class="flex items-center gap-1">
                            <i class="pi pi-compass" style="font-size: 0.65rem"></i>
                            {{ w.windSpeed }} km/h {{ w.windDirection }}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="pi pi-cloud" style="font-size: 0.65rem"></i>
                            {{ w.humidity }}%
                        </span>
                        <span class="flex items-center gap-1" *transloco="let t">
                            {{ t('weather.feelsLike') }} {{ w.feelsLike }}°C
                        </span>
                    </div>
                </div>
            </div>
        }
    `
})
export class WeatherWidget implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly authFacade = inject(AuthFacade);

    protected readonly weather = signal<WeatherData | null>(null);
    protected readonly enabled = signal(localStorage.getItem(STORAGE_KEY) !== "false");
    protected readonly hasLocation = computed(() => !!this.authFacade.currentUser()?.location);

    protected readonly gradient = computed(() => {
        const w = this.weather();
        if (!w) return "from-sky-400 to-blue-500";
        const map = w.isDay ? BG_GRADIENTS : BG_GRADIENTS_NIGHT;
        return map[w.condition] ?? map["clear"];
    });

    ngOnInit(): void {
        if (this.enabled()) {
            this.loadWeather();
        }
    }

    protected toggle(): void {
        const newState = !this.enabled();
        this.enabled.set(newState);
        localStorage.setItem(STORAGE_KEY, String(newState));
        if (newState) {
            this.loadWeather();
        } else {
            this.weather.set(null);
        }
    }

    private loadWeather(): void {
        const location = this.authFacade.currentUser()?.location;
        if (!location) return;

        this.http
            .get<WeatherData>(`${this.config.baseUrl}/weather?location=${encodeURIComponent(location)}`)
            .subscribe({
                next: (data) => {
                    if (data) this.weather.set(data);
                }
            });
    }
}
