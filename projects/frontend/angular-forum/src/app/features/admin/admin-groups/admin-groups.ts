import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { Group } from "../../../core/models/group/group";
import { UserProfile } from "../../../core/models/user/user";
import { AdminFacade } from "../../../facade/admin/admin-facade";
import { CreateGroupPayload, GroupFacade, UpdateGroupPayload } from "../../../facade/group/group-facade";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CheckboxModule,
        DialogModule,
        FormsModule,
        InputTextModule,
        MessageModule,
        ReactiveFormsModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        TooltipModule
    ],
    selector: "app-admin-groups",
    templateUrl: "./admin-groups.html"
})
export class AdminGroups implements OnInit {
    protected readonly facade = inject(GroupFacade);
    protected readonly adminFacade = inject(AdminFacade);

    // ── Group dialog ──────────────────────────────────────────────────────────
    protected readonly showGroupDialog = signal(false);
    protected readonly editingGroup = signal<Group | null>(null);
    protected readonly groupSaving = signal(false);
    protected readonly groupError = signal<string | null>(null);

    protected readonly groupForm = inject(FormBuilder).group({
        description: [""],
        name: ["", [Validators.required, Validators.maxLength(100)]]
    });

    // ── Delete dialog ─────────────────────────────────────────────────────────
    protected readonly showDeleteDialog = signal(false);
    protected readonly deletingGroup = signal<Group | null>(null);
    protected readonly deleteLoading = signal(false);

    // ── Users dialog ──────────────────────────────────────────────────────────
    protected readonly showUsersDialog = signal(false);
    protected readonly managingGroup = signal<Group | null>(null);
    protected readonly usersLoading = signal(false);
    protected readonly usersSaving = signal(false);
    protected readonly selectedUserIds = signal<string[]>([]);

    ngOnInit(): void {
        this.facade.loadGroups();
        this.adminFacade.loadUsers();
    }

    protected openCreateDialog(): void {
        this.editingGroup.set(null);
        this.groupError.set(null);
        this.groupForm.reset({ description: "", name: "" });
        this.showGroupDialog.set(true);
    }

    protected openEditDialog(group: Group): void {
        this.editingGroup.set(group);
        this.groupError.set(null);
        this.groupForm.patchValue({ description: group.description ?? "", name: group.name });
        this.showGroupDialog.set(true);
    }

    protected saveGroup(): void {
        if (this.groupForm.invalid) return;
        this.groupSaving.set(true);
        this.groupError.set(null);

        const editing = this.editingGroup();
        const value = this.groupForm.getRawValue();

        if (editing) {
            const payload: UpdateGroupPayload = { description: value.description ?? undefined, name: value.name! };
            this.facade.updateGroup(editing.id, payload).subscribe({
                next: (updated) => {
                    this.facade.updateGroupLocally(updated);
                    this.groupSaving.set(false);
                    this.showGroupDialog.set(false);
                },
                error: () => {
                    this.groupError.set("Fehler beim Speichern.");
                    this.groupSaving.set(false);
                }
            });
        } else {
            const payload: CreateGroupPayload = { description: value.description ?? undefined, name: value.name! };
            this.facade.createGroup(payload).subscribe({
                next: (created) => {
                    this.facade.updateGroupLocally(created);
                    this.facade.loadGroups();
                    this.groupSaving.set(false);
                    this.showGroupDialog.set(false);
                },
                error: () => {
                    this.groupError.set("Fehler beim Erstellen.");
                    this.groupSaving.set(false);
                }
            });
        }
    }

    protected openDeleteDialog(group: Group): void {
        this.deletingGroup.set(group);
        this.showDeleteDialog.set(true);
    }

    protected confirmDelete(): void {
        const group = this.deletingGroup();
        if (!group) return;
        this.deleteLoading.set(true);
        this.facade.deleteGroup(group.id).subscribe({
            next: () => {
                this.facade.removeGroupLocally(group.id);
                this.deleteLoading.set(false);
                this.showDeleteDialog.set(false);
            },
            error: () => {
                this.deleteLoading.set(false);
            }
        });
    }

    protected openUsersDialog(group: Group): void {
        this.managingGroup.set(group);
        this.selectedUserIds.set([]);
        this.usersLoading.set(true);
        this.showUsersDialog.set(true);
        this.facade.getUsersInGroup(group.id).subscribe({
            next: (users) => {
                this.selectedUserIds.set(users.map((u) => u.id));
                this.usersLoading.set(false);
            },
            error: () => {
                this.usersLoading.set(false);
            }
        });
    }

    protected saveGroupUsers(): void {
        const group = this.managingGroup();
        if (!group) return;
        this.usersSaving.set(true);
        this.facade.setGroupUsers(group.id, this.selectedUserIds()).subscribe({
            next: (updated) => {
                this.facade.updateGroupLocally(updated);
                this.usersSaving.set(false);
                this.showUsersDialog.set(false);
            },
            error: () => {
                this.usersSaving.set(false);
            }
        });
    }

    protected toggleUser(user: UserProfile): void {
        const ids = this.selectedUserIds();
        if (ids.includes(user.id)) {
            this.selectedUserIds.set(ids.filter((id) => id !== user.id));
        } else {
            this.selectedUserIds.set([...ids, user.id]);
        }
    }

    protected isUserSelected(userId: string): boolean {
        return this.selectedUserIds().includes(userId);
    }
}
