import React, { useCallback, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { ArrowLeft, BookOpen, FileText, ChevronRight, Bookmark, Pencil, Book, Trash2, CheckCircle, RotateCcw, Check, Search, Loader2, Lightbulb } from "lucide-react";
import { useShelves } from "../../hooks/useShelves";
import { showContextMenu, type ContextMenuEntry } from "../../utils/contextMenu";
import {
  applyMetadataCandidate,
  saveProgress,
  searchMetadata,
  type RankedCandidateDto,
} from "../../services/dbService";
import { loadLibrary, mapBookWithVolumesToLibraryBook } from "../../services/libraryService";
import type { LibraryBook, Volume, Chapter } from "../../types/library";

interface BookDetailViewProps {
  book: LibraryBook;
  onBack: () => void;
  onRead: (paths: string[], title: string, bookId: string, volumeId: string) => void;
  onEdit?: () => void;
  onRemove?: (bookId: string) => void;
  onBookUpdated?: (book: LibraryBook) => void;
  autoSearchMetadataOnMount?: boolean;
  onAutoSearchMetadataDone?: () => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  onBack,
  onRead,
  onEdit,
  onRemove,
  onBookUpdated,
  autoSearchMetadataOnMount = false,
  onAutoSearchMetadataDone,
}) => {
  const { t } = useTranslation();
  const { shelves, bookShelfIds, loadBookShelfIds, addToShelf, removeFromShelf } = useShelves();
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [searchingMetadata, setSearchingMetadata] = useState(false);
  const [metadataMessage, setMetadataMessage] = useState<string | null>(null);
  const [metadataCandidates, setMetadataCandidates] = useState<RankedCandidateDto[] | null>(null);
  const [applyingCandidate, setApplyingCandidate] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const shelfMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCoverError(false);
  }, [book.id, book.coverPath]);

  useEffect(() => {
    loadBookShelfIds(book.id);
  }, [book.id, loadBookShelfIds]);

  useEffect(() => {
    if (autoSearchMetadataOnMount) {
      onAutoSearchMetadataDone?.();
      void handleSearchMetadata();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount when flag is set

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showShelfMenu && shelfMenuRef.current && !shelfMenuRef.current.contains(e.target as Node)) {
        setShowShelfMenu(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showShelfMenu]);

  const currentShelfIds = bookShelfIds.get(book.id) ?? [];

  const hasMultipleVolumes = book.volumes.length > 1;
  const currentChapters = selectedVolume?.chapters ?? book.volumes[0]?.chapters ?? [];

  const handleVolumeClick = (volume: Volume) => {
    if (hasMultipleVolumes) {
      setSelectedVolume(volume);
    }
  };

  const handleChapterClick = (chapter: Chapter, volume: Volume) => {
    onRead([chapter.path], chapter.name, book.id, volume.id);
  };

  const handleReadVolume = (volume: Volume) => {
    const paths = volume.chapters.map((c) => c.path);
    onRead(paths, volume.name, book.id, volume.id);
  };

  const handleMarkCompleted = async () => {
    for (const vol of book.volumes) {
      await saveProgress({
        book_id: book.id,
        volume_id: vol.id,
        current_chapter_id: null,
        page_index: vol.chapters.length,
        scroll_offset: 0,
        updated_at: Date.now(),
      });
    }
  };

  const handleResetProgress = async () => {
    for (const vol of book.volumes) {
      await saveProgress({
        book_id: book.id,
        volume_id: vol.id,
        current_chapter_id: null,
        page_index: 1,
        scroll_offset: 0,
        updated_at: Date.now(),
      });
    }
  };

  const handleSearchMetadata = async () => {
    setSearchingMetadata(true);
    setMetadataMessage(null);
    setMetadataCandidates(null);
    try {
      const result = await searchMetadata(book.id);
      if (result.applied) {
        const books = await loadLibrary();
        const updated = books.find((b) => b.id === book.id);
        if (updated) onBookUpdated?.(updated);
        setMetadataMessage(
          result.confirmed
            ? t("library.book_detail.metadata_applied", "Metadados aplicados")
            : t("library.book_detail.metadata_not_confirmed", "Metadado não confirmado")
        );
      } else if (result.candidates && result.candidates.length > 1) {
        setMetadataCandidates(result.candidates);
      } else if (result.candidates && result.candidates.length === 1) {
        setMetadataMessage(
          result.confirmed
            ? t("library.book_detail.metadata_not_confirmed", "Nenhum resultado adequado encontrado")
            : t("library.book_detail.metadata_no_match", "Score baixo — metadado não aplicado")
        );
      } else if (result.source) {
        setMetadataMessage(
          result.confirmed
            ? t("library.book_detail.metadata_not_confirmed", "Nenhum resultado adequado encontrado")
            : t("library.book_detail.metadata_no_match", "Score baixo — metadado não aplicado")
        );
      } else {
        setMetadataMessage(t("library.book_detail.metadata_no_results", "Nenhum resultado encontrado"));
      }
    } catch (e) {
      console.error("[BookDetailView] searchMetadata:", e);
      setMetadataMessage(t("library.book_detail.metadata_error", "Erro ao buscar metadados"));
    } finally {
      setSearchingMetadata(false);
    }
  };

  const handleHeaderContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const items: ContextMenuEntry[] = [
        {
          id: "back",
          text: t("context.back", "Voltar"),
          action: () => (selectedVolume ? setSelectedVolume(null) : onBack()),
        },
      ];
      if (onEdit) {
        items.push({ id: "edit", text: t("context.edit"), action: onEdit });
      }
      if (shelves.length > 0) {
        items.push({
          id: "add_to_shelf",
          text: t("context.add_to_shelf"),
          items: shelves.map((shelf) => ({
            id: `shelf-${shelf.id}`,
            text: shelf.name,
            action: async () => {
              const isIn = currentShelfIds.includes(shelf.id);
              if (isIn) await removeFromShelf(book.id, shelf.id);
              else await addToShelf(book.id, shelf.id);
            },
          })),
        });
      }
      items.push({
        id: "search_metadata",
        text: t("context.search_metadata"),
        action: () => void handleSearchMetadata(),
      });
      items.push({
        id: "mark_completed",
        text: t("context.mark_completed"),
        action: () => void handleMarkCompleted(),
      });
      items.push({
        id: "reset_progress",
        text: t("context.reset_progress"),
        action: () => void handleResetProgress(),
      });
      items.push({
        id: "reveal",
        text: t("context.reveal_in_folder"),
        action: () => revealItemInDir(book.path).catch(() => {}),
      });
      if (onRemove) {
        items.push({
          id: "remove",
          text: t("context.remove"),
          action: () => setShowRemoveConfirm(true),
        });
      }
      showContextMenu(items, e.clientX, e.clientY).catch(() => {});
    },
    [
      selectedVolume,
      onBack,
      onEdit,
      onRemove,
      shelves,
      currentShelfIds,
      book,
      addToShelf,
      removeFromShelf,
      t,
    ]
  );

  const handleChapterContextMenu = useCallback(
    (e: React.MouseEvent, chapter: Chapter, volume: Volume) => {
      e.preventDefault();
      e.stopPropagation();
      const ext = volume.chapters[0]?.path.split(".").pop()?.toLowerCase() ?? "";
      const isImage = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext);
      const showReadVolume = volume.chapters.length > 1 && isImage;

      const items: ContextMenuEntry[] = [
        {
          id: "read_chapter",
          text: t("context.read_chapter", "Ler este capítulo"),
          action: () => handleChapterClick(chapter, volume),
        },
      ];
      if (showReadVolume) {
        items.push({
          id: "read_volume",
          text: t("library.book_detail.read_entire_volume"),
          action: () => handleReadVolume(volume),
        });
      }
      showContextMenu(items, e.clientX, e.clientY).catch(() => {});
    },
    [t]
  );

  const handleVolumeContextMenu = useCallback(
    (e: React.MouseEvent, volume: Volume) => {
      e.preventDefault();
      e.stopPropagation();
      const items: ContextMenuEntry[] = [
        {
          id: "read_volume",
          text: t("library.book_detail.read_entire_volume"),
          action: () => handleReadVolume(volume),
        },
        {
          id: "select_volume",
          text: t("library.book_detail.chapters"),
          action: () => handleVolumeClick(volume),
        },
      ];
      showContextMenu(items, e.clientX, e.clientY).catch(() => {});
    },
    [t]
  );

  const handleApplyCandidate = async (candidate: RankedCandidateDto) => {
    setApplyingCandidate(true);
    setMetadataMessage(null);
    try {
      const bookWithVolumes = await applyMetadataCandidate(book.id, candidate.candidate);
      const updated = mapBookWithVolumesToLibraryBook(bookWithVolumes);
      onBookUpdated?.(updated);
      setMetadataCandidates(null);
      setMetadataMessage(t("library.book_detail.metadata_applied", "Metadados aplicados"));
    } catch (e) {
      console.error("[BookDetailView] applyMetadataCandidate:", e);
      setMetadataMessage(t("library.book_detail.metadata_error", "Erro ao aplicar metadados"));
    } finally {
      setApplyingCandidate(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950" data-testid="book-detail-view">
      <header
        className="flex-shrink-0 flex items-center gap-4 px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm"
        onContextMenu={handleHeaderContextMenu}
      >
        <button
          type="button"
          onClick={selectedVolume ? () => setSelectedVolume(null) : onBack}
          data-testid="btn-back"
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100 truncate">
            {book.title}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {selectedVolume
              ? selectedVolume.name
              : hasMultipleVolumes
                ? t("library.book_detail.select_volume")
                : t("library.book_detail.chapters")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              data-testid="btn-edit-book"
              className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
              title={t("library.book_detail.edit")}
            >
              <Pencil className="w-5 h-5" strokeWidth={1.75} />
            </button>
          )}
          <div className="relative" ref={shelfMenuRef}>
            <button
              type="button"
              onClick={() => setShowShelfMenu((s) => !s)}
              className={`p-2.5 rounded-xl transition-colors ${showShelfMenu ? "bg-brand/15 dark:bg-brand/25 text-brand" : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"}`}
              title={t("library.add_to_shelf")}
            >
              <Bookmark className="w-5 h-5" strokeWidth={1.75} />
            </button>
            {showShelfMenu && (
              <div className="absolute right-0 top-full mt-2 py-2 min-w-[200px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t("library.add_to_shelf")}
                  </p>
                </div>
                {shelves.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-stone-500 dark:text-stone-400">{t("library.no_shelves", "Nenhuma estante")}</p>
                ) : (
                  shelves.map((shelf) => {
                    const isIn = currentShelfIds.includes(shelf.id);
                    return (
                      <button
                        key={shelf.id}
                        type="button"
                        onClick={async () => {
                          if (isIn) await removeFromShelf(book.id, shelf.id);
                          else await addToShelf(book.id, shelf.id);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${isIn ? "bg-brand/10 dark:bg-brand/20 text-brand" : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/80"}`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isIn ? "bg-brand text-white" : "border-2 border-stone-300 dark:border-stone-600"}`}>
                          {isIn && <Check className="w-3 h-3" strokeWidth={3} />}
                        </span>
                        <Bookmark className="w-4 h-4 text-stone-400" strokeWidth={1.75} />
                        {shelf.name}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {!selectedVolume && (
          <div className="relative flex flex-col sm:flex-row gap-8 max-w-4xl mb-8">
            {searchingMetadata && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center animate-metadata-shimmer">
                      <Book className="w-10 h-10 text-brand" strokeWidth={1.25} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-stone-600 dark:text-stone-400 animate-pulse">
                    {t("library.book_detail.searching_metadata", "Buscando metadados...")}
                  </p>
                </div>
              </div>
            )}
            <div className="shrink-0 w-36 sm:w-48">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                {book.coverPath && !coverError ? (
                  <img
                    src={convertFileSrc(book.coverPath)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setCoverError(true)}
                  />
                ) : (
                  <Book className="w-16 h-16 text-stone-400 dark:text-stone-500" strokeWidth={1.25} />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-4">
              <h2 className="font-heading text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {book.title}
              </h2>
              <div className="space-y-2">
                {book.author ? (
                  <p className="text-stone-600 dark:text-stone-300">{book.author}</p>
                ) : onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:text-brand hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors"
                  >
                    <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    {t("library.book_detail.add_author")}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {book.description ? (
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-4">
                    {book.description}
                  </p>
                ) : onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:text-brand hover:bg-stone-100 dark:hover:bg-stone-800/80 transition-colors w-fit"
                  >
                    <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    {t("library.book_detail.add_description")}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSearchMetadata}
                  disabled={searchingMetadata}
                  data-testid="btn-search-metadata"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-brand/10 dark:bg-brand/20 text-brand hover:bg-brand/15 dark:hover:bg-brand/25 transition-colors disabled:opacity-50"
                >
                  {searchingMetadata ? (
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <Search className="w-4 h-4" strokeWidth={1.75} />
                  )}
                  {searchingMetadata
                    ? t("library.book_detail.searching_metadata", "Buscando...")
                    : t("library.book_detail.search_metadata", "Buscar metadados")}
                </button>
                {metadataMessage && (
                  <div
                    className={`w-full mt-2 flex items-start gap-2.5 p-3 rounded-xl ${
                      /aplicad|applied/i.test(metadataMessage)
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
                    }`}
                  >
                    {!/aplicad|applied/i.test(metadataMessage) ? (
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                    ) : null}
                    <p className="text-sm leading-relaxed">{metadataMessage}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" strokeWidth={1.75} />
                  {t("library.book_detail.mark_completed")}
                </button>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                  {t("library.book_detail.reset_progress")}
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    {t("library.book_detail.remove_from_library")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {metadataCandidates && metadataCandidates.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-md p-4"
            onClick={(e) => e.target === e.currentTarget && setMetadataCandidates(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="metadata-select-title"
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
                <h2 id="metadata-select-title" className="font-heading text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {t("library.book_detail.metadata_select_title", "Escolha o resultado")}
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {t("library.book_detail.metadata_select_hint", "Vários resultados encontrados. Selecione o correto.")}
                </p>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {metadataCandidates.map((rc, idx) => (
                  <button
                    key={`${rc.candidate.source}-${rc.candidate.source_id}-${idx}`}
                    type="button"
                    onClick={() => handleApplyCandidate(rc)}
                    disabled={applyingCandidate}
                    className="w-full flex gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 hover:border-brand/40 dark:hover:border-brand/40 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-left disabled:opacity-60"
                  >
                    {rc.candidate.cover_url ? (
                      <img
                        src={rc.candidate.cover_url}
                        alt=""
                        className="w-14 h-20 object-cover rounded-lg shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                        <Book className="w-7 h-7 text-stone-400" strokeWidth={1.25} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 capitalize">
                          {rc.candidate.source.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {rc.candidate.media_type} · {Math.round(rc.score)}%
                        </span>
                      </div>
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate mt-1">
                        {rc.candidate.title}
                      </p>
                      {rc.candidate.author && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                          {rc.candidate.author}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex-shrink-0 space-y-3">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {t("library.book_detail.metadata_not_found_hint", "Não achou seu livro? Tente editar o título para um nome mais próximo do real e buscar novamente.")}
                </p>
                <button
                  type="button"
                  onClick={() => setMetadataCandidates(null)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {t("library.book_detail.metadata_select_cancel", "Cancelar")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRemoveConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setShowRemoveConfirm(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-confirm-title"
              className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 mx-4 overflow-hidden"
            >
              <div className="p-6">
                <h2 id="remove-confirm-title" className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  {t("library.book_detail.remove_confirm_title")}
                </h2>
                <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
                  {t("library.book_detail.remove_confirm_message")}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    {t("library.book_detail.remove_confirm_no")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRemove?.(book.id);
                      setShowRemoveConfirm(false);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  >
                    {t("library.book_detail.remove_confirm_yes")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedVolume && hasMultipleVolumes ? (
          <div className="space-y-3 max-w-xl">
            {book.volumes.map((volume) => (
              <button
                key={volume.id}
                type="button"
                onClick={() => handleVolumeClick(volume)}
                onContextMenu={(e) => handleVolumeContextMenu(e, volume)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-brand/30 dark:hover:border-brand/30 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800">
                    <BookOpen className="w-6 h-6 text-brand" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {volume.name}
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {t("library.book_detail.chapters_count", {
                        count: volume.chapters.length,
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" strokeWidth={2} />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {(() => {
              const volume = selectedVolume ?? book.volumes[0];
              const ext = volume.chapters[0]?.path.split(".").pop()?.toLowerCase() ?? "";
              const isImage = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext);
              const showReadVolume = volume.chapters.length > 1 && isImage;

              return (
                <>
                  {showReadVolume && (
                    <button
                      type="button"
                      onClick={() => handleReadVolume(volume)}
                      data-testid="btn-read-volume"
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-brand/10 dark:bg-brand/20 border border-brand/20 hover:bg-brand/15 dark:hover:bg-brand/25 transition-colors text-left"
                    >
                      <BookOpen className="w-6 h-6 text-brand shrink-0" strokeWidth={1.5} />
                      <p className="font-medium text-brand">
                        {t("library.book_detail.read_entire_volume")}
                      </p>
                    </button>
                  )}
                  <div className="space-y-2">
                    {currentChapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        type="button"
                        onClick={() => handleChapterClick(chapter, volume)}
                        onContextMenu={(e) => handleChapterContextMenu(e, chapter, volume)}
                        data-testid={`chapter-${chapter.id}`}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-brand/30 dark:hover:border-brand/30 transition-all duration-200 text-left"
                      >
                        <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 shrink-0">
                          <FileText className="w-5 h-5 text-stone-500 dark:text-stone-400" strokeWidth={1.5} />
                        </div>
                        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {chapter.name}
                        </p>
                        <ChevronRight className="w-5 h-5 text-stone-400 shrink-0 ml-auto" strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
};
