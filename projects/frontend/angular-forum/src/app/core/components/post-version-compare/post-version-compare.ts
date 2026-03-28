import { ChangeDetectionStrategy, Component, computed, input, output, signal } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { inject } from "@angular/core";
import { TranslocoModule } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { FormsModule } from "@angular/forms";
import { diffWords, diffLines, Change } from "diff";

import { PostEditHistoryEntry } from "../../models/forum/post";

export type CompareMode = "rendered" | "source";

interface VersionOption {
    label: string;
    value: number;
}

@Component({
    selector: "post-version-compare",
    standalone: true,
    imports: [ButtonModule, FormsModule, SelectModule, TagModule, TooltipModule, TranslocoModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: "./post-version-compare.css",
    templateUrl: "./post-version-compare.html"
})
export class PostVersionCompare {
    readonly currentContent = input.required<string>();
    readonly editHistory = input.required<PostEditHistoryEntry[]>();
    readonly restore = output<PostEditHistoryEntry>();

    private readonly sanitizer = inject(DomSanitizer);

    readonly mode = signal<CompareMode>("rendered");
    readonly selectedLeftIndex = signal<number>(-1);
    readonly selectedRightIndex = signal<number>(0);

    /** All versions: history entries + current (index 0 = oldest) */
    readonly allVersions = computed(() => {
        const history = this.editHistory();
        const current: PostEditHistoryEntry = {
            content: this.currentContent(),
            editedBy: "",
            editedAt: new Date().toISOString(),
            reason: null
        };
        return [...history, current];
    });

    readonly versionOptions = computed<VersionOption[]>(() => {
        const versions = this.allVersions();
        return versions.map((_, i) => ({
            label: i === versions.length - 1
                ? this.currentLabel
                : `#${i + 1}`,
            value: i
        }));
    });

    /** Auto-select: right = current, left = previous */
    readonly effectiveLeft = computed(() => {
        const sel = this.selectedLeftIndex();
        if (sel >= 0) return sel;
        const versions = this.allVersions();
        return Math.max(0, versions.length - 2);
    });

    readonly effectiveRight = computed(() => {
        const sel = this.selectedRightIndex();
        if (sel >= 0) return sel;
        return this.allVersions().length - 1;
    });

    readonly leftVersion = computed(() => this.allVersions()[this.effectiveLeft()]);
    readonly rightVersion = computed(() => this.allVersions()[this.effectiveRight()]);

    readonly leftLabel = computed(() => {
        const idx = this.effectiveLeft();
        const total = this.allVersions().length;
        return idx === total - 1 ? this.currentLabel : `#${idx + 1}`;
    });

    readonly rightLabel = computed(() => {
        const idx = this.effectiveRight();
        const total = this.allVersions().length;
        return idx === total - 1 ? this.currentLabel : `#${idx + 1}`;
    });

    readonly leftDate = computed(() => this.leftVersion()?.editedAt ?? "");
    readonly rightDate = computed(() => this.rightVersion()?.editedAt ?? "");

    /** Rendered diff (HTML-based word diff) */
    readonly renderedDiff = computed<SafeHtml>(() => {
        const left = this.leftVersion();
        const right = this.rightVersion();
        if (!left || !right) return "";

        const leftText = this.stripHtml(left.content);
        const rightText = this.stripHtml(right.content);

        const changes = diffWords(leftText, rightText);
        const html = this.changesToRenderedHtml(changes);
        return this.sanitizer.bypassSecurityTrustHtml(html);
    });

    /** Source diff (raw HTML source line diff) */
    readonly sourceDiff = computed<SafeHtml>(() => {
        const left = this.leftVersion();
        const right = this.rightVersion();
        if (!left || !right) return "";

        const leftSrc = this.formatSource(left.content);
        const rightSrc = this.formatSource(right.content);

        const changes = diffLines(leftSrc, rightSrc);
        const html = this.changesToSourceHtml(changes);
        return this.sanitizer.bypassSecurityTrustHtml(html);
    });

    readonly hasChanges = computed(() => {
        const left = this.leftVersion();
        const right = this.rightVersion();
        if (!left || !right) return false;
        return left.content !== right.content;
    });

    private readonly currentLabel = "Current";

    setMode(m: CompareMode): void {
        this.mode.set(m);
    }

    selectLeft(index: number): void {
        this.selectedLeftIndex.set(index);
    }

    selectRight(index: number): void {
        this.selectedRightIndex.set(index);
    }

    onRestoreLeft(): void {
        const v = this.leftVersion();
        if (v) this.restore.emit(v);
    }

    formatVersionDate(dateStr: string): string {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    private stripHtml(html: string): string {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent ?? "";
    }

    private formatSource(html: string): string {
        return html
            .replace(/></g, ">\n<")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    private changesToRenderedHtml(changes: Change[]): string {
        let html = "";
        for (const part of changes) {
            const escaped = this.escapeHtml(part.value);
            if (part.added) {
                html += `<ins class="diff-ins">${escaped}</ins>`;
            } else if (part.removed) {
                html += `<del class="diff-del">${escaped}</del>`;
            } else {
                html += `<span>${escaped}</span>`;
            }
        }
        return html;
    }

    private changesToSourceHtml(changes: Change[]): string {
        let html = "";
        for (const part of changes) {
            const escaped = this.escapeHtml(part.value);
            if (part.added) {
                html += `<ins class="diff-ins-line">${escaped}</ins>`;
            } else if (part.removed) {
                html += `<del class="diff-del-line">${escaped}</del>`;
            } else {
                html += `<span class="diff-ctx-line">${escaped}</span>`;
            }
        }
        return html;
    }
}
