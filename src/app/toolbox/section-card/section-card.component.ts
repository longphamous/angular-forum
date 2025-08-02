import { Component } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";

@Component({
  selector: "section-card",
  imports: [ButtonModule, CardModule],
  templateUrl: "./section-card.component.html",
  styleUrl: "./section-card.component.scss",
})
export class SectionCardComponent {}
