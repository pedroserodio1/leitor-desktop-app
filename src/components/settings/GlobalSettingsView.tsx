import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useReaderStore } from "../../store/readerStore";
import { saveGlobalSettings } from "../../services/dbService";
import { ArrowLeft, Moon, Sun, Globe } from "lucide-react";
import type { Theme } from "../../types/reader";

interface GlobalSettingsViewProps {
  onBack: () => void;
}

export const GlobalSettingsView: React.FC<GlobalSettingsViewProps> = ({ onBack }) => {
  const { settings, setSetting } = useReaderStore();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950">
      <header className="shrink-0 flex items-center gap-4 px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          aria-label={t("library.app_settings")}
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <h1 className="font-heading text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          {t("settings.title")}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8 max-w-2xl">
        <section className="space-y-5">
          <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            {settings.theme === "light" ? (
              <Sun className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={1.75} />
            )}
            {t("settings.appearance")}
          </h2>

          <div className="space-y-4">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block">
              {t("settings.theme")}
            </label>
            <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5 gap-1">
              {(["light", "dark"] as Theme[]).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => {
                    setSetting("theme", theme);
                    saveGlobalSettings({ theme }).catch((e) => console.error("[GlobalSettings] saveGlobalSettings:", e));
                  }}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    settings.theme === theme
                      ? "bg-white dark:bg-stone-600 shadow-sm text-brand"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                  }`}
                >
                  {theme === "light" ? (
                    <Sun className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Moon className="w-5 h-5" strokeWidth={1.75} />
                  )}
                  <span className="capitalize">{theme === "light" ? t("settings.theme_light") : t("settings.theme_dark")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-stone-500 dark:text-stone-400" strokeWidth={1.75} />
              {t("settings.language_label")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { code: "en" as const, label: "English" },
                { code: "pt-BR" as const, label: "Português" },
                { code: "es" as const, label: "Español" },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSetting("language", code)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    settings.language === code
                      ? "bg-brand text-white shadow-md"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/50">
          <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
            {t("settings.philosophy")}
          </p>
        </div>
      </main>
    </div>
  );
};
