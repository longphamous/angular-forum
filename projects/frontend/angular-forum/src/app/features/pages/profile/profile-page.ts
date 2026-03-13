import { ChangeDetectionStrategy, Component, effect, inject, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DatePickerModule } from "primeng/datepicker";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";
import { SelectModule } from "primeng/select";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";

import { LevelProgress } from "../../../core/components/level-badge/level-badge";
import { UserRole } from "../../../core/models/user/user";
import { AuthFacade, ChangePasswordPayload, UpdateProfilePayload } from "../../../facade/auth/auth-facade";

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPw = group.get("newPassword")?.value as string;
    const confirm = group.get("confirmPassword")?.value as string;
    return newPw && confirm && newPw !== confirm ? { passwordMismatch: true } : null;
}

const ROLE_LABELS: Record<UserRole, string> = {
    admin: "Administrator",
    moderator: "Moderator",
    member: "Mitglied",
    guest: "Gast"
};

const ROLE_SEVERITIES: Record<UserRole, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
    admin: "danger",
    moderator: "warn",
    member: "success",
    guest: "secondary"
};

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        ButtonModule,
        CardModule,
        DatePickerModule,
        DividerModule,
        InputTextModule,
        LevelProgress,
        MessageModule,
        PasswordModule,
        ReactiveFormsModule,
        SelectModule,
        TabsModule,
        TagModule,
        TextareaModule
    ],
    selector: "app-profile-page",
    template: `
        <div class="mx-auto max-w-3xl">
            <!-- Header -->
            <p-card styleClass="mb-6">
                <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <p-avatar
                        [label]="userInitial()"
                        shape="circle"
                        size="xlarge"
                        styleClass="text-2xl font-bold shrink-0 bg-primary/15 text-primary"
                    />
                    <div class="flex flex-1 flex-col gap-1 text-center sm:text-left">
                        <div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <span class="text-surface-900 dark:text-surface-0 text-2xl font-bold">
                                {{ user()?.displayName }}
                            </span>
                            @if (user()?.role) {
                                <p-tag [severity]="roleSeverity()" [value]="roleLabel()" styleClass="text-xs" />
                            }
                        </div>
                        <span class="text-surface-500 dark:text-surface-400 text-sm">
                            &#64;{{ user()?.username }}
                        </span>
                        @if (user()?.bio) {
                            <p class="text-surface-700 dark:text-surface-300 mt-1 text-sm">{{ user()?.bio }}</p>
                        }
                        <div
                            class="text-surface-400 dark:text-surface-500 mt-2 flex flex-wrap justify-center gap-4 text-xs sm:justify-start"
                        >
                            <span class="flex items-center gap-1">
                                <i class="pi pi-calendar"></i>
                                Mitglied seit {{ formatDate(user()?.createdAt) }}
                            </span>
                            @if (user()?.lastLoginAt) {
                                <span class="flex items-center gap-1">
                                    <i class="pi pi-clock"></i>
                                    Zuletzt aktiv {{ formatDate(user()?.lastLoginAt) }}
                                </span>
                            }
                        </div>
                        @if (user()?.level) {
                            <div class="mt-3 w-full max-w-xs">
                                <level-progress
                                    [level]="user()!.level"
                                    [levelName]="user()!.levelName"
                                    [xp]="user()!.xp"
                                    [xpProgressPercent]="user()!.xpProgressPercent"
                                    [xpToNextLevel]="user()!.xpToNextLevel"
                                />
                            </div>
                        }
                    </div>
                </div>
            </p-card>

            <!-- Tabs -->
            <p-tabs value="overview">
                <p-tablist>
                    <p-tab value="overview"> <i class="pi pi-user mr-2"></i>Übersicht </p-tab>
                    <p-tab value="edit"> <i class="pi pi-pencil mr-2"></i>Bearbeiten </p-tab>
                    <p-tab value="security"> <i class="pi pi-lock mr-2"></i>Sicherheit </p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- Übersicht -->
                    <p-tabpanel value="overview">
                        <div class="flex flex-col gap-4 pt-2">
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                    <div
                                        class="text-surface-500 dark:text-surface-400 mb-1 text-xs font-medium tracking-wide uppercase"
                                    >
                                        Benutzername
                                    </div>
                                    <div class="text-surface-900 dark:text-surface-0 font-medium">
                                        {{ user()?.username }}
                                    </div>
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                    <div
                                        class="text-surface-500 dark:text-surface-400 mb-1 text-xs font-medium tracking-wide uppercase"
                                    >
                                        E-Mail
                                    </div>
                                    <div class="text-surface-900 dark:text-surface-0 font-medium">
                                        {{ user()?.email }}
                                    </div>
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                    <div
                                        class="text-surface-500 dark:text-surface-400 mb-1 text-xs font-medium tracking-wide uppercase"
                                    >
                                        Rolle
                                    </div>
                                    <p-tag [severity]="roleSeverity()" [value]="roleLabel()" styleClass="text-xs" />
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                    <div
                                        class="text-surface-500 dark:text-surface-400 mb-1 text-xs font-medium tracking-wide uppercase"
                                    >
                                        Status
                                    </div>
                                    <div class="text-surface-900 dark:text-surface-0 font-medium capitalize">
                                        {{ user()?.status }}
                                    </div>
                                </div>
                            </div>

                            @if (user()?.bio) {
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                    <div
                                        class="text-surface-500 dark:text-surface-400 mb-2 text-xs font-medium tracking-wide uppercase"
                                    >
                                        Bio
                                    </div>
                                    <p class="text-surface-700 dark:text-surface-300 text-sm leading-relaxed">
                                        {{ user()?.bio }}
                                    </p>
                                </div>
                            }
                        </div>
                    </p-tabpanel>

                    <!-- Profil bearbeiten -->
                    <p-tabpanel value="edit">
                        <form class="flex flex-col gap-5 pt-2" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                            @if (profileSuccess()) {
                                <p-message [text]="profileSuccess()!" severity="success" styleClass="w-full" />
                            }
                            @if (profileError()) {
                                <p-message [text]="profileError()!" severity="error" styleClass="w-full" />
                            }

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="displayName"
                                >
                                    Anzeigename
                                </label>
                                <input
                                    class="w-full"
                                    id="displayName"
                                    [class.ng-invalid]="
                                        profileForm.get('displayName')?.invalid &&
                                        profileForm.get('displayName')?.touched
                                    "
                                    formControlName="displayName"
                                    pInputText
                                    placeholder="Dein Anzeigename"
                                    type="text"
                                />
                                @if (
                                    profileForm.get("displayName")?.errors?.["required"] &&
                                    profileForm.get("displayName")?.touched
                                ) {
                                    <small class="text-red-500">Anzeigename ist erforderlich.</small>
                                }
                                @if (
                                    profileForm.get("displayName")?.errors?.["minlength"] &&
                                    profileForm.get("displayName")?.touched
                                ) {
                                    <small class="text-red-500">Mindestens 2 Zeichen erforderlich.</small>
                                }
                            </div>

                            <div class="flex flex-col gap-2">
                                <label class="text-surface-700 dark:text-surface-300 text-sm font-medium" for="bio">
                                    Bio <span class="text-surface-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    class="w-full"
                                    id="bio"
                                    [autoResize]="true"
                                    formControlName="bio"
                                    placeholder="Erzähl etwas über dich…"
                                    pTextarea
                                    rows="4"
                                ></textarea>
                                <div class="text-surface-400 dark:text-surface-500 text-right text-xs">
                                    {{ profileForm.get("bio")?.value?.length ?? 0 }} / 500
                                </div>
                            </div>

                            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div class="flex flex-col gap-2">
                                    <label
                                        class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                        for="gender"
                                    >
                                        Geschlecht <span class="text-surface-400 font-normal">(optional)</span>
                                    </label>
                                    <p-select
                                        [options]="genderOptions"
                                        formControlName="gender"
                                        inputId="gender"
                                        optionLabel="label"
                                        optionValue="value"
                                        styleClass="w-full"
                                    />
                                </div>

                                <div class="flex flex-col gap-2">
                                    <label
                                        class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                        for="birthday"
                                    >
                                        Geburtstag <span class="text-surface-400 font-normal">(optional)</span>
                                    </label>
                                    <p-datepicker
                                        [maxDate]="today"
                                        [showIcon]="true"
                                        dateFormat="dd.mm.yy"
                                        formControlName="birthday"
                                        inputId="birthday"
                                        styleClass="w-full"
                                    />
                                </div>

                                <div class="flex flex-col gap-2">
                                    <label
                                        class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                        for="location"
                                    >
                                        Ort <span class="text-surface-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        class="w-full"
                                        id="location"
                                        formControlName="location"
                                        pInputText
                                        placeholder="Stadt, Land…"
                                        type="text"
                                    />
                                </div>

                                <div class="flex flex-col gap-2">
                                    <label
                                        class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                        for="website"
                                    >
                                        Website <span class="text-surface-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        class="w-full"
                                        id="website"
                                        formControlName="website"
                                        pInputText
                                        placeholder="https://…"
                                        type="url"
                                    />
                                </div>
                            </div>

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="signature"
                                >
                                    Signatur <span class="text-surface-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    class="w-full"
                                    id="signature"
                                    [autoResize]="true"
                                    formControlName="signature"
                                    placeholder="Deine Signatur, die unter deinen Beiträgen erscheint…"
                                    pTextarea
                                    rows="3"
                                ></textarea>
                                <div class="text-surface-400 dark:text-surface-500 text-right text-xs">
                                    {{ profileForm.get("signature")?.value?.length ?? 0 }} / 300
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <p-button
                                    [disabled]="profileForm.invalid || profileForm.pristine"
                                    [loading]="saving()"
                                    icon="pi pi-check"
                                    label="Speichern"
                                    type="submit"
                                />
                            </div>
                        </form>
                    </p-tabpanel>

                    <!-- Sicherheit -->
                    <p-tabpanel value="security">
                        <form class="flex flex-col gap-5 pt-2" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                            @if (passwordSuccess()) {
                                <p-message [text]="passwordSuccess()!" severity="success" styleClass="w-full" />
                            }
                            @if (passwordError()) {
                                <p-message [text]="passwordError()!" severity="error" styleClass="w-full" />
                            }

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="currentPassword"
                                >
                                    Aktuelles Passwort
                                </label>
                                <p-password
                                    [feedback]="false"
                                    [toggleMask]="true"
                                    formControlName="currentPassword"
                                    inputId="currentPassword"
                                    inputStyleClass="w-full"
                                    placeholder="Aktuelles Passwort"
                                    styleClass="w-full"
                                />
                                @if (
                                    passwordForm.get("currentPassword")?.errors?.["required"] &&
                                    passwordForm.get("currentPassword")?.touched
                                ) {
                                    <small class="text-red-500">Aktuelles Passwort ist erforderlich.</small>
                                }
                            </div>

                            <p-divider />

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="newPassword"
                                >
                                    Neues Passwort
                                </label>
                                <p-password
                                    [toggleMask]="true"
                                    formControlName="newPassword"
                                    inputId="newPassword"
                                    inputStyleClass="w-full"
                                    mediumLabel="Mittel"
                                    placeholder="Neues Passwort"
                                    promptLabel="Passwort eingeben"
                                    strongLabel="Stark"
                                    styleClass="w-full"
                                    weakLabel="Schwach"
                                />
                                @if (
                                    passwordForm.get("newPassword")?.errors?.["required"] &&
                                    passwordForm.get("newPassword")?.touched
                                ) {
                                    <small class="text-red-500">Neues Passwort ist erforderlich.</small>
                                }
                                @if (
                                    passwordForm.get("newPassword")?.errors?.["minlength"] &&
                                    passwordForm.get("newPassword")?.touched
                                ) {
                                    <small class="text-red-500">Mindestens 8 Zeichen erforderlich.</small>
                                }
                            </div>

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="confirmPassword"
                                >
                                    Passwort bestätigen
                                </label>
                                <p-password
                                    [feedback]="false"
                                    [toggleMask]="true"
                                    formControlName="confirmPassword"
                                    inputId="confirmPassword"
                                    inputStyleClass="w-full"
                                    placeholder="Passwort wiederholen"
                                    styleClass="w-full"
                                />
                                @if (
                                    passwordForm.errors?.["passwordMismatch"] &&
                                    passwordForm.get("confirmPassword")?.touched
                                ) {
                                    <small class="text-red-500">Passwörter stimmen nicht überein.</small>
                                }
                            </div>

                            <div class="flex justify-end">
                                <p-button
                                    [disabled]="passwordForm.invalid"
                                    [loading]="savingPassword()"
                                    icon="pi pi-lock"
                                    label="Passwort ändern"
                                    severity="warn"
                                    type="submit"
                                />
                            </div>
                        </form>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `
})
export class ProfilePage {
    private readonly authFacade = inject(AuthFacade);
    private readonly fb = inject(FormBuilder);

