import { Component } from "@angular/core";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { MenubarModule } from "primeng/menubar";

@Component({
    selector: "navigation-bar",
    imports: [AvatarModule, BadgeModule, MenubarModule],
    templateUrl: "./navigation-bar.component.html",
    styleUrl: "./navigation-bar.component.scss"
})
export class NavigationBarComponent {
    items: any = [];
}
