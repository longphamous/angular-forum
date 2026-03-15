import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit, signal } from "@angular/core";
import {
    AbstractControl,
    FormBuilder,
    FormsModule,
    ReactiveFormsModule,
    ValidationErrors,
    Validators
} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DatePickerModule } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { Subscription } from "rxjs";

import { ACHIEVEMENT_ROUTES } from "../../../core/api/achievement.routes";
import { SHOP_ROUTES } from "../../../core/api/shop.routes";
import { AchievementCard } from "../../../core/components/achievement-badge/achievement-badge";
import { LevelProgress } from "../../../core/components/level-badge/level-badge";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { UserAchievement } from "../../../core/models/gamification/achievement";
import { UserInventoryItem } from "../../../core/models/shop/shop";
import { UserRole } from "../../../core/models/user/user";
import { WalletTransaction } from "../../../core/models/wallet/wallet";
import { AuthFacade, ChangePasswordPayload, UpdateProfilePayload } from "../../../facade/auth/auth-facade";
import { WalletFacade } from "../../../facade/wallet/wallet-facade";

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPw = group.get("newPassword")?.value as string;
    const confirm = group.get("confirmPassword")?.value as string;
    return newPw && confirm && newPw !== confirm ? { passwordMismatch: true } : null;
}