    protected readonly user = this.authFacade.currentUser;

    protected readonly saving = signal(false);
    protected readonly savingPassword = signal(false);
    protected readonly profileSuccess = signal<string | null>(null);
    protected readonly profileError = signal<string | null>(null);
    protected readonly passwordSuccess = signal<string | null>(null);
    protected readonly passwordError = signal<string | null>(null);

    protected readonly today = new Date();

    protected readonly genderOptions = [
        { label: "Keine Angabe", value: "" },
        { label: "Männlich", value: "male" },
        { label: "Weiblich", value: "female" },
        { label: "Divers", value: "other" },
        { label: "Lieber nicht angeben", value: "prefer_not_to_say" }
    ];

    protected readonly profileForm = this.fb.group({
        bio: ["", Validators.maxLength(500)],
        birthday: [null as Date | null],
        displayName: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
        gender: [""],
        location: ["", Validators.maxLength(100)],
        website: ["", Validators.maxLength(255)],
        signature: ["", Validators.maxLength(300)]
    });

    protected readonly passwordForm = this.fb.group(
        {
            confirmPassword: ["", Validators.required],
            currentPassword: ["", Validators.required],
            newPassword: ["", [Validators.required, Validators.minLength(8)]]
        },
        { validators: passwordMatchValidator }
    );

