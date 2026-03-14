import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { Subscription } from "rxjs";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";
import { PopoverModule } from "primeng/popover";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";

import { AdminCreateUserPayload, AdminFacade, AdminUpdateUserPayload } from "../../../facade/admin/admin-facade";
import { UserProfile, UserRole, UserStatus } from "../../../core/models/user/user";

interface SelectOption<T> {
    label: string;
    value: T;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AvatarModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        MessageModule,
        PasswordModule,
        PopoverModule,
        ReactiveFormsModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TooltipModule,
        TranslocoModule
    ],
    selector: "app-admin-users",
    template: `
        <div class="card" *transloco="let t">
            <!-- Header -->
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 class="m-0 text-2xl font-bold">{{ t('adminUsers.title') }}</h2>
                    @if (facade.users().length > 0) {
                        <p class="text-surface-500 mb-0 mt-1 text-sm">{{ t('adminUsers.users_count', { count: facade.users().length }) }}</p>
                    }
                </div>
                <p-button
                    icon="pi pi-plus"
                    [label]="t('adminUsers.createUser')"
                    (onClick)="openCreateDialog()"
                />
            </div>

            @if (facade.usersError()) {
                <p-message [text]="facade.usersError()!" severity="error" styleClass="mb-4 w-full" />
            }

            <p-table
                [value]="facade.users()"
                [loading]="facade.usersLoading()"
                [rowHover]="true"
                [scrollable]="true"
                dataKey="id"
                styleClass="p-datatable-sm"
            >
                <ng-template #header>
                    <tr>
                        <th style="min-width:14rem">{{ t('adminUsers.table.user') }}</th>
                        <th style="min-width:14rem">{{ t('adminUsers.table.email') }}</th>
                        <th style="width:8rem">{{ t('adminUsers.table.role') }}</th>
                        <th style="width:8rem">{{ t('adminUsers.table.status') }}</th>
                        <th style="width:11rem">{{ t('adminUsers.table.registered') }}</th>
                        <th style="width:11rem">{{ t('adminUsers.table.lastLogin') }}</th>
                        <th style="width:7rem" class="text-center">{{ t('common.actions') }}</th>
                    </tr>
                </ng-template>

                <ng-template #body let-user>
                    <tr>
                        <!-- User -->
                        <td>
                            <div class="flex items-center gap-3">
                                <p-avatar
                                    [label]="user.displayName?.charAt(0)?.toUpperCase()"
                                    [image]="user.avatarUrl || undefined"
                                    shape="circle"
                                    size="normal"
                                    styleClass="flex-shrink-0"
                                />
                                <div class="min-w-0">
                                    <div class="truncate text-sm font-semibold">{{ user.displayName }}</div>
                                    <div class="text-surface-400 truncate text-xs">@{{ user.username }}</div>
                                </div>
                            </div>
                        </td>

                        <!-- Email -->
                        <td class="text-surface-600 dark:text-surface-300 truncate text-sm">{{ user.email }}</td>

                        <!-- Role -->
                        <td>
                            <p-tag [value]="user.role" [severity]="roleSeverity(user.role)" styleClass="text-xs" />
                        </td>

                        <!-- Status -->
                        <td>
                            <p-tag [value]="statusLabel(user.status)" [severity]="statusSeverity(user.status)" styleClass="text-xs" />
                        </td>

                        <!-- Created -->
                        <td class="text-surface-500 text-xs">{{ formatDate(user.createdAt) }}</td>

                        <!-- Last Login -->
                        <td class="text-surface-500 text-xs">{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : '—' }}</td>

                        <!-- Actions -->
                        <td class="text-center">
                            <div class="flex items-center justify-center gap-1">
                                <p-button
                                    icon="pi pi-pencil"
                                    severity="secondary"
                                    size="small"
                                    [text]="true"
                                    [pTooltip]="t('common.edit')"
                                    (onClick)="openEditDialog(user)"
                                />
                                <p-button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    size="small"
                                    [text]="true"
                                    [pTooltip]="t('common.delete')"
                                    [loading]="deletingId() === user.id"
                                    (onClick)="confirmDelete(user)"
                                />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #loadingbody>
                    <tr>
                        <td>
                            <div class="flex items-center gap-3">
                                <p-skeleton shape="circle" size="2rem" />
                                <div class="flex-1">
                                    <p-skeleton height="0.875rem" styleClass="mb-1" width="70%" />
                                    <p-skeleton height="0.75rem" width="50%" />
                                </div>
                            </div>
                        </td>
                        <td><p-skeleton height="1rem" width="80%" /></td>
                        <td><p-skeleton height="1.5rem" width="4rem" /></td>
                        <td><p-skeleton height="1.5rem" width="4rem" /></td>
                        <td><p-skeleton height="1rem" width="6rem" /></td>
                        <td><p-skeleton height="1rem" width="6rem" /></td>
                        <td><p-skeleton height="2rem" width="4rem" styleClass="mx-auto" /></td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7">
                            <div class="text-surface-400 flex flex-col items-center justify-center py-12">
                                <i class="pi pi-users mb-3 text-5xl"></i>
                                <span>{{ t('adminUsers.table.noUsers') }}</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create Dialog -->
        <p-dialog
            [(visible)]="createDialogVisible"
            [modal]="true"
            [style]="{ width: '32rem' }"
            [header]="translocoService.translate('adminUsers.createDialog.header')"
            (onHide)="resetCreateForm()"
        >
            <form [formGroup]="createForm" (ngSubmit)="submitCreate()" class="flex flex-col gap-4 pt-2">
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-500 text-xs font-medium">
                            {{ translocoService.translate('adminUsers.createDialog.username') }} <span class="text-red-400">*</span>
                        </label>
                        <input
                            pInputText
                            formControlName="username"
                            [placeholder]="translocoService.translate('adminUsers.createDialog.usernamePlaceholder')"
                            class="w-full"
                        />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-500 text-xs font-medium">{{ translocoService.translate('adminUsers.createDialog.displayName') }}</label>
                        <input
                            pInputText
                            formControlName="displayName"
                            [placeholder]="translocoService.translate('adminUsers.createDialog.displayNamePlaceholder')"
                            class="w-full"
                        />
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-surface-500 text-xs font-medium">
                        {{ translocoService.translate('adminUsers.createDialog.email') }} <span class="text-red-400">*</span>
                    </label>
                    <input
                        pInputText
                        formControlName="email"
                        type="email"
                        [placeholder]="translocoService.translate('adminUsers.createDialog.emailPlaceholder')"
                        class="w-full"
                    />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-surface-500 text-xs font-medium">
                        {{ translocoService.translate('adminUsers.createDialog.password') }} <span class="text-red-400">*</span>
                    </label>
                    <p-password
                        formControlName="password"
                        [placeholder]="translocoService.translate('adminUsers.createDialog.passwordPlaceholder')"
                        [feedback]="true"
                        [toggleMask]="true"
                        styleClass="w-full"
                        inputStyleClass="w-full"
                    />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-500 text-xs font-medium">{{ translocoService.translate('adminUsers.createDialog.role') }}</label>
                        <p-select
                            formControlName="role"
                            [options]="roleOptions"
                            optionLabel="label"
                            optionValue="value"
                            styleClass="w-full"
                        />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-500 text-xs font-medium">{{ translocoService.translate('adminUsers.createDialog.status') }}</label>
                        <p-select
                            formControlName="status"
                            [options]="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            styleClass="w-full"
                        />
                    </div>
                </div>

                @if (createError()) {
                    <p-message severity="error" [text]="createError()!" styleClass="w-full" />
                }
            </form>

            <ng-template #footer>
                <p-button
                    [label]="translocoService.translate('common.cancel')"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="createDialogVisible = false"
                />
                <p-button
                    [label]="translocoService.translate('adminUsers.createDialog.submit')"
                    icon="pi pi-check"
                    [loading]="creating()"
                    [disabled]="createForm.invalid"
                    (onClick)="submitCreate()"
                />
            </ng-template>
        </p-dialog>

        <!-- Edit Dialog -->
        <p-dialog
            [(visible)]="editDialogVisible"
            [modal]="true"
            [style]="{ width: '28rem' }"
            [header]="translocoService.translate('adminUsers.editDialog.header') + ' ' + (editingUser()?.username ?? '')"
            (onHide)="resetEditForm()"
        >
            <form [formGroup]="editForm" (ngSubmit)="submitEdit()" class="flex flex-col gap-4 pt-2">
                <div class="flex flex-col gap-1">
                    <label class="text-surface-500 text-xs font-medium">{{ translocoService.translate('adminUsers.editDialog.displayName') }}</label>
                    <input pInputText formControlName="displayName" class="w-full" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-500 text-xs font-medium">{{ translocoService.translate('adminUsers.editDialog.role') }}</label>
                        <p-select
                            formControlName="role"
                            [options]="roleOptions"
                            optionLabel="label"
                            optionValue="value"
                            styleClass="w-full"
                        />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-surface-500 text-xs font-medium">{{ translocoService.translate('adminUsers.editDialog.status') }}</label>
                        <p-select
                            formControlName="status"
                            [options]="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            styleClass="w-full"
                        />
                    </div>
                </div>

                @if (editError()) {
                    <p-message severity="error" [text]="editError()!" styleClass="w-full" />
                }
            </form>

            <ng-template #footer>
                <p-button
                    [label]="translocoService.translate('common.cancel')"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="editDialogVisible = false"
                />
                <p-button
                    [label]="translocoService.translate('common.save')"
                    icon="pi pi-check"
                    [loading]="editing()"
                    (onClick)="submitEdit()"
                />
            </ng-template>
        </p-dialog>

        <!-- Delete Confirm Dialog -->
        <p-dialog
            [(visible)]="deleteDialogVisible"
            [modal]="true"
            [style]="{ width: '24rem' }"
            [header]="translocoService.translate('adminUsers.deleteDialog.header')"
        >
            <p class="text-surface-600 dark:text-surface-300 m-0 text-sm">
                Benutzer <strong>{{ deletingUser()?.username }}</strong> wirklich löschen?
                Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            <ng-template #footer>
                <p-button
                    [label]="translocoService.translate('common.cancel')"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="deleteDialogVisible = false"
                />
                <p-button
                    [label]="translocoService.translate('common.delete')"
                    icon="pi pi-trash"
                    severity="danger"
                    [loading]="deletingId() !== null"
                    (onClick)="executeDelete()"
                />
            </ng-template>
        </p-dialog>
    `
})
export class AdminUsers implements OnInit, OnDestroy {
    protected readonly facade = inject(AdminFacade);
    protected readonly translocoService = inject(TranslocoService);
    private readonly fb = inject(FormBuilder);
    private readonly langChangesSubscription: Subscription;

