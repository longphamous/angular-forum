import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { AvatarModule } from "primeng/avatar";
import { AutoCompleteCompleteEvent, AutoCompleteModule } from "primeng/autocomplete";

import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";

export interface UserSuggestion {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}

@Component({
    selector: "app-user-autocomplete",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AutoCompleteModule, AvatarModule, FormsModule],
    template: `
        <p-autocomplete
            [suggestions]="suggestions()"
            [ngModel]="selectedUser"
            (ngModelChange)="onModelChange($event)"
            (completeMethod)="search($event)"
            optionLabel="username"
            [placeholder]="placeholder"
            [forceSelection]="true"
            [showClear]="true"
            [minLength]="2"
            [delay]="300"
            [styleClass]="styleClass"
            appendTo="body"
        >
            <ng-template let-user pTemplate="item">
                <div class="flex items-center gap-2">
                    <p-avatar
                        [label]="user.displayName?.charAt(0)?.toUpperCase() ?? '?'"
                        [image]="user.avatarUrl ?? ''"
                        shape="circle"
                        size="normal"
                    />
                    <div>
                        <div class="text-sm font-medium">{{ user.displayName }}</div>
                        <div class="text-xs text-color-secondary">@{{ user.username }}</div>
                    </div>
                </div>
            </ng-template>
            <ng-template let-user pTemplate="selectedItem">
                <div class="flex items-center gap-2">
                    <p-avatar
                        [label]="user.displayName?.charAt(0)?.toUpperCase() ?? '?'"
                        [image]="user.avatarUrl ?? ''"
                        shape="circle"
                        size="normal"
                        styleClass="w-6 h-6 text-xs"
                    />
                    <span class="text-sm">{{ user.displayName }} (@{{ user.username }})</span>
                </div>
            </ng-template>
        </p-autocomplete>
    `
})
export class UserAutocomplete {
    @Input() placeholder = "Username...";
    @Input() styleClass = "w-full";
    @Output() userSelected = new EventEmitter<UserSuggestion | null>();

    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);

    protected readonly suggestions = signal<UserSuggestion[]>([]);
    protected selectedUser: UserSuggestion | null = null;

    search(event: AutoCompleteCompleteEvent): void {
        const query = event.query?.trim();
        if (!query || query.length < 2) {
            this.suggestions.set([]);
            return;
        }

        this.http
            .get<UserSuggestion[]>(`${this.config.baseUrl}/user/autocomplete?q=${encodeURIComponent(query)}`)
            .subscribe({
                next: (users) => this.suggestions.set(users),
                error: () => this.suggestions.set([])
            });
    }

    onModelChange(value: UserSuggestion | string | null): void {
        if (typeof value === "object" && value !== null) {
            this.selectedUser = value;
            this.userSelected.emit(value);
        } else if (value === null || value === "") {
            this.selectedUser = null;
            this.userSelected.emit(null);
        }
    }

    clear(): void {
        this.selectedUser = null;
        this.suggestions.set([]);
    }
}