const ROLE_SEVERITIES: Record<UserRole, "success" | "info" | "warn" | "danger" | "secondary" | "contrast"> = {
    admin: "danger",
    moderator: "warn",
    member: "success",
    guest: "secondary"
};

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AchievementCard,
        AvatarModule,
        ButtonModule,
        CardModule,
        DatePickerModule,
        DialogModule,
        DividerModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        LevelProgress,
        MessageModule,
        PasswordModule,
        ReactiveFormsModule,
        RouterModule,
        SelectModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        TextareaModule,
        TooltipModule,
        TranslocoModule
    ],
    selector: "app-profile-page",
    template: `
        <div class="mx-auto max-w-3xl" *transloco="let t">
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
                                {{ t("profile.header.memberSince") }} {{ formatDate(user()?.createdAt) }}
                            </span>
                            @if (user()?.lastLoginAt) {
                                <span class="flex items-center gap-1">
                                    <i class="pi pi-clock"></i>
                                    {{ formatDate(user()?.lastLoginAt) }}
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
                        @if (walletFacade.wallet()) {
                            <div class="mt-2 flex items-center gap-1.5">
                                <i class="pi pi-wallet text-sm text-yellow-500"></i>
                                <span class="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{{
                                    walletFacade.wallet()!.balance
                                }}</span>
                                <span class="text-surface-400 text-xs">{{ t("wallet.currency") }}</span>
                            </div>
                        }
                    </div>
                </div>
            </p-card>

            <!-- Tabs -->
            <p-tabs value="overview">
                <p-tablist>
                    <p-tab value="overview"> <i class="pi pi-user mr-2"></i>{{ t("profile.tabs.profile") }} </p-tab>
                    <p-tab value="achievements">
                        <i class="pi pi-trophy mr-2"></i>{{ t("profile.tabs.achievements") }}
                        @if (achievements().length > 0) {
                            <span
                                class="bg-primary/15 text-primary ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                                >{{ achievements().length }}</span
                            >
                        }
                    </p-tab>
                    <p-tab value="edit"> <i class="pi pi-pencil mr-2"></i>{{ t("profile.header.editTitle") }} </p-tab>
                    <p-tab value="wallet"> <i class="pi pi-wallet mr-2"></i>{{ t("profile.tabs.wallet") }} </p-tab>
                    <p-tab value="preferences">
                        <i class="pi pi-cog mr-2"></i>{{ t("profile.tabs.preferences") }}
                    </p-tab>
                    <p-tab value="inventory">
                        <i class="pi pi-shopping-bag mr-2"></i>{{ t("profile.tabs.inventory") }}
                        @if (inventory().length > 0) {
                            <span
                                class="bg-primary/15 text-primary ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold"
                                >{{ inventory().length }}</span
                            >
                        }
                    </p-tab>
                    <p-tab value="security"> <i class="pi pi-lock mr-2"></i>{{ t("profile.tabs.security") }} </p-tab>
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
                                        {{ t("profile.header.username") }}
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
                                        {{ t("adminUsers.table.role") }}
                                    </div>
                                    <p-tag [severity]="roleSeverity()" [value]="roleLabel()" styleClass="text-xs" />
                                </div>
                                <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                    <div
                                        class="text-surface-500 dark:text-surface-400 mb-1 text-xs font-medium tracking-wide uppercase"
                                    >
                                        {{ t("adminUsers.table.status") }}
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
                                        {{ t("profile.form.bio") }}
                                    </div>
                                    <p class="text-surface-700 dark:text-surface-300 text-sm leading-relaxed">
                                        {{ user()?.bio }}
                                    </p>
                                </div>
                            }
                        </div>
                    </p-tabpanel>

                    <!-- Achievements -->
                    <p-tabpanel value="achievements">
                        <div class="pt-2">
                            @if (achievementsLoading()) {
                                <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    @for (_ of [1, 2, 3, 4, 5]; track $index) {
                                        <p-skeleton height="6rem" styleClass="rounded-xl" />
                                    }
                                </div>
                            } @else if (achievements().length === 0) {
                                <div class="flex flex-col items-center justify-center py-12 text-center">
                                    <i class="pi pi-trophy text-surface-300 mb-3 text-4xl"></i>
                                    <p class="text-surface-500 text-sm">
                                        {{ t("profile.achievements.noAchievements") }}
                                    </p>
                                </div>
                            } @else {
                                <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    @for (a of achievements(); track a.id) {
                                        <achievement-card [achievement]="a" />
                                    }
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
                                    {{ t("profile.form.displayName") }}
                                </label>
                                <input
                                    class="w-full"
                                    id="displayName"
                                    [class.ng-invalid]="
                                        profileForm.get('displayName')?.invalid &&
                                        profileForm.get('displayName')?.touched
                                    "
                                    [placeholder]="t('profile.form.displayName')"
                                    formControlName="displayName"
                                    pInputText
                                    type="text"
                                />
                                @if (
                                    profileForm.get("displayName")?.errors?.["required"] &&
                                    profileForm.get("displayName")?.touched
                                ) {
                                    <small class="text-red-500">{{
                                        t("profile.form.requiredField", { field: t("profile.form.displayName") })
                                    }}</small>
                                }
                                @if (
                                    profileForm.get("displayName")?.errors?.["minlength"] &&
                                    profileForm.get("displayName")?.touched
                                ) {
                                    <small class="text-red-500">{{ t("profile.form.minLength", { min: 2 }) }}</small>
                                }
                            </div>

                            <div class="flex flex-col gap-2">
                                <label class="text-surface-700 dark:text-surface-300 text-sm font-medium" for="bio">
                                    {{ t("profile.form.bio") }}
                                    <span class="text-surface-400 font-normal">({{ t("common.optional") }})</span>
                                </label>
                                <textarea
                                    class="w-full"
                                    id="bio"
                                    [autoResize]="true"
                                    [placeholder]="t('profile.form.bioPlaceholder')"
                                    formControlName="bio"
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
                                        {{ t("profile.form.gender") }}
                                        <span class="text-surface-400 font-normal">({{ t("common.optional") }})</span>
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
                                        {{ t("profile.form.birthday") }}
                                        <span class="text-surface-400 font-normal">({{ t("common.optional") }})</span>
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
                                        {{ t("profile.form.location") }}
                                        <span class="text-surface-400 font-normal">({{ t("common.optional") }})</span>
                                    </label>
                                    <input
                                        class="w-full"
                                        id="location"
                                        [placeholder]="t('profile.form.locationPlaceholder')"
                                        formControlName="location"
                                        pInputText
                                        type="text"
                                    />
                                </div>

                                <div class="flex flex-col gap-2">
                                    <label
                                        class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                        for="website"
                                    >
                                        {{ t("profile.form.website") }}
                                        <span class="text-surface-400 font-normal">({{ t("common.optional") }})</span>
                                    </label>
                                    <input
                                        class="w-full"
                                        id="website"
                                        [placeholder]="t('profile.form.websitePlaceholder')"
                                        formControlName="website"
                                        pInputText
                                        type="url"
                                    />
                                </div>
                            </div>

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="signature"
                                >
                                    {{ t("profile.form.signature") }}
                                    <span class="text-surface-400 font-normal">({{ t("common.optional") }})</span>
                                </label>
                                <textarea
                                    class="w-full"
                                    id="signature"
                                    [autoResize]="true"
                                    [placeholder]="t('profile.form.signaturePlaceholder')"
                                    formControlName="signature"
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
                                    [label]="t('profile.form.saveBtn')"
                                    [loading]="saving()"
                                    icon="pi pi-check"
                                    type="submit"
                                />
                            </div>
                        </form>
                    </p-tabpanel>

                    <!-- Wallet -->
                    <p-tabpanel value="wallet">
                        <div class="flex flex-col gap-5 pt-2">
                            <!-- Balance card -->
                            @if (walletFacade.walletLoading()) {
                                <p-skeleton height="6rem" styleClass="rounded-xl" />
                            } @else if (walletFacade.wallet()) {
                                <div
                                    class="from-primary/10 to-primary/5 border-primary/20 rounded-xl border bg-gradient-to-br p-5"
                                >
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p
                                                class="text-surface-500 dark:text-surface-400 mb-1 text-xs font-medium tracking-wide uppercase"
                                            >
                                                {{ t("wallet.balance") }}
                                            </p>
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-wallet text-primary text-2xl"></i>
                                                <span class="text-primary text-3xl font-bold">{{
                                                    walletFacade.wallet()!.balance
                                                }}</span>
                                                <span class="text-surface-400 text-sm">{{ t("wallet.currency") }}</span>
                                            </div>
                                        </div>
                                        <p-button
                                            [label]="t('wallet.transfer')"
                                            (onClick)="openTransferDialog()"
                                            icon="pi pi-arrow-right-arrow-left"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            }

                            <!-- Transaction history -->
                            <div>
                                <h3 class="text-surface-900 dark:text-surface-0 mb-3 text-sm font-semibold">
                                    {{ t("wallet.history") }}
                                </h3>
                                @if (walletFacade.transactionsLoading()) {
                                    <div class="flex flex-col gap-2">
                                        @for (_ of [1, 2, 3, 4, 5]; track $index) {
                                            <p-skeleton height="3rem" styleClass="rounded-lg" />
                                        }
                                    </div>
                                } @else if (walletFacade.transactions().length === 0) {
                                    <div class="text-surface-400 py-8 text-center text-sm">
                                        <i class="pi pi-inbox mb-2 block text-2xl"></i>
                                        {{ t("wallet.noTransactions") }}
                                    </div>
                                } @else {
                                    <div class="flex flex-col gap-2">
                                        @for (tx of walletFacade.transactions(); track tx.id) {
                                            <div
                                                class="border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800/50 flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                                            >
                                                <div
                                                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                                    [class]="txIconBg(tx)"
                                                >
                                                    <i class="text-sm" [class]="txIcon(tx)"></i>
                                                </div>
                                                <div class="min-w-0 flex-1">
                                                    <p
                                                        class="text-surface-800 dark:text-surface-100 m-0 text-sm font-medium"
                                                    >
                                                        {{ tx.description }}
                                                    </p>
                                                    <p class="text-surface-400 m-0 text-xs">
                                                        {{ formatDate(tx.createdAt) }}
                                                    </p>
                                                </div>
                                                <span
                                                    class="shrink-0 text-sm font-semibold"
                                                    [class]="txAmountClass(tx)"
                                                >
                                                    {{ txSign(tx) }}{{ tx.amount }} {{ t("wallet.currency") }}
                                                </span>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        </div>

                        <!-- Transfer dialog -->
                        <p-dialog
                            [(visible)]="transferDialogVisible"
                            [closable]="!walletFacade.transferring()"
                            [header]="t('wallet.transferDialog.title')"
                            [modal]="true"
                            [style]="{ width: '420px' }"
                        >
                            <div class="flex flex-col gap-4 pt-2">
                                @if (transferError()) {
                                    <p-message [text]="transferError()!" severity="error" styleClass="w-full" />
                                }
                                <div class="flex flex-col gap-1">
                                    <label class="text-sm font-medium" for="transfer-to-user-id"
                                        >{{ t("wallet.transferDialog.toUserId") }}
                                        <span class="text-red-500">*</span></label
                                    >
                                    <input
                                        class="w-full"
                                        id="transfer-to-user-id"
                                        [(ngModel)]="transferToUserId"
                                        [placeholder]="t('wallet.transferDialog.toUserIdPlaceholder')"
                                        pInputText
                                    />
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-sm font-medium" for="transfer-amount"
                                        >{{ t("wallet.transferDialog.amount") }}
                                        <span class="text-red-500">*</span></label
                                    >
                                    <p-inputnumber
                                        [(ngModel)]="transferAmount"
                                        [max]="walletFacade.wallet()?.balance ?? 0"
                                        [min]="1"
                                        [showButtons]="true"
                                        buttonLayout="horizontal"
                                        decrementButtonIcon="pi pi-minus"
                                        incrementButtonIcon="pi pi-plus"
                                        inputId="transfer-amount"
                                        inputStyleClass="w-16 text-center"
                                        styleClass="w-full"
                                    />
                                </div>
                                <div class="flex flex-col gap-1">
                                    <label class="text-sm font-medium" for="transfer-description">{{
                                        t("wallet.transferDialog.description")
                                    }}</label>
                                    <input
                                        class="w-full"
                                        id="transfer-description"
                                        [(ngModel)]="transferNote"
                                        [placeholder]="t('wallet.transferDialog.descriptionPlaceholder')"
                                        pInputText
                                    />
                                </div>
                            </div>
                            <ng-template #footer>
                                <p-button
                                    [disabled]="walletFacade.transferring()"
                                    [label]="t('common.cancel')"
                                    [text]="true"
                                    (onClick)="transferDialogVisible = false"
                                    severity="secondary"
                                />
                                <p-button
                                    [disabled]="!transferToUserId || !transferAmount"
                                    [label]="t('wallet.transferDialog.submit')"
                                    [loading]="walletFacade.transferring()"
                                    (onClick)="submitTransfer()"
                                    icon="pi pi-send"
                                />
                            </ng-template>
                        </p-dialog>
                    </p-tabpanel>

                    <!-- Einstellungen -->
                    <p-tabpanel value="preferences">
                        <div class="flex flex-col gap-6 pt-2">
                            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-5">
                                <h3 class="text-surface-900 dark:text-surface-0 mb-4 text-sm font-semibold">
                                    {{ t("profile.preferences.title") }}
                                </h3>
                                <div class="flex flex-col gap-2">
                                    <label
                                        class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                        for="pref-language"
                                    >
                                        {{ t("profile.preferences.language") }}
                                    </label>
                                    <p-select
                                        [ngModel]="activeLang()"
                                        [options]="languageOptions"
                                        (ngModelChange)="changeLanguage($event)"
                                        inputId="pref-language"
                                        optionLabel="label"
                                        optionValue="value"
                                        styleClass="w-full sm:w-64"
                                    />
                                    <small class="text-surface-400 dark:text-surface-500">
                                        {{ t("profile.preferences.languageHint") }}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Inventar -->
                    <p-tabpanel value="inventory">
                        <div class="pt-2">
                            @if (inventoryLoading()) {
                                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                    @for (_ of [1, 2, 3, 4]; track $index) {
                                        <p-skeleton height="8rem" styleClass="rounded-xl" />
                                    }
                                </div>
                            } @else if (inventory().length === 0) {
                                <div class="flex flex-col items-center justify-center py-12 text-center">
                                    <i class="pi pi-shopping-bag text-surface-300 mb-3 text-4xl"></i>
                                    <p class="text-surface-500 text-sm">{{ t("shop.inventoryEmpty") }}</p>
                                    <a class="text-primary mt-3 text-sm hover:underline" routerLink="/shop">
                                        {{ t("shop.title") }}
                                    </a>
                                </div>
                            } @else {
                                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                    @for (entry of inventory(); track entry.id) {
                                        <div
                                            class="bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 flex flex-col items-center gap-2 rounded-xl border p-4 text-center"
                                        >
                                            @if (entry.item.imageUrl) {
                                                <img
                                                    class="h-12 w-12 rounded-lg object-cover"
                                                    [alt]="entry.item.name"
                                                    [src]="entry.item.imageUrl"
                                                />
                                            } @else {
                                                <div
                                                    class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg"
                                                >
                                                    <i
                                                        [class]="
                                                            'text-primary text-2xl ' + (entry.item.icon || 'pi pi-star')
                                                        "
                                                    ></i>
                                                </div>
                                            }
                                            <div
                                                class="text-surface-900 dark:text-surface-0 text-xs leading-snug font-medium"
                                            >
                                                {{ entry.item.name }}
                                            </div>
                                            @if (entry.quantity > 1) {
                                                <span
                                                    class="bg-primary/15 text-primary rounded-full px-2 py-0.5 text-xs font-semibold"
                                                    >×{{ entry.quantity }}</span
                                                >
                                            }
                                        </div>
                                    }
                                </div>
                            }
                        </div>
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
                                    {{ t("profile.security.currentPassword") }}
                                </label>
                                <p-password
                                    [feedback]="false"
                                    [placeholder]="t('profile.security.currentPassword')"
                                    [toggleMask]="true"
                                    formControlName="currentPassword"
                                    inputId="currentPassword"
                                    inputStyleClass="w-full"
                                    styleClass="w-full"
                                />
                                @if (
                                    passwordForm.get("currentPassword")?.errors?.["required"] &&
                                    passwordForm.get("currentPassword")?.touched
                                ) {
                                    <small class="text-red-500">{{
                                        t("profile.form.requiredField", {
                                            field: t("profile.security.currentPassword")
                                        })
                                    }}</small>
                                }
                            </div>

                            <p-divider />

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="newPassword"
                                >
                                    {{ t("profile.security.newPassword") }}
                                </label>
                                <p-password
                                    [mediumLabel]="t('profile.security.mediumLabel')"
                                    [placeholder]="t('profile.security.newPassword')"
                                    [promptLabel]="t('profile.security.promptLabel')"
                                    [strongLabel]="t('profile.security.strongLabel')"
                                    [toggleMask]="true"
                                    [weakLabel]="t('profile.security.weakLabel')"
                                    formControlName="newPassword"
                                    inputId="newPassword"
                                    inputStyleClass="w-full"
                                    styleClass="w-full"
                                />
                                @if (
                                    passwordForm.get("newPassword")?.errors?.["required"] &&
                                    passwordForm.get("newPassword")?.touched
                                ) {
                                    <small class="text-red-500">{{
                                        t("profile.form.requiredField", { field: t("profile.security.newPassword") })
                                    }}</small>
                                }
                                @if (
                                    passwordForm.get("newPassword")?.errors?.["minlength"] &&
                                    passwordForm.get("newPassword")?.touched
                                ) {
                                    <small class="text-red-500">{{ t("profile.form.minLength", { min: 8 }) }}</small>
                                }
                            </div>

                            <div class="flex flex-col gap-2">
                                <label
                                    class="text-surface-700 dark:text-surface-300 text-sm font-medium"
                                    for="confirmPassword"
                                >
                                    {{ t("profile.security.confirmPassword") }}
                                </label>
                                <p-password
                                    [feedback]="false"
                                    [placeholder]="t('profile.security.confirmPassword')"
                                    [toggleMask]="true"
                                    formControlName="confirmPassword"
                                    inputId="confirmPassword"
                                    inputStyleClass="w-full"
                                    styleClass="w-full"
                                />
                                @if (
                                    passwordForm.errors?.["passwordMismatch"] &&
                                    passwordForm.get("confirmPassword")?.touched
                                ) {
                                    <small class="text-red-500">{{ t("profile.security.mismatch") }}</small>
                                }
                            </div>

                            <div class="flex justify-end">
                                <p-button
                                    [disabled]="passwordForm.invalid"
                                    [label]="t('profile.security.submit')"
                                    [loading]="savingPassword()"
                                    icon="pi pi-lock"
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
export class ProfilePage implements OnInit, OnDestroy {
    private readonly authFacade = inject(AuthFacade);
    private readonly fb = inject(FormBuilder);
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly translocoService = inject(TranslocoService);
    private readonly langChangesSubscription: Subscription;

    protected readonly walletFacade = inject(WalletFacade);

    protected transferDialogVisible = false;
    protected transferToUserId = "";
    protected transferAmount = 1;
    protected transferNote = "";
    protected readonly transferError = signal<string | null>(null);

    protected readonly user = this.authFacade.currentUser;
    protected readonly activeLang = signal(this.translocoService.getActiveLang());
    protected readonly languageOptions = [
        { label: "Deutsch", value: "de" },
        { label: "English", value: "en" }
    ];

    protected readonly achievements = signal<UserAchievement[]>([]);
    protected readonly achievementsLoading = signal(false);
    protected readonly inventory = signal<UserInventoryItem[]>([]);
    protected readonly inventoryLoading = signal(false);

    protected readonly saving = signal(false);
    protected readonly savingPassword = signal(false);
    protected readonly profileSuccess = signal<string | null>(null);
    protected readonly profileError = signal<string | null>(null);
    protected readonly passwordSuccess = signal<string | null>(null);
    protected readonly passwordError = signal<string | null>(null);

    protected readonly today = new Date();

    protected genderOptions: { label: string; value: string }[] = [];

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
        this.buildGenderOptions();
        this.langChangesSubscription = this.translocoService.langChanges$.subscribe((lang) => {
            this.activeLang.set(lang);
            this.buildGenderOptions();
        });

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

    ngOnInit(): void {
        const userId = this.user()?.id;
        if (userId) {
            this.achievementsLoading.set(true);
            this.http.get<UserAchievement[]>(`${this.apiConfig.baseUrl}${ACHIEVEMENT_ROUTES.user(userId)}`).subscribe({
                next: (data) => {
                    this.achievements.set(data);
                    this.achievementsLoading.set(false);
                },
                error: () => this.achievementsLoading.set(false)
            });
            this.inventoryLoading.set(true);
            this.http.get<UserInventoryItem[]>(`${this.apiConfig.baseUrl}${SHOP_ROUTES.inventory()}`).subscribe({
                next: (data) => {
                    this.inventory.set(data);
                    this.inventoryLoading.set(false);
                },
                error: () => this.inventoryLoading.set(false)
            });
            this.walletFacade.loadWallet();
            this.walletFacade.loadTransactions();
        }
    }

    ngOnDestroy(): void {
        this.langChangesSubscription.unsubscribe();
    }

    private buildGenderOptions(): void {
        this.genderOptions = [
            { label: this.translocoService.translate("profile.genders.prefer_not_to_say"), value: "" },
            { label: this.translocoService.translate("profile.genders.male"), value: "male" },
            { label: this.translocoService.translate("profile.genders.female"), value: "female" },
            { label: this.translocoService.translate("profile.genders.other"), value: "other" },
            { label: this.translocoService.translate("profile.genders.prefer_not_to_say"), value: "prefer_not_to_say" }
        ];
    }

    protected changeLanguage(lang: string): void {
        localStorage.setItem("lang", lang);
        this.translocoService.setActiveLang(lang);
    }

    protected userInitial(): string {
        const u = this.user();
        return (u?.displayName ?? u?.username ?? "?").charAt(0).toUpperCase();
    }

    protected roleLabel(): string {
        return this.translocoService.translate("userProfile.roles." + (this.user()?.role ?? "guest"));
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
                this.profileSuccess.set(this.translocoService.translate("profile.form.successMsg"));
                this.profileForm.markAsPristine();
                this.saving.set(false);
            },
            error: () => {
                this.profileError.set(this.translocoService.translate("common.saveError"));
                this.saving.set(false);
            }
        });
    }

    protected openTransferDialog(): void {
        this.transferToUserId = "";
        this.transferAmount = 1;
        this.transferNote = "";
        this.transferError.set(null);
        this.transferDialogVisible = true;
    }

    protected submitTransfer(): void {
        this.transferError.set(null);
        this.walletFacade
            .transfer(this.transferToUserId, this.transferAmount, this.transferNote || undefined)
            .subscribe({
                next: () => {
                    this.transferDialogVisible = false;
                },
                error: () => {
                    this.transferError.set(this.translocoService.translate("wallet.transferError"));
                }
            });
    }

    protected txIcon(tx: WalletTransaction): string {
        const userId = this.user()?.id;
        switch (tx.type) {
            case "transfer":
                return tx.fromUserId === userId
                    ? "pi pi-arrow-up-right text-red-500"
                    : "pi pi-arrow-down-left text-green-500";
            case "deposit":
                return "pi pi-plus text-green-500";
            case "withdrawal":
                return "pi pi-minus text-red-500";
            case "reward":
                return "pi pi-star-fill text-yellow-500";
            case "lotto_win":
                return "pi pi-trophy text-yellow-500";
            case "lotto_ticket":
                return "pi pi-ticket text-orange-500";
            default:
                return "pi pi-wallet text-primary";
        }
    }

    protected txIconBg(tx: WalletTransaction): string {
        const userId = this.user()?.id;
        if (tx.type === "transfer" && tx.fromUserId === userId) return "bg-red-50 dark:bg-red-900/20";
        if (tx.type === "withdrawal" || tx.type === "lotto_ticket") return "bg-red-50 dark:bg-red-900/20";
        return "bg-green-50 dark:bg-green-900/20";
    }

    protected txSign(tx: WalletTransaction): string {
        const userId = this.user()?.id;
        if (tx.type === "withdrawal" || tx.type === "lotto_ticket") return "-";
        if (tx.type === "transfer" && tx.fromUserId === userId) return "-";
        return "+";
    }

    protected txAmountClass(tx: WalletTransaction): string {
        const userId = this.user()?.id;
        if (tx.type === "withdrawal" || tx.type === "lotto_ticket") return "text-red-500";
        if (tx.type === "transfer" && tx.fromUserId === userId) return "text-red-500";
        return "text-green-600 dark:text-green-400";
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
                this.passwordSuccess.set(this.translocoService.translate("profile.security.successMsg"));
                this.passwordForm.reset();
                this.savingPassword.set(false);
            },
            error: () => {
                this.passwordError.set(this.translocoService.translate("profile.security.changeError"));
                this.savingPassword.set(false);
            }
        });
    }
}
