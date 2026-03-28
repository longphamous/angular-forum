import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule, TranslocoService } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

import type { I18nSettings, TranslationRow, UpsertTranslationPayload } from "../../../core/models/i18n/i18n";
import { I18nFacade } from "../../../facade/i18n/i18n-facade";

interface LocaleOption {
    label: string;
    value: string;
}

@Component({
    selector: "admin-i18n",
    standalone: true,
    imports: [
        FormsModule,
        TranslocoModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        SelectModule,
        SkeletonModule,
        TableModule,
        TagModule,
        ToastModule,
        ToggleSwitchModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: "./admin-i18n.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminI18n implements OnInit {
    readonly facade = inject(I18nFacade);
    private readonly translocoService = inject(TranslocoService);
    private readonly messageService = inject(MessageService);

    readonly searchQuery = signal("");
    readonly filterLocale = signal<string | null>(null);
    readonly filterMode = signal<"all" | "overridden" | "default">("all");

    // Edit dialog
    readonly editDialogVisible = signal(false);
    readonly editKey = signal("");
    readonly editValues = signal<Record<string, string>>({});
    readonly editSaving = signal(false);

    readonly localeOptions = computed<LocaleOption[]>(() => {
        const settings = this.facade.settings();
        const locales = settings?.availableLocales ?? ["en", "de"];
        return locales.map((l) => ({ label: this.localeLabel(l), value: l }));
    });

    readonly filterModeOptions = computed(() => [
        { label: this.translocoService.translate("adminI18n.filterAll"), value: "all" },
        { label: this.translocoService.translate("adminI18n.filterOverridden"), value: "overridden" },
        { label: this.translocoService.translate("adminI18n.filterDefault"), value: "default" }
    ]);

    /** Merge static translations with overrides into a flat table */
    readonly rows = computed<TranslationRow[]>(() => {
        const settings = this.facade.settings();
        const overrides = this.facade.overrides();
        const locales = settings?.availableLocales ?? ["en", "de"];
        const search = this.searchQuery().toLowerCase();
        const mode = this.filterMode();

        // Build override lookup: key -> locale -> { value, id }
        const overrideMap = new Map<string, Map<string, { value: string; id: string }>>();
        for (const o of overrides) {
            if (!overrideMap.has(o.key)) overrideMap.set(o.key, new Map());
            overrideMap.get(o.key)!.set(o.locale, { value: o.value, id: o.id });
        }

        // Collect all keys from static translations
        const allKeys = new Set<string>();
        for (const locale of locales) {
            const translations = this.translocoService.getTranslation(locale);
            if (translations) {
                this.flattenKeys(translations, "").forEach((k) => allKeys.add(k));
            }
        }
        // Also add keys that only exist as overrides
        for (const key of overrideMap.keys()) {
            allKeys.add(key);
        }

        const sortedKeys = [...allKeys].sort();

        const rows: TranslationRow[] = [];
        for (const key of sortedKeys) {
            const values: Record<string, string> = {};
            const overrideIds: Record<string, string> = {};
            let hasOverride = false;

            for (const locale of locales) {
                const override = overrideMap.get(key)?.get(locale);
                if (override) {
                    values[locale] = override.value;
                    overrideIds[locale] = override.id;
                    hasOverride = true;
                } else {
                    values[locale] = this.translocoService.translate(key, {}, locale) ?? "";
                }
            }

            // Apply filters
            if (mode === "overridden" && !hasOverride) continue;
            if (mode === "default" && hasOverride) continue;
            if (search) {
                const matchesKey = key.toLowerCase().includes(search);
                const matchesValue = Object.values(values).some((v) => v.toLowerCase().includes(search));
                if (!matchesKey && !matchesValue) continue;
            }

            rows.push({ key, values, overrideIds, hasOverride });
        }

        return rows;
    });

    ngOnInit(): void {
        this.facade.loadSettings();
        this.facade.loadOverrides();
        // Ensure all translations are loaded
        const settings = this.facade.settings();
        for (const locale of settings?.availableLocales ?? ["en", "de"]) {
            this.translocoService.load(locale).subscribe();
        }
    }

    localeLabel(locale: string): string {
        const labels: Record<string, string> = {
            en: "English (en)",
            de: "Deutsch (de)",
            fr: "Francais (fr)",
            es: "Espanol (es)",
            ja: "Japanese (ja)"
        };
        return labels[locale] ?? locale;
    }

    toggleMultiLanguage(enabled: boolean): void {
        this.facade.updateSettings({ multiLanguageEnabled: enabled }).subscribe({
            next: () =>
                this.messageService.add({
                    severity: "success",
                    summary: this.translocoService.translate("adminI18n.saved"),
                    detail: this.translocoService.translate(
                        enabled ? "adminI18n.multiLangEnabled" : "adminI18n.multiLangDisabled"
                    )
                }),
            error: () =>
                this.messageService.add({
                    severity: "error",
                    summary: this.translocoService.translate("common.error"),
                    detail: this.translocoService.translate("adminI18n.saveFailed")
                })
        });
    }

    openEditDialog(row: TranslationRow): void {
        this.editKey.set(row.key);
        this.editValues.set({ ...row.values });
        this.editDialogVisible.set(true);
    }

    saveTranslation(): void {
        const key = this.editKey();
        const values = this.editValues();
        const settings = this.facade.settings();
        const locales = settings?.availableLocales ?? ["en", "de"];

        const translations: UpsertTranslationPayload[] = [];
        for (const locale of locales) {
            const value = values[locale];
            if (value !== undefined && value !== "") {
                translations.push({ key, locale, value });
            }
        }

        if (translations.length === 0) return;

        this.editSaving.set(true);
        this.facade.bulkUpsert(translations).subscribe({
            next: () => {
                this.editSaving.set(false);
                this.editDialogVisible.set(false);
                this.messageService.add({
                    severity: "success",
                    summary: this.translocoService.translate("adminI18n.saved"),
                    detail: this.translocoService.translate("adminI18n.translationSaved")
                });
            },
            error: () => {
                this.editSaving.set(false);
                this.messageService.add({
                    severity: "error",
                    summary: this.translocoService.translate("common.error"),
                    detail: this.translocoService.translate("adminI18n.saveFailed")
                });
            }
        });
    }

    resetOverride(row: TranslationRow, locale: string): void {
        const id = row.overrideIds[locale];
        if (!id) return;
        this.facade.deleteOverride(id).subscribe({
            next: () =>
                this.messageService.add({
                    severity: "info",
                    summary: this.translocoService.translate("adminI18n.reset"),
                    detail: this.translocoService.translate("adminI18n.overrideRemoved")
                }),
            error: () =>
                this.messageService.add({
                    severity: "error",
                    summary: this.translocoService.translate("common.error"),
                    detail: this.translocoService.translate("adminI18n.saveFailed")
                })
        });
    }

    updateDefaultLocale(locale: string): void {
        this.facade.updateSettings({ defaultLocale: locale }).subscribe();
    }

    updateEditValue(locale: string, value: string): void {
        this.editValues.update((v) => ({ ...v, [locale]: value }));
    }

    onSearchInput(event: Event): void {
        this.searchQuery.set((event.target as HTMLInputElement).value);
    }

    private flattenKeys(obj: Record<string, unknown>, prefix: string): string[] {
        const keys: string[] = [];
        for (const [k, v] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${k}` : k;
            if (typeof v === "object" && v !== null && !Array.isArray(v)) {
                keys.push(...this.flattenKeys(v as Record<string, unknown>, fullKey));
            } else {
                keys.push(fullKey);
            }
        }
        return keys;
    }
}
