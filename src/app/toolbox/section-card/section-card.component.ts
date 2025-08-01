import { Component } from "@angular/core";
import { CardModule } from "primeng/card";

@Component({
  selector: "section-card",
  imports: [CardModule],
  templateUrl: "./section-card.component.html",
  styleUrl: "./section-card.component.scss",
})
export class SectionCardComponent {}
