import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";

import { Forum } from "../../../core/models/forum/forum";
import { ForumCategory } from "../../../core/models/forum/forum-category";
import {
    AdminFacade,
    CreateCategoryPayload,
    CreateForumPayload,
    UpdateCategoryPayload,
    UpdateForumPayload
} from "../../../facade/admin/admin-facade";

@Component({
    selector: "admin-forum",
    imports: [
        FormsModule,
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        DialogModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        SkeletonModule,
        TagModule,
        TextareaModule,
        ToastModule
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: "./admin-forum.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminForum implements OnInit {
    readonly facade = inject(AdminFacade);

    // Category dialog state
    readonly categoryDialogVisible = signal(false);
    readonly categoryDialogSaving = signal(false);
    readonly editingCategory = signal<ForumCategory | null>(null);
    categoryName = "";
    categoryDescription = "";
    categoryPosition: number | null = null;
    categoryIsActive = true;

    // Forum dialog state
    readonly forumDialogVisible = signal(false);
    readonly forumDialogSaving = signal(false);
    readonly editingForum = signal<Forum | null>(null);
    readonly selectedCategoryId = signal<string | null>(null);
    forumName = "";
    forumDescription = "";
    forumPosition: number | null = null;
    forumIsLocked = false;
    forumIsPrivate = false;

    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    ngOnInit(): void {
        this.facade.loadCategories();
    }

    // ─── Category actions ─────────────────────────────────────────────────────

    openCreateCategory(): void {
        this.editingCategory.set(null);
        this.categoryName = "";
        this.categoryDescription = "";
        this.categoryPosition = null;
        this.categoryIsActive = true;
        this.categoryDialogVisible.set(true);
    }

    openEditCategory(cat: ForumCategory): void {
        this.editingCategory.set(cat);
        this.categoryName = cat.name;
        this.categoryDescription = cat.description ?? "";
        this.categoryPosition = cat.position;
        this.categoryIsActive = cat.isActive;
        this.categoryDialogVisible.set(true);
    }

    saveCategory(): void {
        if (!this.categoryName.trim()) return;

        this.categoryDialogSaving.set(true);
        const editing = this.editingCategory();

        if (editing) {
            const payload: UpdateCategoryPayload = {
                name: this.categoryName.trim(),
                description: this.categoryDescription.trim() || undefined,
                position: this.categoryPosition ?? undefined,
                isActive: this.categoryIsActive
            };
            this.facade.updateCategory(editing.id, payload).subscribe({
                next: () => {
                    this.categoryDialogVisible.set(false);
                    this.categoryDialogSaving.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "Gespeichert",
                        detail: "Kategorie aktualisiert."
                    });
                    this.facade.loadCategories();
                },
                error: () => {
                    this.categoryDialogSaving.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Fehler",
                        detail: "Kategorie konnte nicht gespeichert werden."
                    });
                }
            });
        } else {
            const payload: CreateCategoryPayload = {
                name: this.categoryName.trim(),
                description: this.categoryDescription.trim() || undefined,
                position: this.categoryPosition ?? undefined
            };
            this.facade.createCategory(payload).subscribe({
                next: () => {
                    this.categoryDialogVisible.set(false);
                    this.categoryDialogSaving.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "Erstellt",
                        detail: "Kategorie wurde erstellt."
                    });
                    this.facade.loadCategories();
                },
                error: () => {
                    this.categoryDialogSaving.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Fehler",
                        detail: "Kategorie konnte nicht erstellt werden."
                    });
                }
            });
        }
    }

    confirmDeleteCategory(cat: ForumCategory): void {
        this.confirmationService.confirm({
            message: `Kategorie "${cat.name}" wirklich löschen? Alle enthaltenen Foren werden ebenfalls gelöscht.`,
            header: "Kategorie löschen",
            icon: "pi pi-exclamation-triangle",
            acceptButtonStyleClass: "p-button-danger",
            accept: () => {
                this.facade.deleteCategory(cat.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: "success",
                            summary: "Gelöscht",
                            detail: "Kategorie wurde gelöscht."
                        });
                        this.facade.loadCategories();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: "error",
                            summary: "Fehler",
                            detail: "Kategorie konnte nicht gelöscht werden."
                        });
                    }
                });
            }
        });
    }

    // ─── Forum actions ────────────────────────────────────────────────────────

    openCreateForum(categoryId: string): void {
        this.editingForum.set(null);
        this.selectedCategoryId.set(categoryId);
        this.forumName = "";
        this.forumDescription = "";
        this.forumPosition = null;
        this.forumIsLocked = false;
        this.forumIsPrivate = false;
        this.forumDialogVisible.set(true);
    }

    openEditForum(forum: Forum): void {
        this.editingForum.set(forum);
        this.selectedCategoryId.set(forum.categoryId);
        this.forumName = forum.name;
        this.forumDescription = forum.description ?? "";
        this.forumPosition = forum.position;
        this.forumIsLocked = forum.isLocked;
        this.forumIsPrivate = forum.isPrivate;
        this.forumDialogVisible.set(true);
    }

    saveForum(): void {
        if (!this.forumName.trim()) return;

        this.forumDialogSaving.set(true);
        const editing = this.editingForum();
        const categoryId = this.selectedCategoryId();

        if (editing) {
            const payload: UpdateForumPayload = {
                name: this.forumName.trim(),
                description: this.forumDescription.trim() || undefined,
                position: this.forumPosition ?? undefined,
                isLocked: this.forumIsLocked,
                isPrivate: this.forumIsPrivate
            };
            this.facade.updateForum(editing.id, payload).subscribe({
                next: () => {
                    this.forumDialogVisible.set(false);
                    this.forumDialogSaving.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "Gespeichert",
                        detail: "Forum aktualisiert."
                    });
                    this.facade.loadCategories();
                },
                error: () => {
                    this.forumDialogSaving.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Fehler",
                        detail: "Forum konnte nicht gespeichert werden."
                    });
                }
            });
        } else if (categoryId) {
            const payload: CreateForumPayload = {
                name: this.forumName.trim(),
                description: this.forumDescription.trim() || undefined,
                position: this.forumPosition ?? undefined,
                isLocked: this.forumIsLocked,
                isPrivate: this.forumIsPrivate
            };
            this.facade.createForum(categoryId, payload).subscribe({
                next: () => {
                    this.forumDialogVisible.set(false);
                    this.forumDialogSaving.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: "Erstellt",
                        detail: "Forum wurde erstellt."
                    });
                    this.facade.loadCategories();
                },
                error: () => {
                    this.forumDialogSaving.set(false);
                    this.messageService.add({
                        severity: "error",
                        summary: "Fehler",
                        detail: "Forum konnte nicht erstellt werden."
                    });
                }
            });
        }
    }

    confirmDeleteForum(forum: Forum): void {
        this.confirmationService.confirm({
            message: `Forum "${forum.name}" wirklich löschen? Alle Threads und Beiträge werden ebenfalls gelöscht.`,
            header: "Forum löschen",
            icon: "pi pi-exclamation-triangle",
            acceptButtonStyleClass: "p-button-danger",
            accept: () => {
                this.facade.deleteForum(forum.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: "success",
                            summary: "Gelöscht",
                            detail: "Forum wurde gelöscht."
                        });
                        this.facade.loadCategories();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: "error",
                            summary: "Fehler",
                            detail: "Forum konnte nicht gelöscht werden."
                        });
                    }
                });
            }
        });
    }
}
