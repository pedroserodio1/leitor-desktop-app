import { useRef, useCallback, useEffect } from "react";
import { useReaderStore } from "../store/readerStore";
import { createAdapter, type AdapterType } from "./adapters/AdapterFactory";
import type { ReaderAdapter } from "./adapters/ReaderAdapter";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

/**
 * useReaderAdapter — Bridge between the Zustand store and the adapter layer.
 *
 * This hook:
 * 1. Holds a ref to the current ReaderAdapter (no re-renders on adapter change)
 * 2. Reacts to store setting changes (zoom, fontSize, preRenderEnabled)
 * 3. Exposes openFile() to show a native file dialog and load the selected file
 * 4. Cleans up the adapter on unmount
 */
export function useReaderAdapter() {
  const adapterRef = useRef<ReaderAdapter | null>(null);
  const adapterTypeRef = useRef<AdapterType | null>(null);

  const { settings, setStatus, setTitle, setTotalPages, setSetting, setAdapterType, setCurrentPage } =
    useReaderStore();

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, []);

  // --- React to zoom changes ---
  useEffect(() => {
    const adapter = adapterRef.current;
    if (adapter?.setZoom && adapterTypeRef.current === "pdf") {
      adapter.setZoom(settings.zoom);
    }
  }, [settings.zoom]);

  // --- React to fontSize changes (EPUB) ---
  useEffect(() => {
    const adapter = adapterRef.current;
    if (adapter?.setFontSize && adapterTypeRef.current === "epub") {
      adapter.setFontSize(settings.fontSize).then(() => {
        // Update store with new total pages after reflow
        setTotalPages(adapter.getTotalPages());
      });
    }
  }, [settings.fontSize, setTotalPages]);

  // --- React to direction changes (EPUB) ---
  useEffect(() => {
    const adapter = adapterRef.current;
    if (adapter?.setDirection && adapterTypeRef.current === "epub") {
      adapter.setDirection(settings.direction);
    }
  }, [settings.direction]);

  // --- React to preRenderEnabled changes ---
  useEffect(() => {
    adapterRef.current?.setPreRender(settings.preRenderEnabled);
  }, [settings.preRenderEnabled]);

  // --- Detect adapter type from file extension ---
  const detectType = useCallback((filePath: string): AdapterType => {
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "pdf";
    if (ext === "epub") return "epub";
    if (ext === "cbz" || ext === "zip") return "cbz";
    if (ext === "rar") return "rar";
    if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext))
      return "image";
    return "pdf";
  }, []);

  // --- Open a file via Tauri native dialog ---
  const openFile = useCallback(async () => {
    try {
      const result = await open({
        multiple: false,
        filters: [
          {
            name: "Documents",
            extensions: ["pdf", "epub"],
          },
          {
            name: "Archives",
            extensions: ["cbz", "zip", "rar"],
          },
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp"],
          },
        ],
      });

      if (!result) return; // User cancelled

      const filePath = typeof result === "string" ? result : result;
      if (!filePath) return;

      setStatus("loading");

      // Destroy previous adapter
      adapterRef.current?.destroy();

      // Create new adapter based on file type
      const type = detectType(filePath as string);
      adapterTypeRef.current = type;
      setAdapterType(type);
      const adapter = createAdapter(type);
      adapterRef.current = adapter;

      if (type === "pdf" || type === "epub") {
        const fileData = await readFile(filePath as string);
        const arrayBuffer = fileData.buffer as ArrayBuffer;
        if (type === "pdf") {
          await adapter.load(fileData);
        } else {
          await adapter.load(arrayBuffer);
        }
      } else {
        // Image, CBZ, RAR: pass path(s). ArchiveAdapter extracts via Tauri.
        await adapter.load(filePath as string);
      }

      // Extract filename for title
      const fileName = (filePath as string).split(/[\\/]/).pop() ?? "Unknown";

      // Update store
      setTitle(fileName);
      setTotalPages(adapter.getTotalPages());
      setSetting("zoom", 100); // Reset zoom on new file
      setStatus("ready");
    } catch (error) {
      console.error("[useReaderAdapter] Failed to open file:", error);
      setStatus("error");
    }
  }, [detectType, setStatus, setTitle, setTotalPages, setSetting, setAdapterType]);

  // --- Open multiple images as a comic/manga ---
  const openImages = useCallback(async () => {
    try {
      const result = await open({
        multiple: true,
        filters: [
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"],
          },
        ],
      });

      if (!result || (Array.isArray(result) && result.length === 0)) return;

      setStatus("loading");
      adapterRef.current?.destroy();

      const paths = Array.isArray(result) ? result : [result];

      adapterTypeRef.current = "image";
      setAdapterType("image");
      const adapter = createAdapter("image");
      adapterRef.current = adapter;

      await adapter.load(paths as string[]);

      setTitle(`Images (${paths.length} pages)`);
      setTotalPages(adapter.getTotalPages());
      setSetting("zoom", 100);
      setStatus("ready");
    } catch (error) {
      console.error("[useReaderAdapter] Failed to open images:", error);
      setStatus("error");
    }
  }, [setStatus, setTitle, setTotalPages, setSetting, setAdapterType]);

  // --- Load content from library (paths + title). initialPage restaura progresso salvo. ---
  const loadPaths = useCallback(
    async (paths: string[], title: string, initialPage?: number) => {
      if (paths.length === 0) {
        setStatus("error");
        return;
      }

      const path = paths[0];
      const ext = path.split(".").pop()?.toLowerCase() ?? "";

      try {
        setStatus("loading");
        adapterRef.current?.destroy();

        if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext)) {
          adapterTypeRef.current = "image";
          setAdapterType("image");
          const adapter = createAdapter("image");
          adapterRef.current = adapter;
          await adapter.load(paths);
          setTitle(title);
          setTotalPages(adapter.getTotalPages());
          const total = adapter.getTotalPages();
          const page = initialPage != null && initialPage >= 1 && initialPage <= total ? initialPage : 1;
          setCurrentPage(page);
          if (page > 1) adapter.goTo(page);
          setSetting("zoom", 100);
          setStatus("ready");
        } else if (ext === "cbz" || ext === "zip" || ext === "rar") {
          const type: AdapterType = ext === "rar" ? "rar" : "cbz";
          adapterTypeRef.current = type;
          setAdapterType(type);
          const adapter = createAdapter(type);
          adapterRef.current = adapter;
          await adapter.load(path);
          setTitle(title);
          setTotalPages(adapter.getTotalPages());
          const total = adapter.getTotalPages();
          const page = initialPage != null && initialPage >= 1 && initialPage <= total ? initialPage : 1;
          setCurrentPage(page);
          if (page > 1) adapter.goTo(page);
          setSetting("zoom", 100);
          setStatus("ready");
        } else if (ext === "pdf" || ext === "epub") {
          const fileData = await readFile(path);
          const arrayBuffer = fileData.buffer as ArrayBuffer;
          const type: AdapterType = ext === "pdf" ? "pdf" : "epub";
          adapterTypeRef.current = type;
          setAdapterType(type);
          const adapter = createAdapter(type);
          adapterRef.current = adapter;
          if (type === "pdf") {
            await adapter.load(fileData);
          } else {
            await adapter.load(arrayBuffer);
          }
          setTitle(title);
          setTotalPages(adapter.getTotalPages());
          const total = adapter.getTotalPages();
          const page = initialPage != null && initialPage >= 1 && initialPage <= total ? initialPage : 1;
          setCurrentPage(page);
          if (page > 1) adapter.goTo(page);
          setSetting("zoom", 100);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("[useReaderAdapter] Failed to load:", error);
        setStatus("error");
      }
    },
    [
      setStatus,
      setTitle,
      setTotalPages,
      setSetting,
      setAdapterType,
      setCurrentPage,
    ]
  );

  // --- Render a page into a container element ---
  // useReaderAdapter.ts
  const renderToContainer = useCallback(
    async (container: HTMLElement, pageIndex: number) => {
      const adapter = adapterRef.current;
      if (!adapter) return;

      try {
        await adapter.render(container, pageIndex);

        // Se após o await o container ainda estiver vazio,
        // o erro é no método render do seu PdfAdapter
        // EPUB usa iframe; PDF/Image preenchem direto. Só checamos para não-EPUB.
        if (
          adapterTypeRef.current !== "epub" &&
          container.childNodes.length === 0
        ) {
          console.error(
            "[useReaderAdapter] Container is still empty after adapter.render!",
          );
        }
      } catch (error) {
        console.error("Render error:", error);
      }
    },
    [],
  );

  // --- Navigation ---
  const nextPage = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    await adapter.next();
    // Update store with adapter's position
    const store = useReaderStore.getState();
    const newPage = adapter.getCurrentPage();
    if (newPage !== store.currentPage) {
      store.nextPage();
    }
  }, []);

  const prevPage = useCallback(async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    await adapter.prev();
    const store = useReaderStore.getState();
    const newPage = adapter.getCurrentPage();
    if (newPage !== store.currentPage) {
      store.prevPage();
    }
  }, []);

  const getCachedAspectRatio = useCallback((pageIndex: number): number | undefined => {
    return adapterRef.current?.getPageAspectRatio?.(pageIndex);
  }, []);

  return {
    adapter: adapterRef,
    openFile,
    openImages,
    loadPaths,
    renderToContainer,
    getCachedAspectRatio,
    nextPage,
    prevPage,
  };
}
