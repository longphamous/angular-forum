import { ChangeDetectionStrategy, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoPipe } from "@jsverse/transloco";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";
import { EditorModule } from "primeng/editor";
import { FluidModule } from "primeng/fluid";
import { InputTextModule } from "primeng/inputtext";

@Component({
    selector: "thread-create",
    imports: [TranslocoPipe, InputTextModule, FormsModule, ButtonModule, EditorModule, FluidModule, DividerModule],
    templateUrl: "./thread-create.html",
    styleUrl: "./thread-create.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadCreate {
    text = "";
}
