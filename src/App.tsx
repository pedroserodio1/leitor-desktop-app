import { useState, useEffect, useRef } from "react";
import { ReaderLayout } from "./components/layout/ReaderLayout";
import { LibraryView } from "./components/library/LibraryView";
import { BookDetailView } from "./components/library/BookDetailView";
import { BookEditView } from "./components/library/BookEditView";
import { GlobalSettingsView } from "./components/settings/GlobalSettingsView";
import { useReaderStore } from "./store/readerStore";
import { useLibrary } from "./hooks/useLibrary";
import {
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

function App() {
  const theme = useReaderStore((s) => s.settings.theme);
  const setSetting = useReaderStore((s) => s.setSetting);

  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.classList.toggle("dark", mq.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    getGlobalSettings()
      .then((g) => {
        if (g.theme === "light" || g.theme === "dark" || g.theme === "system")
        setSetting("theme", g.theme);
      })
      .catch((e) => console.error("[App] getGlobalSettings:", e));
  }, [setSetting]);

  const { removeBook } = useLibrary();
  const [view, setView] = useState<ViewState>("library");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [readerContent, setReaderContent] = useState<{
    paths: string[];
    title: string;
    bookId: string;
    volumeId: string;
  } | null>(null);
  const pendingFileHandled = useRef(false);

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
        onSelectBook={(book) => {
          setSelectedBook(book);
          setView("detail");
        }}
        onRead={(paths, title, bookId, volumeId) => {
          setReaderContent({ paths, title, bookId, volumeId });
          setView("reader");
        }}
        onOpenSettings={() => setView("settings")}
      />
    );
  }

  if (view === "settings") {
    return (
      <GlobalSettingsView onBack={() => setView("library")} />
    );
  }

  const handleRemoveBook = (bookId: string) => {
    removeBook(bookId);
    setSelectedBook(null);
    setView("library");
  };

  if (view === "detail" && selectedBook) {
    return (
      <BookDetailView
        book={selectedBook}
        onBack={() => {
          setSelectedBook(null);
          setView("library");
        }}
        onRead={(paths, title, bookId, volumeId) => {
          setReaderContent({ paths, title, bookId, volumeId });
          setView("reader");
        }}
        onEdit={() => setView("edit")}
        onRemove={handleRemoveBook}
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
      onSelectBook={(book) => {
        setSelectedBook(book);
        setView("detail");
      }}
      onRead={(paths, title, bookId, volumeId) => {
        setReaderContent({ paths, title, bookId, volumeId });
        setView("reader");
      }}
      onOpenSettings={() => setView("settings")}
    />
  );
}

export default App;
