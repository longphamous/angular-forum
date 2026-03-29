import {
    ApplicationRef,
    ComponentRef,
    createComponent,
    Directive,
    ElementRef,
    EnvironmentInjector,
    inject,
    input,
    OnDestroy,
    Renderer2,
    Signal
} from "@angular/core";

import { UserPopoverService } from "../../core/services/user-popover.service";
import { UserCardData, UserPopoverCard } from "../components/user-popover/user-popover-card";

const SHOW_DELAY = 400;
const HIDE_DELAY = 200;

@Directive({
    selector: "[userPopover]",
    standalone: true
})
export class UserPopoverDirective implements OnDestroy {
    readonly userPopover = input.required<string>();

    private readonly el = inject(ElementRef);
    private readonly renderer = inject(Renderer2);
    private readonly popoverService = inject(UserPopoverService);
    private readonly appRef = inject(ApplicationRef);
    private readonly injector = inject(EnvironmentInjector);

    private showTimer: ReturnType<typeof setTimeout> | null = null;
    private hideTimer: ReturnType<typeof setTimeout> | null = null;
    private popoverEl: HTMLDivElement | null = null;
    private componentRef: ComponentRef<UserPopoverCard> | null = null;
    private userSignal: Signal<UserCardData | null> | null = null;
    private listeners: (() => void)[] = [];
    private effectCleanup: (() => void) | null = null;

    constructor() {
        // Wait for view init
        setTimeout(() => this.setupListeners());
    }

    private setupListeners(): void {
        const native = this.el.nativeElement as HTMLElement;

        this.listeners.push(
            this.renderer.listen(native, "mouseenter", () => this.onMouseEnter()),
            this.renderer.listen(native, "mouseleave", () => this.onMouseLeave()),
            this.renderer.listen(native, "focusin", () => this.onMouseEnter()),
            this.renderer.listen(native, "focusout", () => this.onMouseLeave())
        );
    }

    private onMouseEnter(): void {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        if (this.popoverEl) return;
        this.showTimer = setTimeout(() => this.show(), SHOW_DELAY);
    }

    private onMouseLeave(): void {
        if (this.showTimer) {
            clearTimeout(this.showTimer);
            this.showTimer = null;
        }
        if (!this.popoverEl) return;
        this.hideTimer = setTimeout(() => this.hide(), HIDE_DELAY);
    }

    private show(): void {
        const userId = this.userPopover();
        if (!userId) return;

        this.userSignal = this.popoverService.resolve(userId);

        // Create popover container
        this.popoverEl = document.createElement("div");
        this.popoverEl.className = "user-popover-container";
        this.popoverEl.style.cssText = `
            position: fixed;
            z-index: 10000;
            pointer-events: auto;
            opacity: 0;
            transform: translateY(4px);
            transition: opacity 0.15s ease, transform 0.15s ease;
        `;

        // Keep popover alive on hover
        this.popoverEl.addEventListener("mouseenter", () => {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
        });
        this.popoverEl.addEventListener("mouseleave", () => {
            this.hideTimer = setTimeout(() => this.hide(), HIDE_DELAY);
        });

        // Create the Angular component
        this.componentRef = createComponent(UserPopoverCard, {
            environmentInjector: this.injector,
            hostElement: this.popoverEl
        });
        this.componentRef.setInput(
            "user",
            this.userSignal() ?? {
                id: userId,
                username: "...",
                displayName: "...",
                role: "member",
                postCount: 0,
                level: 1,
                levelName: "",
                xp: 0,
                createdAt: ""
            }
        );

        this.appRef.attachView(this.componentRef.hostView);
        document.body.appendChild(this.popoverEl);

        // Position it
        this.position();

        // Animate in
        requestAnimationFrame(() => {
            if (this.popoverEl) {
                this.popoverEl.style.opacity = "1";
                this.popoverEl.style.transform = "translateY(0)";
            }
        });

        // Watch for data updates
        const checkInterval = setInterval(() => {
            if (!this.userSignal || !this.componentRef) {
                clearInterval(checkInterval);
                return;
            }
            const data = this.userSignal();
            if (data) {
                this.componentRef.setInput("user", data);
                clearInterval(checkInterval);
            }
        }, 100);

        // Auto-cleanup interval after 10s
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    private position(): void {
        if (!this.popoverEl) return;

        const anchor = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
        const popW = 280;
        const popH = 320;
        const gap = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Prefer below the element, fallback above
        let top = anchor.bottom + gap;
        if (top + popH > vh) {
            top = anchor.top - popH - gap;
        }
        if (top < 0) top = gap;

        // Horizontal: center on anchor, clamp to viewport
        let left = anchor.left + anchor.width / 2 - popW / 2;
        if (left + popW > vw - gap) left = vw - popW - gap;
        if (left < gap) left = gap;

        this.popoverEl.style.top = `${top}px`;
        this.popoverEl.style.left = `${left}px`;
    }

    private hide(): void {
        if (this.popoverEl) {
            this.popoverEl.style.opacity = "0";
            this.popoverEl.style.transform = "translateY(4px)";

            setTimeout(() => {
                if (this.componentRef) {
                    this.appRef.detachView(this.componentRef.hostView);
                    this.componentRef.destroy();
                    this.componentRef = null;
                }
                this.popoverEl?.remove();
                this.popoverEl = null;
            }, 150);
        }
    }

    ngOnDestroy(): void {
        if (this.showTimer) clearTimeout(this.showTimer);
        if (this.hideTimer) clearTimeout(this.hideTimer);
        this.hide();
        for (const unsub of this.listeners) unsub();
        if (this.effectCleanup) this.effectCleanup();
    }
}
