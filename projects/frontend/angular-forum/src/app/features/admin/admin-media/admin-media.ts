import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { SelectModule } from "primeng/select";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";

import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import { MEDIA_ROUTES } from "../../../core/api/media.routes";

interface StorageConfig {
    id: string;
    activeBackend: "local" | "ftp" | "s3";
    localBasePath: string;
    localPublicUrlPrefix: string;
    ftpConfig?: { host: string; port: number; username: string; password: string; basePath: string; secure: boolean; publicUrlPrefix: string };
    s3Config?: { endpoint: string; region: string; bucket: string; accessKeyId: string; secretAccessKey: string; publicUrlPrefix: string; forcePathStyle: boolean };
    maxFileSizeMb: number;
    allowedImageTypes: string[];
    allowedVideoTypes: string[];
    autoGenerateVariants: boolean;
    updatedAt: string;
}

@Component({
    selector: "app-admin-media",
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule, ButtonModule, InputNumberModule, InputTextModule, PasswordModule,
        SelectModule, TabsModule, TagModule, ToastModule, ToggleSwitchModule, TranslocoModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />
        <div class="p-4">
            <h2 class="text-2xl font-bold mb-4">{{ 'media.admin.title' | transloco }}</h2>

            @if (config(); as cfg) {
                <div class="surface-card border border-surface rounded-lg p-6 flex flex-col gap-6">
                    <!-- Active Backend Selection -->
                    <div class="flex flex-col gap-2">
                        <label class="font-semibold">{{ 'media.admin.activeBackend' | transloco }}</label>
                        <div class="flex gap-2 items-center">
                            <p-select
                                [(ngModel)]="cfg.activeBackend"
                                [options]="backendOptions"
                                optionLabel="label"
                                optionValue="value"
                                styleClass="w-48"
                            />
                            <p-tag [value]="cfg.activeBackend" [severity]="cfg.activeBackend === 'local' ? 'info' : cfg.activeBackend === 's3' ? 'success' : 'warn'" />
                        </div>
                    </div>

                    <p-tabs value="0">
                        <p-tablist>
                            <p-tab value="0">{{ 'media.admin.localTab' | transloco }}</p-tab>
                            <p-tab value="1">FTP</p-tab>
                            <p-tab value="2">S3 / Cloud</p-tab>
                            <p-tab value="3">{{ 'media.admin.settingsTab' | transloco }}</p-tab>
                        </p-tablist>

                        <p-tabpanels>
                            <!-- Local -->
                            <p-tabpanel value="0">
                                <div class="flex flex-col gap-3 pt-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-semibold">{{ 'media.admin.localBasePath' | transloco }}</label>
                                        <input pInputText [(ngModel)]="cfg.localBasePath" />
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-semibold">{{ 'media.admin.localPublicUrlPrefix' | transloco }}</label>
                                        <input pInputText [(ngModel)]="cfg.localPublicUrlPrefix" />
                                    </div>
                                </div>
                            </p-tabpanel>

                            <!-- FTP -->
                            <p-tabpanel value="1">
                                <div class="flex flex-col gap-3 pt-4">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">Host</label>
                                            <input pInputText [(ngModel)]="ftpHost" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">Port</label>
                                            <p-inputNumber [(ngModel)]="ftpPort" [min]="1" [max]="65535" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">{{ 'media.admin.username' | transloco }}</label>
                                            <input pInputText [(ngModel)]="ftpUsername" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">{{ 'media.admin.password' | transloco }}</label>
                                            <p-password [(ngModel)]="ftpPassword" [toggleMask]="true" [feedback]="false" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">{{ 'media.admin.basePath' | transloco }}</label>
                                            <input pInputText [(ngModel)]="ftpBasePath" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">{{ 'media.admin.publicUrlPrefix' | transloco }}</label>
                                            <input pInputText [(ngModel)]="ftpPublicUrl" placeholder="https://cdn.example.com/media" />
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <p-toggleSwitch [(ngModel)]="ftpSecure" />
                                        <label class="text-sm">FTPS ({{ 'media.admin.secure' | transloco }})</label>
                                    </div>
                                    <p-button
                                        [label]="'media.admin.testConnection' | transloco"
                                        icon="pi pi-bolt"
                                        severity="secondary"
                                        [loading]="testing()"
                                        (onClick)="testConnection('ftp')"
                                    />
                                </div>
                            </p-tabpanel>

                            <!-- S3 / Cloud -->
                            <p-tabpanel value="2">
                                <div class="flex flex-col gap-3 pt-4">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">Endpoint</label>
                                            <input pInputText [(ngModel)]="s3Endpoint" placeholder="https://s3.amazonaws.com" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">Region</label>
                                            <input pInputText [(ngModel)]="s3Region" placeholder="eu-central-1" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">Bucket</label>
                                            <input pInputText [(ngModel)]="s3Bucket" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">Access Key ID</label>
                                            <input pInputText [(ngModel)]="s3AccessKey" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">Secret Access Key</label>
                                            <p-password [(ngModel)]="s3SecretKey" [toggleMask]="true" [feedback]="false" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <label class="text-sm font-semibold">{{ 'media.admin.publicUrlPrefix' | transloco }}</label>
                                            <input pInputText [(ngModel)]="s3PublicUrl" placeholder="https://bucket.s3.region.amazonaws.com" />
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <p-toggleSwitch [(ngModel)]="s3ForcePathStyle" />
                                        <label class="text-sm">Force Path Style (MinIO)</label>
                                    </div>
                                    <p-button
                                        [label]="'media.admin.testConnection' | transloco"
                                        icon="pi pi-bolt"
                                        severity="secondary"
                                        [loading]="testing()"
                                        (onClick)="testConnection('s3')"
                                    />
                                </div>
                            </p-tabpanel>

                            <!-- General Settings -->
                            <p-tabpanel value="3">
                                <div class="flex flex-col gap-3 pt-4">
                                    <div class="flex flex-col gap-1">
                                        <label class="text-sm font-semibold">{{ 'media.admin.maxFileSize' | transloco }}</label>
                                        <p-inputNumber [(ngModel)]="cfg.maxFileSizeMb" [min]="1" [max]="500" suffix=" MB" />
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <p-toggleSwitch [(ngModel)]="cfg.autoGenerateVariants" />
                                        <label class="text-sm">{{ 'media.admin.autoVariants' | transloco }}</label>
                                    </div>
                                </div>
                            </p-tabpanel>
                        </p-tabpanels>
                    </p-tabs>

                    <div class="flex justify-end gap-2 pt-4 border-t border-surface">
                        <p-button
                            [label]="'common.button.save' | transloco"
                            icon="pi pi-save"
                            [loading]="saving()"
                            (onClick)="save()"
                        />
                    </div>
                </div>
            }
        </div>
    `
})
export class AdminMedia implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly messageService = inject(MessageService);
    private readonly translocoService = inject(TranslocoService);
    private readonly cd = inject(ChangeDetectorRef);

    readonly config = signal<StorageConfig | null>(null);
    readonly saving = signal(false);
    readonly testing = signal(false);

    readonly backendOptions = [
        { label: "Local", value: "local" },
        { label: "FTP", value: "ftp" },
        { label: "S3 / Cloud", value: "s3" }
    ];

    // FTP fields
    ftpHost = "";
    ftpPort = 21;
    ftpUsername = "";
    ftpPassword = "";
    ftpBasePath = "/media";
    ftpPublicUrl = "";
    ftpSecure = false;

    // S3 fields
    s3Endpoint = "";
    s3Region = "eu-central-1";
    s3Bucket = "";
    s3AccessKey = "";
    s3SecretKey = "";
    s3PublicUrl = "";
    s3ForcePathStyle = false;

    private get base(): string {
        return this.apiConfig.baseUrl;
    }

    ngOnInit(): void {
        this.loadConfig();
    }

    private loadConfig(): void {
        this.http.get<StorageConfig>(`${this.base}${MEDIA_ROUTES.adminStorageConfig()}`).subscribe({
            next: (cfg) => {
                this.config.set(cfg);
                if (cfg.ftpConfig) {
                    this.ftpHost = cfg.ftpConfig.host;
                    this.ftpPort = cfg.ftpConfig.port;
                    this.ftpUsername = cfg.ftpConfig.username;
                    this.ftpPassword = cfg.ftpConfig.password;
                    this.ftpBasePath = cfg.ftpConfig.basePath;
                    this.ftpPublicUrl = cfg.ftpConfig.publicUrlPrefix;
                    this.ftpSecure = cfg.ftpConfig.secure;
                }
                if (cfg.s3Config) {
                    this.s3Endpoint = cfg.s3Config.endpoint;
                    this.s3Region = cfg.s3Config.region;
                    this.s3Bucket = cfg.s3Config.bucket;
                    this.s3AccessKey = cfg.s3Config.accessKeyId;
                    this.s3SecretKey = cfg.s3Config.secretAccessKey;
                    this.s3PublicUrl = cfg.s3Config.publicUrlPrefix;
                    this.s3ForcePathStyle = cfg.s3Config.forcePathStyle;
                }
                this.cd.markForCheck();
            }
        });
    }

    save(): void {
        const cfg = this.config();
        if (!cfg) return;
        this.saving.set(true);

        const payload: Record<string, unknown> = {
            activeBackend: cfg.activeBackend,
            localBasePath: cfg.localBasePath,
            localPublicUrlPrefix: cfg.localPublicUrlPrefix,
            maxFileSizeMb: cfg.maxFileSizeMb,
            autoGenerateVariants: cfg.autoGenerateVariants,
            ftpConfig: {
                host: this.ftpHost,
                port: this.ftpPort,
                username: this.ftpUsername,
                password: this.ftpPassword,
                basePath: this.ftpBasePath,
                secure: this.ftpSecure,
                publicUrlPrefix: this.ftpPublicUrl
            },
            s3Config: {
                endpoint: this.s3Endpoint,
                region: this.s3Region,
                bucket: this.s3Bucket,
                accessKeyId: this.s3AccessKey,
                secretAccessKey: this.s3SecretKey,
                publicUrlPrefix: this.s3PublicUrl,
                forcePathStyle: this.s3ForcePathStyle
            }
        };

        this.http.patch<StorageConfig>(`${this.base}${MEDIA_ROUTES.adminStorageConfig()}`, payload).subscribe({
            next: (saved) => {
                this.config.set(saved);
                this.saving.set(false);
                this.messageService.add({ severity: "success", summary: "OK", detail: this.translocoService.translate("media.admin.saved") });
                this.cd.markForCheck();
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: "error", summary: "Error", detail: this.translocoService.translate("media.admin.saveFailed") });
                this.cd.markForCheck();
            }
        });
    }

    testConnection(backend: "ftp" | "s3"): void {
        this.testing.set(true);
        // Save first so backend has latest config
        this.save();
        setTimeout(() => {
            this.http.post<{ success: boolean; message: string }>(`${this.base}${MEDIA_ROUTES.adminTestConnection()}`, { backend }).subscribe({
                next: (result) => {
                    this.testing.set(false);
                    this.messageService.add({
                        severity: result.success ? "success" : "error",
                        summary: result.success ? "OK" : "Error",
                        detail: result.message
                    });
                    this.cd.markForCheck();
                },
                error: () => {
                    this.testing.set(false);
                    this.cd.markForCheck();
                }
            });
        }, 500);
    }
}
