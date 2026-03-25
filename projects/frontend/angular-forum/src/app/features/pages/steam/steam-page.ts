import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ProgressBarModule } from "primeng/progressbar";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

import { STEAM_ROUTES } from "../../../core/api/steam.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { STEAM_STATUS_COLORS, STEAM_STATUS_LABELS, SteamGame, SteamProfile } from "../../../core/models/steam/steam";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-steam-page",
    standalone: true,
    imports: [
        AvatarModule,
        ButtonModule,
        FormsModule,
        InputTextModule,
        ProgressBarModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        ToggleSwitchModule,
        TooltipModule,
        TranslocoModule
    ],
    templateUrl: "./steam-page.html"
})
export class SteamPage implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    protected readonly loading = signal(true);
    protected readonly profile = signal<SteamProfile | null>(null);
    protected readonly games = signal<SteamGame[]>([]);
    protected readonly recentGames = signal<SteamGame[]>([]);
    protected readonly syncing = signal(false);
    protected readonly linking = signal(false);
    protected steamIdInput = "";

    protected readonly statusLabels = STEAM_STATUS_LABELS;
    protected readonly statusColors = STEAM_STATUS_COLORS;

    ngOnInit(): void {
        this.loadProfile();
    }

    private loadProfile(): void {
        this.loading.set(true);
        this.http.get<SteamProfile>(`${this.config.baseUrl}${STEAM_ROUTES.profile()}`).subscribe({
            next: (p) => {
                this.profile.set(p);
                this.loading.set(false);
                if (p) this.loadGames();
            },
            error: () => this.loading.set(false)
        });
    }

    private loadGames(): void {
        this.http.get<SteamGame[]>(`${this.config.baseUrl}${STEAM_ROUTES.games()}`).subscribe({
            next: (g) => this.games.set(g ?? [])
        });
        this.http.get<SteamGame[]>(`${this.config.baseUrl}${STEAM_ROUTES.recentGames()}`).subscribe({
            next: (g) => this.recentGames.set(g ?? [])
        });
    }

    protected linkSteam(): void {
        if (!this.steamIdInput.trim()) return;
        this.linking.set(true);
        this.http
            .post<SteamProfile>(`${this.config.baseUrl}${STEAM_ROUTES.link()}`, { steamId: this.steamIdInput.trim() })
            .subscribe({
                next: (p) => {
                    this.profile.set(p);
                    this.linking.set(false);
                    this.loadGames();
                },
                error: () => this.linking.set(false)
            });
    }

    protected unlinkSteam(): void {
        this.http.delete(`${this.config.baseUrl}${STEAM_ROUTES.unlink()}`).subscribe({
            next: () => {
                this.profile.set(null);
                this.games.set([]);
                this.recentGames.set([]);
            }
        });
    }

    protected syncProfile(): void {
        this.syncing.set(true);
        this.http.post<SteamProfile>(`${this.config.baseUrl}${STEAM_ROUTES.sync()}`, {}).subscribe({
            next: (p) => {
                this.profile.set(p);
                this.syncing.set(false);
            },
            error: () => this.syncing.set(false)
        });
    }

    protected syncFriends(): void {
        this.http.post(`${this.config.baseUrl}${STEAM_ROUTES.syncFriends()}`, {}).subscribe();
    }

    protected updateSettings(patch: { isPublic?: boolean; syncFriends?: boolean }): void {
        this.http.patch<SteamProfile>(`${this.config.baseUrl}${STEAM_ROUTES.settings()}`, patch).subscribe({
            next: (p) => {
                if (p) this.profile.set(p);
            }
        });
    }

    protected formatPlaytime(minutes: number): string {
        const hours = Math.round((minutes / 60) * 10) / 10;
        return `${hours}h`;
    }
}
