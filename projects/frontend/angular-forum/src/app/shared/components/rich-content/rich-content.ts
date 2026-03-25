import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    input,
    OnChanges,
    OnDestroy,
    signal,
    ViewChild
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

import { RichEmbed } from "../rich-embed/rich-embed";

const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

@Component({
    selector: "rich-content",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RichEmbed],
    template: `
        <div #contentRef [innerHTML]="safeHtml"></div>
        @for (embedUrl of embedUrls(); track embedUrl) {
            <rich-embed [url]="embedUrl" />
        }
    `,
    styles: [
        `
            :host {
                display: block;
            }
        `
    ]
})
export class RichContent implements AfterViewInit, OnChanges, OnDestroy {
    readonly html = input.required<string>();

    @ViewChild("contentRef") contentRef!: ElementRef<HTMLDivElement>;

    readonly embedUrls = signal<string[]>([]);

    private readonly sanitizer = inject(DomSanitizer);
    private readonly cd = inject(ChangeDetectorRef);
    private viewReady = false;
    private detectTimer: ReturnType<typeof setTimeout> | null = null;

    safeHtml: SafeHtml = "";

    ngOnChanges(): void {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.html());
        this.scheduleDetect();
    }

    ngAfterViewInit(): void {
        this.viewReady = true;
        this.scheduleDetect();
    }

    ngOnDestroy(): void {
        if (this.detectTimer) clearTimeout(this.detectTimer);
    }

    private scheduleDetect(): void {
        if (!this.viewReady) return;
        if (this.detectTimer) clearTimeout(this.detectTimer);
        // Single debounced call — ensures innerHTML is rendered before we scan
        this.detectTimer = setTimeout(() => this.detectEmbeds(), 50);
    }

    private detectEmbeds(): void {
        if (!this.contentRef) return;

        const container = this.contentRef.nativeElement;
        const found: string[] = [];
        const hasHtmlLinks = this.html().includes("<a ");

        if (hasHtmlLinks) {
            // HTML content (Quill output): find <a> tags that are standalone
            const links = container.querySelectorAll("a[href]");
            for (const link of Array.from(links)) {
                const href = link.getAttribute("href");
                if (!href || !href.startsWith("http")) continue;
                if (found.includes(href)) continue;

                const parent = link.parentElement;
                if (!parent || parent === container) continue;

                // Standalone: link is the only meaningful child of its parent element
                const siblings = Array.from(parent.childNodes).filter((n) => {
                    if (n.nodeType === Node.TEXT_NODE) return (n.textContent?.trim().length ?? 0) > 0;
                    return n.nodeType === Node.ELEMENT_NODE;
                });
                const isOnlyChild = siblings.length === 1 && siblings[0] === link;

                // Or: link text is just a URL (user pasted a URL that Quill auto-linked)
                const linkText = link.textContent?.trim() ?? "";
                const looksLikeUrl = linkText === href || /^https?:\/\//i.test(linkText);

                if (isOnlyChild || (looksLikeUrl && isOnlyChild)) {
                    found.push(href);
                    // Hide the containing block element (e.g. <p>) to avoid duplication
                    (parent as HTMLElement).style.display = "none";
                }
            }
        } else {
            // Plain text content: extract URLs via regex
            const matches = this.html().match(URL_REGEX);
            if (matches) {
                for (const m of matches) {
                    if (!found.includes(m)) found.push(m);
                }
            }
            // Hide raw text URLs in the rendered output
            if (found.length > 0) {
                container.innerHTML = container.innerHTML.replace(
                    URL_REGEX,
                    (match) => `<span style="display:none">${match}</span>`
                );
            }
        }

        this.embedUrls.set(found);
        this.cd.markForCheck();
    }
}
