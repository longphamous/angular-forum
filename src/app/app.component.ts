import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

import { NavigationBarComponent } from "./toolbox/navigation-bar/navigation-bar.component";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, NavigationBarComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "angular-forum";
}
