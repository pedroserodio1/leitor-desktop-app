import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, Download, Upload } from "lucide-react";
import {
  createCustomTheme,
  updateCustomTheme,
} from "../../services/dbService";
import { validateCustomThemeCss } from "../../utils/cssThemeValidation";
import { useReaderStore } from "../../store/readerStore";
import type { CustomTheme } from "../../types/db";

interface CustomThemeModalProps {
  theme: CustomTheme | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CustomThemeModal: React.FC<CustomThemeModalProps> = ({
  theme,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation();
  const settings = useReaderStore((s) => s.settings);
  const refreshCustomTheme = useReaderStore((s) => s.refreshCustomTheme);
  const [name, setName] = useState(theme?.name ?? "");
  const [css, setCss] = useState(theme?.css ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const validated = validateCustomThemeCss(css);
    if (!validated.valid) {
      setError(validated.error);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (theme) {
        await updateCustomTheme(theme.id, { name, css: validated.css });
        if (settings.theme === "custom" && settings.customThemeId === theme.id) {
          refreshCustomTheme();
        }
      } else {
        await createCustomTheme(name.trim(), validated.css);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError("Failed to save");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [theme, name, css, settings.theme, settings.customThemeId, refreshCustomTheme, onSaved, onClose]);

  const handleExport = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify({ name: name.trim() || "Custom theme", css })],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-${(name.trim() || "custom").replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [name, css]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as { name?: string; css?: string };
        if (data.name) setName(String(data.name));
        if (data.css) setCss(String(data.css));
      } catch {
        setError("Invalid file format");
      }
    };
    input.click();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-theme-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
          <h2
            id="custom-theme-modal-title"
            className="font-heading text-lg font-semibold text-stone-900 dark:text-stone-100"
          >
            {theme ? t("settings.custom_theme_edit") : t("settings.custom_theme_new")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-2">
              {t("settings.custom_theme_name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.custom_theme_name_placeholder")}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-0 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:ring-2 focus:ring-brand/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-2">
              CSS
            </label>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              placeholder="body { background: #1a1a2e; color: #eee; }"
              rows={14}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-0 text-sm font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:ring-2 focus:ring-brand/30 focus:outline-none resize-y"
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
              {t("settings.custom_theme_hint")}
            </p>
          </div>

          {error && (
            <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {saving ? "..." : t("library.book_detail.save")}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" strokeWidth={1.75} />
            {t("settings.custom_theme_export")}
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" strokeWidth={1.75} />
            {t("settings.custom_theme_import")}
          </button>
        </div>
      </div>
    </div>
  );
};
