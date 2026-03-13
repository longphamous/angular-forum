import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DividerModule } from "primeng/divider";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { LevelProgress } from "../../../core/components/level-badge/level-badge";
import { USER_ROUTES } from "../../../core/api/user.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { UserProfile, UserRole } from "../../../core/models/user/user";
import { AuthFacade } from "../../../facade/auth/auth-facade";

const ROLE_LABELS: Record<UserRole, string> = {
    admin: "Administrator",
    guest: "Gast",
    member: "Mitglied",
    moderator: "Moderator"
};

const GENDER_LABELS: Record<string, string> = {
    male: "Männlich",
    female: "Weiblich",
    other: "Divers",
    prefer_not_to_say: "Keine Angabe"
};

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarModule, ButtonModule, CardModule, DividerModule, LevelProgress, RouterModule, SkeletonModule, TagModule, TooltipModule],
    selector: "app-user-profile-page",
    templateUrl: "./user-profile-page.html"
})
export class UserProfilePage implements OnInit {
    protected readonly isOwnProfile = computed(() => {
        const uid = this.profileUserId();
        return !!uid && uid === this.authFacade.currentUser()?.id;
    });
    protected readonly loading = signal(true);
    protected readonly profile = signal<UserProfile | null>(null);

    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly authFacade = inject(AuthFacade);
    private readonly http = inject(HttpClient);
    private readonly profileUserId = signal<string | null>(null);
    private readonly route = inject(ActivatedRoute);

    ngOnInit(): void {
        const userId = this.route.snapshot.paramMap.get("userId")!;
        this.profileUserId.set(userId);
        this.http.get<UserProfile>(`${this.apiConfig.baseUrl}${USER_ROUTES.publicProfile(userId)}`).subscribe({
            next: (p) => {
                this.profile.set(p);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    protected formatDate(dateStr?: string | null, format: "month-year" | "full" = "month-year"): string {
        if (!dateStr) return "—";
        const opts =
            format === "full"
                ? { day: "2-digit" as const, month: "long" as const, year: "numeric" as const }
                : { month: "long" as const, year: "numeric" as const };
        return new Date(dateStr).toLocaleDateString("de-DE", opts);
    }

    protected genderLabel(gender?: string): string {
        if (!gender) return "—";
        return GENDER_LABELS[gender] ?? gender;
    }

    protected roleLabel(role: UserRole): string {
        return ROLE_LABELS[role];
    }

    protected roleSeverity(role: UserRole): "danger" | "warn" | "info" | "secondary" {
        if (role === "admin") return "danger";
        if (role === "moderator") return "warn";
        if (role === "member") return "info";
        return "secondary";
    }

    protected initial(profile: UserProfile): string {
        return (profile.displayName || profile.username).charAt(0).toUpperCase();
    }
}
