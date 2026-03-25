import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterModule } from "@angular/router";

export interface BreadcrumbItem {
    label: string;
    icon?: string;
    routerLink?: string;
}

@Component({
    selector: "app-forum-breadcrumb",
    standalone: true,
    imports: [RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <nav class="border-surface flex h-10 items-stretch overflow-hidden rounded-lg border">
            @for (item of items(); track $index; let last = $last) {
                @if (item.routerLink && !last) {
                    <a
                        class="text-color hover:bg-emphasis flex items-center gap-2 px-4 text-sm font-medium no-underline transition-colors duration-150"
                        [routerLink]="item.routerLink"
                    >
                        @if (item.icon) {
                            <i [class]="'pi ' + item.icon"></i>
                        }
                        @if (item.label) {
                            <span>{{ item.label }}</span>
                        }
                    </a>
                } @else {
                    <span class="text-primary flex items-center gap-2 px-4 text-sm font-bold">
                        @if (item.icon) {
                            <i [class]="'pi ' + item.icon"></i>
                        }
                        <span>{{ item.label }}</span>
                    </span>
                }
                @if (!last) {
                    <span class="text-color-secondary bg-emphasis flex items-center" style="width: 1px">
                        <svg
                            class="h-full"
                            fill="none"
                            height="40"
                            viewBox="0 0 16 40"
                            width="16"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M0 0L16 20L0 40" fill="var(--p-surface-200)" />
                        </svg>
                    </span>
                }
            }
        </nav>
    `
})
export class ForumBreadcrumb {
    readonly items = input.required<BreadcrumbItem[]>();
}
