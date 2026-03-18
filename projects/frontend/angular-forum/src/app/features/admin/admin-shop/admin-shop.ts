import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { ConfirmationService, MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from "primeng/dialog";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { SHOP_ROUTES } from "../../../core/api/shop.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { ShopItem } from "../../../core/models/shop/shop";

interface ShopItemFormData {
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    icon: string;
    category: string;
    isActive: boolean;
    stock: number | null;
    maxPerUser: number | null;
    sortOrder: number;
}

function emptyForm(): ShopItemFormData {
    return {
        name: "",
        description: "",
        price: 10,
        imageUrl: "",
        icon: "",
        category: "",
        isActive: true,
        stock: null,
        maxPerUser: null,
        sortOrder: 0
    };
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        DialogModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        SkeletonModule,
        TableModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [ConfirmationService, MessageService],
    selector: "app-admin-shop",
    templateUrl: "./admin-shop.html"
})
export class AdminShop implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly messageService = inject(MessageService);

    protected readonly loading = signal(true);
    protected readonly saving = signal(false);
    protected readonly items = signal<ShopItem[]>([]);
    protected dialogVisible = false;
    protected editingId: string | null = null;
    protected form: ShopItemFormData = emptyForm();

    ngOnInit(): void {
        this.load();
    }

    protected openCreate(): void {
        this.editingId = null;
        this.form = emptyForm();
        this.dialogVisible = true;
    }

    protected openEdit(item: ShopItem): void {
        this.editingId = item.id;
        this.form = {
            name: item.name,
            description: item.description ?? "",
            price: item.price,
            imageUrl: item.imageUrl ?? "",
            icon: item.icon ?? "",
            category: item.category ?? "",
            isActive: item.isActive,
            stock: item.stock,
            maxPerUser: item.maxPerUser,
            sortOrder: item.sortOrder
        };
        this.dialogVisible = true;
    }

    protected save(): void {
        this.saving.set(true);
        const payload = {
            name: this.form.name,
            description: this.form.description || null,
            price: this.form.price,
            imageUrl: this.form.imageUrl || null,
            icon: this.form.icon || null,
            category: this.form.category || null,
            isActive: this.form.isActive,
            stock: this.form.stock,
            maxPerUser: this.form.maxPerUser,
            sortOrder: this.form.sortOrder
        };

        const request$ = this.editingId
            ? this.http.patch<ShopItem>(`${this.apiConfig.baseUrl}${SHOP_ROUTES.admin.update(this.editingId)}`, payload)
            : this.http.post<ShopItem>(`${this.apiConfig.baseUrl}${SHOP_ROUTES.admin.create()}`, payload);

        request$.subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.load();
                this.messageService.add({ severity: "success", summary: "Gespeichert", life: 2000 });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: "error", summary: "Fehler beim Speichern", life: 3000 });
            }
        });
    }

    protected confirmDelete(item: ShopItem): void {
        this.confirmationService.confirm({
            message: `"${item.name}" wirklich löschen?`,
            header: "Bestätigung",
            icon: "pi pi-trash",
            accept: () => this.deleteItem(item.id)
        });
    }

    private deleteItem(id: string): void {
        this.http.delete(`${this.apiConfig.baseUrl}${SHOP_ROUTES.admin.delete(id)}`).subscribe({
            next: () => {
                this.load();
                this.messageService.add({ severity: "success", summary: "Gelöscht", life: 2000 });
            },
            error: () => this.messageService.add({ severity: "error", summary: "Fehler beim Löschen", life: 3000 })
        });
    }

    private load(): void {
        this.loading.set(true);
        this.http.get<ShopItem[]>(`${this.apiConfig.baseUrl}${SHOP_ROUTES.admin.list()}`).subscribe({
            next: (data) => {
                this.items.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