    protected roleOptions: SelectOption<UserRole>[] = [];
    protected statusOptions: SelectOption<UserStatus>[] = [];

    // Create
    protected createDialogVisible = false;
    protected readonly creating = signal(false);
    protected readonly createError = signal<string | null>(null);
    protected readonly createForm = this.fb.group({
        displayName: [""],
        email: ["", [Validators.required, Validators.email]],
        password: ["", [Validators.required, Validators.minLength(8)]],
        role: ["member" as UserRole],
        status: ["active" as UserStatus],
        username: ["", Validators.required]
    });

    // Edit
    protected editDialogVisible = false;
    protected readonly editing = signal(false);
    protected readonly editError = signal<string | null>(null);
    protected readonly editingUser = signal<UserProfile | null>(null);
    protected readonly editForm = this.fb.group({
        displayName: ["", Validators.required],
        role: ["member" as UserRole],
        status: ["active" as UserStatus]
    });

    // Delete
    protected deleteDialogVisible = false;
    protected readonly deletingId = signal<string | null>(null);
    protected readonly deletingUser = signal<UserProfile | null>(null);

    constructor() {
        this.buildOptions();
        this.langChangesSubscription = this.translocoService.langChanges$.subscribe(() => {
            this.buildOptions();
        });
    }

    ngOnInit(): void {
        this.facade.loadUsers();
    }

