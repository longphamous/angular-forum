import { Component } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-footer",
    template: `<div class="layout-footer">
        SAKAI by
        <a
            class="text-primary font-bold hover:underline"
            href="https://primeng.org"
            rel="noopener noreferrer"
            target="_blank"
            >PrimeNG</a
        >
    </div>`
})
export class AppFooter {}
