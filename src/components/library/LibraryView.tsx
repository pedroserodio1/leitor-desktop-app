import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ArrowDownUp, Bookmark, ChevronDown, Filter, Library as LibraryIcon, Plus, Search, Settings } from "lucide-react";
import { BookCardWithContextMenu } from "./BookCardWithContextMenu";
import { showContextMenu, type ContextMenuEntry } from "../../utils/contextMenu";
import { AddBookModal } from "./AddBookModal";
import { useLibrary } from "../../hooks/useLibrary";
import { useShelves } from "../../hooks/useShelves";
import { getBookFormat } from "../../services/libraryService";
import * as db from "../../services/dbService";
import type { LibraryBook } from "../../types/library";

type SortOrder = "addedAt" | "title" | "progress";
type FilterFormat = "all" | "images" | "pdf" | "epub" | "archive";
type FilterStatus = "all" | "not_started" | "reading" | "completed";
type FilterShelf = string | null; // shelf id or null for all

interface LibraryViewProps {
  onSelectBook: (book: LibraryBook, options?: { autoSearchMetadata?: boolean }) => void;
  onEditBook?: (book: LibraryBook) => void;
  onRead?: (paths: string[], title: string, bookId: string, volumeId: string) => void;
  onRemoveBook?: (bookId: string) => void;
  onOpenSettings?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectBook,
  onEditBook,
  onRead,
  onRemoveBook,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const { shelves, addToShelf } = useShelves();
  const [shelfFilterBookIds, setShelfFilterBookIds] = useState<string[]>([]);
  const {
    books,
    recentProgress,
    progressMap,
    loaded,
    addFromFolder,
    addFromFile,
    error,
    clearError,
    isImporting,
    refresh,
  } = useLibrary();

