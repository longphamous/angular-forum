import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { EditorModule } from "primeng/editor";
import { FluidModule } from "primeng/fluid";
import { Chip } from "primeng/chip";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";

import { ForumFacade } from "../../../../facade/forum/forum-facade";

@Component({
    selector: "thread-create",
    imports: [
        FormsModule,
        InputTextModule,
        Chip,
        ButtonModule,
        EditorModule,
        FluidModule,
        DividerModule,
        MessageModule,
        RouterModule
    ],
    templateUrl: "./thread-create.html",
    styleUrl: "./thread-create.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadCreate implements OnInit {
    readonly route = inject(ActivatedRoute);
    readonly router = inject(Router);
    readonly facade = inject(ForumFacade);
    readonly cd = inject(ChangeDetectorRef);

    title = "";
    content = "";
    tags: string[] = [];
    tagInput = "";
    submitting = false;
    error: string | null = null;

    private forumId = "";

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.forumId = params["forumId"] as string;
        });
    }

    submit(): void {
        if (!this.title.trim() || !this.content.trim()) {
            this.error = "Titel und Inhalt sind erforderlich.";
            return;
        }
        this.submitting = true;
        this.error = null;
        this.facade.createThread(this.forumId, this.title.trim(), this.content, this.tags).subscribe({
            next: (thread) => {
                this.router.navigate(["/forum/threads", thread.id]);
            },
            error: () => {
                this.error = "Fehler beim Erstellen des Threads.";
                this.submitting = false;
                this.cd.markForCheck();
            }
        });
    }

    cancel(): void {
        this.router.navigate(["/forum/forums", this.forumId]);
    }

    addTag(event: KeyboardEvent): void {
        if (event.key !== "Enter" && event.key !== ",") return;
        event.preventDefault();
        const value = this.tagInput.trim().replace(/,/g, "");
        if (value && !this.tags.includes(value)) {
            this.tags = [...this.tags, value];
        }
        this.tagInput = "";
    }

    removeTag(tag: string): void {
        this.tags = this.tags.filter((t) => t !== tag);
    }
}
