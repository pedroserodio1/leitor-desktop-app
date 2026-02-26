import { useState, useEffect } from "react";
import { ReaderLayout } from "./components/layout/ReaderLayout";
import { LibraryView } from "./components/library/LibraryView";
import { BookDetailView } from "./components/library/BookDetailView";
import { GlobalSettingsView } from "./components/settings/GlobalSettingsView";
import { useReaderStore } from "./store/readerStore";
import { getGlobalSettings } from "./services/dbService";
import type { LibraryBook } from "./types/library";

type ViewState = "library" | "detail" | "reader" | "settings";

function App() {
  const theme = useReaderStore((s) => s.settings.theme);
  const setSetting = useReaderStore((s) => s.setSetting);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    getGlobalSettings()
      .then((g) => {
        if (g.theme === "light" || g.theme === "dark") setSetting("theme", g.theme);
      })
      .catch((e) => console.error("[App] getGlobalSettings:", e));
  }, [setSetting]);

  const [view, setView] = useState<ViewState>("library");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [readerContent, setReaderContent] = useState<{
    paths: string[];
    title: string;
    bookId: string;
    volumeId: string;
  } | null>(null);

  if (view === "library") {
    return (
      <LibraryView
        onSelectBook={(book) => {
          setSelectedBook(book);
          setView("detail");
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
      onOpenSettings={() => setView("settings")}
    />
  );
}

export default App;