    constructor() {
        effect(() => {
            const u = this.user();
            if (u) {
                this.profileForm.patchValue({
                    bio: u.bio ?? "",
                    birthday: u.birthday ? new Date(u.birthday) : null,
                    displayName: u.displayName,
                    gender: u.gender ?? "",
                    location: u.location ?? "",
                    website: u.website ?? "",
                    signature: u.signature ?? ""
                });
                this.profileForm.markAsPristine();
            }
        });
    }

    protected userInitial(): string {
        const u = this.user();
        return (u?.displayName ?? u?.username ?? "?").charAt(0).toUpperCase();
    }

    protected roleLabel(): string {
        return ROLE_LABELS[this.user()?.role ?? "guest"];
    }

    protected roleSeverity(): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        return ROLE_SEVERITIES[this.user()?.role ?? "guest"];
    }

    protected formatDate(dateStr?: string | null): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
    }

    protected saveProfile(): void {
        if (this.profileForm.invalid) return;
        this.saving.set(true);
        this.profileSuccess.set(null);
        this.profileError.set(null);

        const rawBirthday = this.profileForm.value.birthday;
        const payload: UpdateProfilePayload = {
            bio: this.profileForm.value.bio ?? "",
            birthday: rawBirthday ? (rawBirthday as Date).toISOString().split("T")[0] : "",
            displayName: this.profileForm.value.displayName!,
            gender: this.profileForm.value.gender ?? "",
            location: this.profileForm.value.location ?? "",
            website: this.profileForm.value.website ?? "",
            signature: this.profileForm.value.signature ?? ""
        };

        this.authFacade.updateProfile(payload).subscribe({
            next: () => {
                this.profileSuccess.set("Profil erfolgreich gespeichert.");
                this.profileForm.markAsPristine();
                this.saving.set(false);
            },
            error: () => {
                this.profileError.set("Fehler beim Speichern. Bitte versuche es erneut.");
                this.saving.set(false);
            }
        });
    }

    protected changePassword(): void {
        if (this.passwordForm.invalid) return;
        this.savingPassword.set(true);
        this.passwordSuccess.set(null);
        this.passwordError.set(null);

        const payload: ChangePasswordPayload = {
            currentPassword: this.passwordForm.value.currentPassword!,
            newPassword: this.passwordForm.value.newPassword!
        };

        this.authFacade.changePassword(payload).subscribe({
            next: () => {
                this.passwordSuccess.set("Passwort erfolgreich geändert.");
                this.passwordForm.reset();
                this.savingPassword.set(false);
            },
            error: () => {
                this.passwordError.set("Fehler beim Ändern des Passworts. Prüfe dein aktuelles Passwort.");
                this.savingPassword.set(false);
            }
        });
    }
}
