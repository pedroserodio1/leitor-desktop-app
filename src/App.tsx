import { useState } from "react";
import { ReaderLayout } from "./components/layout/ReaderLayout";
import { LibraryView } from "./components/library/LibraryView";
import { BookDetailView } from "./components/library/BookDetailView";
import type { LibraryBook } from "./types/library";

type ViewState = "library" | "detail" | "reader";

function App() {
  const [view, setView] = useState<ViewState>("library");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [readerContent, setReaderContent] = useState<{
    paths: string[];
    title: string;
  } | null>(null);

  if (view === "library") {
    return (
      <LibraryView
        onSelectBook={(book) => {
          setSelectedBook(book);
          setView("detail");
        }}
      />
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
        onRead={(paths, title) => {
          setReaderContent({ paths, title });
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
    />
  );
}

export default App;