  const [modalOpen, setModalOpen] = useState(false);
  const [addAndSearchMetadata, setAddAndSearchMetadata] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("addedAt");
  const [filterFormat, setFilterFormat] = useState<FilterFormat>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterShelf, setFilterShelf] = useState<FilterShelf>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showShelfDropdown, setShowShelfDropdown] = useState(false);
  const [failedCovers, setFailedCovers] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shelfDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showShelfDropdown && shelfDropdownRef.current && !shelfDropdownRef.current.contains(e.target as Node)) {
        setShowShelfDropdown(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showShelfDropdown]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!filterShelf) {
      setShelfFilterBookIds([]);
      return;
    }
    db.getBooksInShelf(filterShelf).then(setShelfFilterBookIds);
  }, [filterShelf]);

  const handleSelectFolder = useCallback(async () => {
    const book = await addFromFolder();
    if (book) {
      setModalOpen(false);
      if (addAndSearchMetadata) {
        onSelectBook(book, { autoSearchMetadata: true });
      }
    }
  }, [addFromFolder, addAndSearchMetadata, onSelectBook]);

  const handleSelectFile = useCallback(async () => {
    const book = await addFromFile();
    if (book) {
      setModalOpen(false);
      if (addAndSearchMetadata) {
        onSelectBook(book, { autoSearchMetadata: true });
      }
    }
  }, [addFromFile, addAndSearchMetadata, onSelectBook]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    clearError();
  }, [clearError]);

  const handleLibraryContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const items: ContextMenuEntry[] = [
        { id: "add_book", text: t("context.add_book"), action: () => setModalOpen(true) },
        { id: "add_folder", text: t("context.add_folder"), action: () => handleSelectFolder() },
        { id: "add_file", text: t("context.add_file"), action: () => handleSelectFile() },
      ];
      if (books.length === 0 && onOpenSettings) {
        items.push({
          id: "create_shelf",
          text: t("library.create_shelf"),
          action: onOpenSettings,
        });
      }
      if (onOpenSettings) {
        items.push({ id: "settings", text: t("context.settings"), action: onOpenSettings });
      }
      showContextMenu(items, e.clientX, e.clientY).catch(() => {});
    },
    [handleSelectFolder, handleSelectFile, onOpenSettings, books.length, t]
  );

  const handleHeaderContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const items: ContextMenuEntry[] = [
        { id: "add_book", text: t("context.add_book"), action: () => setModalOpen(true) },
      ];
      if (onOpenSettings) {
        items.push({ id: "settings", text: t("context.settings"), action: onOpenSettings });
      }
      items.push({
        id: "focus_search",
        text: t("context.focus_search", "Focar busca"),
        action: () => searchInputRef.current?.focus(),
      });
      showContextMenu(items, e.clientX, e.clientY).catch(() => {});
    },
    [onOpenSettings, t]
  );

  const handleContinueReadingContextMenu = useCallback(
    (e: React.MouseEvent, item: (typeof recentProgress)[0]) => {
      e.preventDefault();
      e.stopPropagation();
      const items: ContextMenuEntry[] = [
        {
          id: "continue",
          text: t("context.continue_reading"),
          action: () =>
            onRead?.(
              item.volume.chapters.map((c) => c.path),
              `${item.book.title} — ${item.volume.name}`,
              item.book.id,
              item.volume.id
            ),
        },
        {
          id: "open",
          text: t("context.open"),
          action: () => onSelectBook(item.book),
        },
      ];
      if (onRemoveBook) {
        items.push({
          id: "remove",
          text: t("context.remove"),
          action: () => onRemoveBook(item.book.id),
        });
      }
      showContextMenu(items, e.clientX, e.clientY).catch(() => {});
    },
    [onRead, onSelectBook, onRemoveBook, t]
  );

  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950" data-testid="library-view">
      <header
        className="shrink-0 flex items-center justify-between px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm"
        onContextMenu={handleHeaderContextMenu}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0 max-w-2xl">
          <div className="p-2 rounded-xl bg-brand/10 dark:bg-brand/20 shrink-0">
            <LibraryIcon className="w-7 h-7 text-brand" strokeWidth={1.75} />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight shrink-0">
            {t("library.title")}
          </h1>
          {books.length > 0 && (
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("library.search_placeholder")}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-transparent focus:border-brand/50 focus:outline-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
                aria-label={t("library.search_placeholder")}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onOpenSettings && (
            <button
            type="button"
            onClick={onOpenSettings}
            data-testid="btn-settings"
            className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
            title={t("library.app_settings")}
            aria-label={t("library.app_settings")}
          >
              <Settings className="w-6 h-6" strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            data-testid="btn-add-book"
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all duration-200"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            {t("library.add_book")}
          </button>
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto p-8"
        onContextMenu={handleLibraryContextMenu}
      >
        {recentProgress.length > 0 && onRead && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-4">
              {t("library.continue_reading")}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {recentProgress.map((item) => (
                <button
                  key={`${item.book.id}-${item.volume.id}`}
                  type="button"
                  onClick={() =>
                    onRead?.(
                      item.volume.chapters.map((c) => c.path),
                      `${item.book.title} — ${item.volume.name}`,
                      item.book.id,
                      item.volume.id
                    )
                  }
                  onContextMenu={(e) => handleContinueReadingContextMenu(e, item)}
                  className="flex-shrink-0 w-28 text-left rounded-xl overflow-hidden bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-brand/40 dark:hover:border-brand/40 transition-all"
                >
                  <div className="aspect-[3/4] bg-stone-200 dark:bg-stone-800 flex items-center justify-center overflow-hidden">
                    {item.book.coverPath && !failedCovers.has(item.book.coverPath) ? (
                      <img
                        src={convertFileSrc(item.book.coverPath)}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setFailedCovers((s) => new Set(s).add(item.book.coverPath!))}
                      />
                    ) : (
                      <span className="text-3xl text-stone-400">📖</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                      {item.book.title}
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">
                      {item.pageIndex} / {item.volume.chapters.length}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
        {!loaded ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-500 dark:text-stone-400" data-testid="library-loading">
            {t("library.loading")}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" data-testid="library-empty">
            <div className="w-28 h-28 rounded-3xl bg-stone-200/80 dark:bg-stone-800/80 flex items-center justify-center mb-6 shadow-inner">
              <LibraryIcon className="w-14 h-14 text-stone-400 dark:text-stone-500" strokeWidth={1.25} />
            </div>
            <p className="font-heading text-xl text-stone-700 dark:text-stone-300 mb-2">
              {t("library.no_books")}
            </p>
            <p className="text-stone-500 dark:text-stone-400 text-sm max-w-sm mb-8">
              Adicione uma pasta ou arquivo para começar a ler.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium shadow-lg shadow-brand/20 transition-all duration-200"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              {t("library.add_book")}
            </button>
          </div>
        ) : (
          <>
            {books.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/80">
                  <ArrowDownUp className="w-4 h-4 text-stone-500 dark:text-stone-400" strokeWidth={1.75} />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="bg-transparent border-0 text-sm font-medium text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer pr-6"
                  >
                    <option value="addedAt">{t("library.sort_added")}</option>
                    <option value="title">{t("library.sort_title")}</option>
                    <option value="progress">{t("library.sort_progress")}</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((s) => !s)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showFilters ? "bg-brand/15 dark:bg-brand/25 text-brand ring-1 ring-brand/30" : "bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"}`}
                >
                  <Filter className="w-4 h-4" strokeWidth={1.75} />
                  {t("library.filter_all")}
                </button>
                {showFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/80">
                      <select
                        value={filterFormat}
                        onChange={(e) => setFilterFormat(e.target.value as FilterFormat)}
                        className="bg-transparent border-0 text-sm font-medium text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer pr-5"
                      >
                        <option value="all">{t("library.filter_all")}</option>
                        <option value="images">{t("library.filter_format_images")}</option>
                        <option value="pdf">{t("library.filter_format_pdf")}</option>
                        <option value="epub">{t("library.filter_format_epub")}</option>
                        <option value="archive">{t("library.filter_format_archive")}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/80">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                        className="bg-transparent border-0 text-sm font-medium text-stone-700 dark:text-stone-200 focus:outline-none cursor-pointer pr-5"
                      >
                        <option value="all">{t("library.filter_status_all")}</option>
                        <option value="not_started">{t("library.filter_status_not_started")}</option>
                        <option value="reading">{t("library.filter_status_reading")}</option>
                        <option value="completed">{t("library.filter_status_completed")}</option>
                      </select>
                    </div>
                    <div className="relative" ref={shelfDropdownRef}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShelfDropdown((s) => !s);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors min-w-[140px] justify-between ${filterShelf ? "bg-brand/15 dark:bg-brand/25 text-brand ring-1 ring-brand/30" : "bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"}`}
                      >
                        <Bookmark className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">
                          {filterShelf ? shelves.find((s) => s.id === filterShelf)?.name ?? t("library.shelves") : t("library.shelves")}
                        </span>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showShelfDropdown ? "rotate-180" : ""}`} strokeWidth={2} />
                      </button>
                      {showShelfDropdown && (
                        <div className="absolute left-0 top-full mt-1.5 py-1.5 min-w-[180px] rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl z-30">
                          <button
                            type="button"
                            onClick={() => { setFilterShelf(null); setShowShelfDropdown(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${!filterShelf ? "bg-brand/10 dark:bg-brand/20 text-brand" : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"}`}
                          >
                            {t("library.filter_all")}
                          </button>
                          {shelves.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{t("library.no_shelves", "Nenhuma estante")}</p>
                          ) : (
                            shelves.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => { setFilterShelf(s.id); setShowShelfDropdown(false); }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2 ${filterShelf === s.id ? "bg-brand/10 dark:bg-brand/20 text-brand" : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"}`}
                              >
                                <Bookmark className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                                {s.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" data-testid="library-grid">
            {books
              .filter((book) => {
                if (searchQuery.trim() && !book.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                if (filterFormat !== "all" && getBookFormat(book) !== filterFormat) return false;
                const prog = progressMap.get(book.id);
                const status = prog?.status ?? "not_started";
                if (filterStatus !== "all" && status !== filterStatus) return false;
                if (filterShelf && !shelfFilterBookIds.includes(book.id)) return false;
                return true;
              })
              .sort((a, b) => {
                if (sortOrder === "title") return a.title.localeCompare(b.title);
                if (sortOrder === "progress") {
                  const pa = progressMap.get(a.id)?.progressPercent ?? 0;
                  const pb = progressMap.get(b.id)?.progressPercent ?? 0;
                  return pb - pa;
                }
                return b.addedAt - a.addedAt;
              })
              .map((book) => (
              <BookCardWithContextMenu
                key={`${book.id}-${book.coverPath ?? ""}`}
                book={book}
                shelves={shelves}
                onOpen={() => onSelectBook(book)}
                onRead={
                  onRead
                    ? () => {
                        const vol = book.volumes[0];
                        if (vol) {
                          onRead(
                            vol.chapters.map((c) => c.path),
                            book.title,
                            book.id,
                            vol.id
                          );
                        }
                      }
                    : undefined
                }
                onEdit={onEditBook ? () => onEditBook(book) : undefined}
                onRemove={
                  onRemoveBook
                    ? () => onRemoveBook(book.id)
                    : undefined
                }
                onProgressChanged={refresh}
                addToShelf={addToShelf}
                progressPercent={progressMap.get(book.id)?.progressPercent}
              />
            ))}
          </div>
          </>
        )}
      </main>

      <AddBookModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSelectFolder={handleSelectFolder}
        onSelectFile={handleSelectFile}
        error={error}
        onClearError={clearError}
        isImporting={isImporting}
        addAndSearchMetadata={addAndSearchMetadata}
        onAddAndSearchMetadataChange={setAddAndSearchMetadata}
      />
    </div>
  );
};