    ngOnDestroy(): void {
        this.langChangesSubscription.unsubscribe();
    }

    private buildOptions(): void {
        this.roleOptions = [
            { label: this.translocoService.translate("adminUsers.roles.admin"), value: "admin" as UserRole },
            { label: this.translocoService.translate("adminUsers.roles.moderator"), value: "moderator" as UserRole },
            { label: this.translocoService.translate("adminUsers.roles.member"), value: "member" as UserRole },
            { label: this.translocoService.translate("adminUsers.roles.guest"), value: "guest" as UserRole }
        ];
        this.statusOptions = [
            { label: this.translocoService.translate("adminUsers.statuses.active"), value: "active" as UserStatus },
            { label: this.translocoService.translate("adminUsers.statuses.inactive"), value: "inactive" as UserStatus },
            { label: this.translocoService.translate("adminUsers.statuses.banned"), value: "banned" as UserStatus },
            { label: this.translocoService.translate("adminUsers.statuses.pending"), value: "pending" as UserStatus }
        ];
    }

    protected openCreateDialog(): void {
        this.createDialogVisible = true;
    }

    protected resetCreateForm(): void {
        this.createForm.reset({
            role: "member",
            status: "active",
            displayName: "",
            email: "",
            password: "",
            username: ""
        });
        this.createError.set(null);
    }

