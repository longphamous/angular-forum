import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { Chip } from "primeng/chip";
import { DividerModule } from "primeng/divider";
import { EditorModule } from "primeng/editor";
import { FluidModule } from "primeng/fluid";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import { ForumBreadcrumb } from "../../../../core/components/forum-breadcrumb/forum-breadcrumb";
import { ForumFacade } from "../../../../facade/forum/forum-facade";

@Component({
    selector: "thread-create",
    imports: [
        FormsModule,
        ForumBreadcrumb,
        InputTextModule,
        Chip,
        ButtonModule,
        CheckboxModule,
        EditorModule,
        FluidModule,
        DividerModule,
        MessageModule,
        RouterModule,
        ToggleSwitchModule,
        TranslocoModule
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
    private readonly translocoService = inject(TranslocoService);

    title = "";
    content = "";
    tags: string[] = [];
    tagInput = "";
    submitting = false;
    error: string | null = null;

    // Poll
    readonly pollEnabled = signal(false);
    pollQuestion = "";
    pollOptions: { text: string; imageUrl: string }[] = [
        { text: "", imageUrl: "" },
        { text: "", imageUrl: "" }
    ];
    pollMultipleChoice = false;
    pollIsAnonymous = false;
    pollShowVoterNames = false;
    pollAllowVoteChange = true;
    pollVoteChangeDeadline = "";

    private forumId = "";

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.forumId = params["forumId"] as string;
            if (!this.facade.currentForum() || this.facade.currentForum()!.id !== this.forumId) {
                this.facade.loadForum(this.forumId);
            }
        });
    }

    submit(): void {
        if (!this.title.trim() || !this.content.trim()) {
            this.error = this.translocoService.translate("threadCreate.requiredFields");
            return;
        }

        // Validate poll if enabled
        const validOptions = this.pollOptions
            .filter((o) => o.text.trim().length > 0)
            .map((o) => ({ text: o.text.trim(), ...(o.imageUrl.trim() ? { imageUrl: o.imageUrl.trim() } : {}) }));
        if (this.pollEnabled() && (!this.pollQuestion.trim() || validOptions.length < 2)) {
            this.error = this.translocoService.translate("threadCreate.poll.validationError");
            return;
        }

        this.submitting = true;
        this.error = null;

        const poll =
            this.pollEnabled() && validOptions.length >= 2
                ? {
                      question: this.pollQuestion.trim(),
                      options: validOptions,
                      isMultipleChoice: this.pollMultipleChoice,
                      isAnonymous: this.pollIsAnonymous,
                      showVoterNames: this.pollShowVoterNames,
                      allowVoteChange: this.pollAllowVoteChange,
                      ...(this.pollVoteChangeDeadline ? { voteChangeDeadline: this.pollVoteChangeDeadline } : {})
                  }
                : undefined;

        this.facade.createThread(this.forumId, this.title.trim(), this.content, this.tags, poll).subscribe({
            next: (thread) => {
                this.router.navigate(["/forum/threads", thread.id]);
            },
            error: () => {
                this.error = this.translocoService.translate("threadCreate.createError");
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

    // ── Poll helpers ──────────────────────────────────────────────────────────

    addPollOption(): void {
        if (this.pollOptions.length < 10) {
            this.pollOptions = [...this.pollOptions, { text: "", imageUrl: "" }];
        }
    }

    removePollOption(index: number): void {
        if (this.pollOptions.length > 2) {
            this.pollOptions = this.pollOptions.filter((_, i) => i !== index);
        }
    }

    trackByIndex(index: number): number {
        return index;
    }

    updatePollOptionText(index: number, value: string): void {
        this.pollOptions = this.pollOptions.map((o, i) => (i === index ? { ...o, text: value } : o));
    }

    updatePollOptionImage(index: number, value: string): void {
        this.pollOptions = this.pollOptions.map((o, i) => (i === index ? { ...o, imageUrl: value } : o));
    }
}
