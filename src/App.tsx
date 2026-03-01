import { useState, useEffect, useRef } from "react";
import { ReaderLayout } from "./components/layout/ReaderLayout";
import { LibraryView } from "./components/library/LibraryView";
import { BookDetailView } from "./components/library/BookDetailView";
import { BookEditView } from "./components/library/BookEditView";
import { GlobalSettingsView } from "./components/settings/GlobalSettingsView";
import { useReaderStore } from "./store/readerStore";
import { useLibrary } from "./hooks/useLibrary";
import { invoke } from "@tauri-apps/api/core";
import {
  getCustomTheme,
  getGlobalSettings,
  getPendingFileToOpen,
} from "./services/dbService";
import {
  scanFile,
  loadLibrary,
  hasBookByPath,
  persistBook,
} from "./services/libraryService";
import type { LibraryBook } from "./types/library";

type ViewState = "library" | "detail" | "reader" | "settings" | "edit";

const CUSTOM_THEME_STYLE_ID = "custom-theme";

function App() {
  const theme = useReaderStore((s) => s.settings.theme);
  const customThemeId = useReaderStore((s) => s.settings.customThemeId);
  const customThemeRefreshKey = useReaderStore((s) => s.customThemeRefreshKey);
  const setSetting = useReaderStore((s) => s.setSetting);

  useEffect(() => {
    if (theme === "custom") {
      document.documentElement.classList.remove("dark");
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute("content", "#fafafa");
      return;
    }
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", isDark ? "#171717" : "#fafafa");
  }, [theme]);

  useEffect(() => {
    let el = document.getElementById(CUSTOM_THEME_STYLE_ID);
    if (theme === "custom" && customThemeId) {
      getCustomTheme(customThemeId)
        .then((t) => {
          if (!t) return;
          if (!el) {
            el = document.createElement("style");
            el.id = CUSTOM_THEME_STYLE_ID;
            document.head.appendChild(el);
          }
          el.textContent = t.css;
        })
        .catch((e) => console.error("[App] Failed to load custom theme:", e));
    } else {
      if (el) el.remove();
    }
  }, [theme, customThemeId, customThemeRefreshKey]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const isDark = mq.matches;
      document.documentElement.classList.toggle("dark", isDark);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute("content", isDark ? "#171717" : "#fafafa");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    getGlobalSettings()
      .then((g) => {
        if (g.theme === "light" || g.theme === "dark" || g.theme === "system" || g.theme === "custom") {
          setSetting("theme", g.theme as "light" | "dark" | "system" | "custom");
          if (g.custom_theme_id) setSetting("customThemeId", g.custom_theme_id);
        }
      })
      .catch((e) => console.error("[App] getGlobalSettings:", e));
  }, [setSetting]);

  useEffect(() => {
    invoke("close_splashscreen").catch(() => {});
  }, []);

  const { removeBook, refresh } = useLibrary();
  const [view, setView] = useState<ViewState>("library");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [autoSearchMetadataOnMount, setAutoSearchMetadataOnMount] = useState(false);
  const [readerContent, setReaderContent] = useState<{
    paths: string[];
    title: string;
    bookId: string;
    volumeId: string;
  } | null>(null);
  const pendingFileHandled = useRef(false);

  const handleRemoveBook = (bookId: string) => {
    removeBook(bookId);
    setSelectedBook(null);
    setView("library");
  };

  useEffect(() => {
    if (pendingFileHandled.current) return;
    pendingFileHandled.current = true;
    getPendingFileToOpen()
      .then(async (path) => {
        if (!path) return;
        try {
          const book = scanFile(path);
          const books = await loadLibrary();
          if (!hasBookByPath(books, book.path)) {
            await persistBook(book);
          }
          const vol = book.volumes[0];
          const paths = vol.chapters.map((c) => c.path);
          setSelectedBook(book);
          setReaderContent({
            paths,
            title: book.title,
            bookId: book.id,
            volumeId: vol.id,
          });
          setView("reader");
        } catch (e) {
          console.error("[App] open pending file:", e);
        }
      })
      .catch((e) => console.error("[App] getPendingFileToOpen:", e));
  }, []);

  if (view === "library") {
    return (
      <LibraryView
        onSelectBook={(book, options) => {
          setSelectedBook(book);
          setAutoSearchMetadataOnMount(options?.autoSearchMetadata ?? false);
          setView("detail");
        }}
        onEditBook={(book) => {
          setSelectedBook(book);
          setView("edit");
        }}
        onRead={(paths, title, bookId, volumeId) => {
          setReaderContent({ paths, title, bookId, volumeId });
          setView("reader");
        }}
        onRemoveBook={handleRemoveBook}
        onOpenSettings={() => setView("settings")}
      />
    );
  }

  if (view === "settings") {
    return (
      <GlobalSettingsView onBack={() => setView("library")} />
    );
  }

  if (view === "detail" && selectedBook) {
    return (
      <BookDetailView
        book={selectedBook}
        autoSearchMetadataOnMount={autoSearchMetadataOnMount}
        onAutoSearchMetadataDone={() => setAutoSearchMetadataOnMount(false)}
        onBack={() => {
          setSelectedBook(null);
          setAutoSearchMetadataOnMount(false);
          setView("library");
        }}
        onRead={(paths, title, bookId, volumeId) => {
          setReaderContent({ paths, title, bookId, volumeId });
          setView("reader");
        }}
        onEdit={() => setView("edit")}
        onRemove={handleRemoveBook}
        onBookUpdated={async (updated) => {
          setSelectedBook(updated);
          await refresh();
        }}
      />
    );
  }

  if (view === "edit" && selectedBook) {
    return (
      <BookEditView
        book={selectedBook}
        onBack={() => setView("detail")}
        onSave={(updated) => {
          setSelectedBook(updated);
          setView("detail");
        }}
      />
    );
  }

  if (view === "reader" && readerContent) {
    return (
      <ReaderLayout
        content={readerContent}
        onBack={() => {
          setReaderContent(null);
          setView("detail");
        }}
        onBackToLibrary={() => {
          setReaderContent(null);
          setSelectedBook(null);
          setView("library");
        }}
      />
    );
  }

  // Fallback: voltar para biblioteca
  return (
    <LibraryView
      onSelectBook={(book, options) => {
        setSelectedBook(book);
        setAutoSearchMetadataOnMount(options?.autoSearchMetadata ?? false);
        setView("detail");
      }}
      onEditBook={(book) => {
        setSelectedBook(book);
        setView("edit");
      }}
      onRead={(paths, title, bookId, volumeId) => {
        setReaderContent({ paths, title, bookId, volumeId });
        setView("reader");
      }}
      onRemoveBook={handleRemoveBook}
      onOpenSettings={() => setView("settings")}
    />
  );
}

export default App;