    protected submitCreate(): void {
        if (this.createForm.invalid) return;
        this.creating.set(true);
        this.createError.set(null);

        const val = this.createForm.value;
        const payload: AdminCreateUserPayload = {
            displayName: val.displayName || undefined,
            email: val.email!,
            password: val.password!,
            role: (val.role as UserRole) || "member",
            status: (val.status as UserStatus) || "active",
            username: val.username!
        };

        this.facade.createUser(payload).subscribe({
            next: (user) => {
                this.facade.updateUserLocally(user);
                this.creating.set(false);
                this.createDialogVisible = false;
                this.resetCreateForm();
            },
            error: (err: { error?: { message?: string } }) => {
                this.createError.set(err?.error?.message ?? this.translocoService.translate("adminUsers.createDialog.errorCreating"));
                this.creating.set(false);
            }
        });
    }

    protected openEditDialog(user: UserProfile): void {
        this.editingUser.set(user);
        this.editForm.patchValue({ displayName: user.displayName, role: user.role, status: user.status });
        this.editDialogVisible = true;
    }

    protected resetEditForm(): void {
        this.editForm.reset();
        this.editError.set(null);
        this.editingUser.set(null);
    }

    protected submitEdit(): void {
        const user = this.editingUser();
        if (!user) return;
        this.editing.set(true);
        this.editError.set(null);

        const val = this.editForm.value;
        const payload: AdminUpdateUserPayload = {
            displayName: val.displayName ?? undefined,
            role: (val.role as UserRole) || undefined,
            status: (val.status as UserStatus) || undefined
        };

        this.facade.updateUser(user.id, payload).subscribe({
            next: (updated) => {
                this.facade.updateUserLocally(updated);
                this.editing.set(false);
                this.editDialogVisible = false;
            },
            error: (err: { error?: { message?: string } }) => {
                this.editError.set(err?.error?.message ?? this.translocoService.translate("adminUsers.editDialog.errorSaving"));
                this.editing.set(false);
            }
        });
    }

    protected confirmDelete(user: UserProfile): void {
        this.deletingUser.set(user);
        this.deleteDialogVisible = true;
    }

    protected executeDelete(): void {
        const user = this.deletingUser();
        if (!user) return;
        this.deletingId.set(user.id);

        this.facade.deleteUserById(user.id).subscribe({
            next: () => {
                this.facade.removeUserLocally(user.id);
                this.deletingId.set(null);
                this.deleteDialogVisible = false;
            },
            error: () => {
                this.deletingId.set(null);
                this.deleteDialogVisible = false;
            }
        });
    }

    protected roleSeverity(role: UserRole): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
        switch (role) {
            case "admin":
                return "danger";
            case "moderator":
                return "warn";
            case "member":
                return "info";
            case "guest":
                return "secondary";
        }
    }

    protected statusLabel(status: UserStatus): string {
        return this.translocoService.translate("adminUsers.statuses." + status);
    }

    protected statusSeverity(status: UserStatus): "success" | "info" | "warn" | "danger" | "secondary" {
        switch (status) {
            case "active":
                return "success";
            case "inactive":
                return "secondary";
            case "banned":
                return "danger";
            case "pending":
                return "warn";
        }
    }

    protected formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
}
