import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReaderStore } from "../../store/readerStore";
import { saveGlobalSettings } from "../../services/dbService";
import { loadLibrary, computeBooksWithProgress } from "../../services/libraryService";
import { getAllProgress } from "../../services/dbService";
import { getVersion } from "@tauri-apps/api/app";
import { ArrowLeft, BarChart3, Bookmark, Monitor, Moon, Sun, Globe, Keyboard, Info, ExternalLink } from "lucide-react";
import { useShelves } from "../../hooks/useShelves";
import type { Theme } from "../../types/reader";

const MOD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘" : "Ctrl";

const SHORTCUTS: { action: string; key: string }[] = [
  { action: "Fullscreen", key: "F" },
  { action: "Back / Exit", key: "Esc" },
  { action: "Previous page", key: "←" },
  { action: "Next page", key: "→" },
  { action: "Next page", key: "Space" },
  { action: "Previous page", key: "Shift + Space" },
  { action: "Page up/down", key: "PageUp / PageDown" },
  { action: "First page", key: "Home" },
  { action: "Last page", key: "End" },
  { action: "Search in library", key: `${MOD}+K` },
];

interface GlobalSettingsViewProps {
  onBack: () => void;
}

export const GlobalSettingsView: React.FC<GlobalSettingsViewProps> = ({ onBack }) => {
  const { settings, setSetting } = useReaderStore();
  const { t, i18n } = useTranslation();
  const { shelves, createShelf } = useShelves();
  const [newShelfName, setNewShelfName] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "library" | "shortcuts" | "about">("general");
  const [stats, setStats] = useState<{
    totalBooks: number;
    reading: number;
    completed: number;
    pagesRead: number;
  } | null>(null);
  const [appVersion, setAppVersion] = useState<string>("—");

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion("0.1.0"));
  }, []);

  useEffect(() => {
    (async () => {
      const [books, allProgress] = await Promise.all([
        loadLibrary(),
        getAllProgress(),
      ]);
      const progressMap = computeBooksWithProgress(books, allProgress);
      let reading = 0;
      let completed = 0;
      let pagesRead = 0;
      for (const [, info] of progressMap) {
        if (info.status === "reading") reading++;
        if (info.status === "completed") completed++;
      }
      for (const p of allProgress) {
        pagesRead += p.page_index;
      }
      setStats({
        totalBooks: books.length,
        reading,
        completed,
        pagesRead,
      });
    })();
  }, []);

  useEffect(() => {
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950" data-testid="settings-view">
      <header className="shrink-0 flex items-center gap-4 px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          data-testid="btn-back"
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
        <div className="flex gap-1 mb-8 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-fit">
          {[
            { id: "general" as const, label: t("settings.general") },
            { id: "library" as const, label: t("library.shelves") },
            { id: "shortcuts" as const, label: t("settings.shortcuts") },
            { id: "about" as const, label: t("settings.about") },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-white dark:bg-stone-600 shadow-sm text-brand" : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
        <section className="space-y-5">
          <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            {settings.theme === "light" ? (
              <Sun className="w-4 h-4" strokeWidth={1.75} />
            ) : settings.theme === "dark" ? (
              <Moon className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Monitor className="w-4 h-4" strokeWidth={1.75} />
            )}
            {t("settings.appearance")}
          </h2>

          <div className="space-y-4">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block">
              {t("settings.theme")}
            </label>
            <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5 gap-1">
              {(["light", "dark", "system"] as Theme[]).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  data-testid={`theme-${theme}`}
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
                  ) : theme === "dark" ? (
                    <Moon className="w-5 h-5" strokeWidth={1.75} />
                  ) : (
                    <Monitor className="w-5 h-5" strokeWidth={1.75} />
                  )}
                  <span className="capitalize">
                    {theme === "light"
                      ? t("settings.theme_light")
                      : theme === "dark"
                        ? t("settings.theme_dark")
                        : t("settings.theme_system")}
                  </span>
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
        )}

        {activeTab === "library" && (
        <section className="space-y-5">
          <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            <Bookmark className="w-4 h-4" strokeWidth={1.75} />
            {t("library.shelves")}
          </h2>
          <div className="space-y-2 mb-4">
            {shelves.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400 py-4 text-center rounded-xl bg-stone-50 dark:bg-stone-900/50">
                {t("library.no_shelves")}
              </p>
            ) : (
              shelves.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-stone-400 shrink-0" strokeWidth={1.75} />
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{s.name}</span>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newShelfName}
              onChange={(e) => setNewShelfName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const name = newShelfName.trim();
                  if (name) {
                    createShelf(`shelf-${Date.now()}`, name);
                    setNewShelfName("");
                  }
                }
              }}
              placeholder={t("library.create_shelf")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-0 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:ring-2 focus:ring-brand/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={async () => {
                const name = newShelfName.trim();
                if (!name) return;
                const id = `shelf-${Date.now()}`;
                await createShelf(id, name);
                setNewShelfName("");
              }}
              disabled={!newShelfName.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {t("library.create_shelf")}
            </button>
          </div>
        </section>
        )}

        {activeTab === "shortcuts" && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            <Keyboard className="w-4 h-4" strokeWidth={1.75} />
            {t("settings.shortcuts")}
          </h2>
          <div className="rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-100 dark:bg-stone-800">
                  <th className="text-left px-4 py-3 font-medium text-stone-700 dark:text-stone-200">Action</th>
                  <th className="text-right px-4 py-3 font-medium text-stone-700 dark:text-stone-200">Key</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map((s, i) => (
                  <tr key={i} className="border-t border-stone-200 dark:border-stone-700">
                    <td className="px-4 py-2.5 text-stone-700 dark:text-stone-200">{s.action}</td>
                    <td className="px-4 py-2.5 text-right">
                      <kbd className="px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-mono text-xs">
                        {s.key}
                      </kbd>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {activeTab === "about" && (
        <section className="space-y-5">
          <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4" strokeWidth={1.75} />
            {t("settings.about")}
          </h2>
          <div className="p-6 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 space-y-4">
            <div>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                {t("settings.about_app")}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                {t("settings.about_tagline")}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600 dark:text-stone-300">
              <span>{t("settings.about_version")}: {appVersion}</span>
              <span>{t("settings.about_author")}</span>
              <span className="text-stone-500 dark:text-stone-400">{t("settings.about_license")}</span>
            </div>
            <a
              href="https://github.com/pedroserodio1/readito-desktop-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
              {t("settings.about_github")}
            </a>
          </div>
        </section>
        )}

        {activeTab === "general" && stats && (
          <section className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800">
            <h2 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
              {t("settings.stats_title")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800">
                <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{stats.totalBooks}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t("settings.stats_books_total")}</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800">
                <p className="text-2xl font-semibold text-brand">{stats.reading}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t("settings.stats_books_reading")}</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800">
                <p className="text-2xl font-semibold text-teal-600 dark:text-teal-400">{stats.completed}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t("settings.stats_books_completed")}</p>
              </div>
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800">
                <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">{stats.pagesRead}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t("settings.stats_pages_read")}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "general" && (
        <div className="mt-10 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/50">
          <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
            {t("settings.philosophy")}
          </p>
        </div>
        )}
      </main>
    </div>
  );
};
