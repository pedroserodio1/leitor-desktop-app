import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { BaseAdapter } from "./BaseAdapter";

// Configure the PDF.js worker
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * PdfAdapter — Real PDF.js integration
 *
 * Renders PDF pages to <canvas> elements using PDF.js.
 * Supports zoom via viewport scaling.
 * Manages the PDF.js web worker lifecycle.
 */
export class PdfAdapter extends BaseAdapter {
  private zoom = 1;
  private pdfDocument: PDFDocumentProxy | null = null;

  // Altere o tipo para aceitar Uint8Array ou ArrayBuffer também
  async load(
    source: string | string[] | Uint8Array | ArrayBuffer,
  ): Promise<void> {
    // 1. Limpeza
    if (this.pdfDocument) {
      await this.pdfDocument.destroy();
      this.pdfDocument = null;
    }
    this.invalidateCache();

    let loadingTask;

    // 2. Identifica o que foi recebido
    if (source instanceof Uint8Array || source instanceof ArrayBuffer) {
      // Se for binário, o PDF.js exige o formato { data: ... }
      loadingTask = pdfjsLib.getDocument({ data: source });
    } else {
      // Se for string ou array de strings (URL)
      const src = typeof source === "string" ? source : source[0];
      loadingTask = pdfjsLib.getDocument(src);
    }

    // 3. Carregamento
    this.pdfDocument = await loadingTask.promise;
    this.totalPages = this.pdfDocument.numPages;
    this.currentPage = 1;
  }

  protected async renderPage(pageIndex: number): Promise<HTMLElement> {
    console.log(`[PdfAdapter] Starting render sequence for page: ${pageIndex}`);
    console.log(`[PdfAdapter] Current zoom level: ${this.zoom}`);

    if (!this.pdfDocument) {
      console.error(
        "[PdfAdapter] Fatal: Attempted to render while pdfDocument is null",
      );
      throw new Error("PDF document not loaded");
    }

    try {
      // Log de progresso: Buscando página
      console.log(`[PdfAdapter] Fetching page ${pageIndex}...`);
      const page = await this.pdfDocument.getPage(pageIndex);

      // Log de progresso: Calculando Viewport
      const viewport = page.getViewport({ scale: this.zoom * 2 });
      console.log(
        `[PdfAdapter] Viewport calculated: ${viewport.width}x${viewport.height}px`,
        viewport,
      );

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("[PdfAdapter] Failed to get 2D context from canvas");
        throw new Error("Canvas context failed");
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Display at logical size (CSS pixels) while rendering at 2x
      canvas.style.width = `${viewport.width/ 2}px`;
      canvas.style.height = `${viewport.height/ 2}px`;

      console.log(
        `[PdfAdapter] Canvas initialized. Executing page.render()...`,
      );

      // O "await" aqui é onde a mágica (ou o erro) acontece
      await page.render({
        canvasContext: ctx,
        canvas: canvas,
        viewport: viewport,
      }).promise;

      console.log(
        `[PdfAdapter] ✅ Render promise resolved for page ${pageIndex}`,
      );

      const wrapper = document.createElement("div");
      wrapper.className = "pdf-page-wrapper"; // Adicionado para facilitar inspeção no DOM
      wrapper.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: auto;
      `;

      wrapper.appendChild(canvas);

      console.log(
        `[PdfAdapter] Wrapper created and canvas appended for page ${pageIndex}`,
      );
      return wrapper;
    } catch (error) {
      console.error(
        `[PdfAdapter] ❌ Error rendering page ${pageIndex}:`,
        error,
      );
      throw error;
    }
  }

  async setZoom(zoom: number): Promise<void> {
    this.zoom = zoom / 100;
    this.invalidateCache();

    if (this.container) {
      await this.render(this.container, this.currentPage);
    }
  }

  // PdfAdapter.ts

  // Este é o método que o seu useReaderAdapter chama!
  async render(container: HTMLElement, pageIndex: number): Promise<void> {
    // 1. Chama a sua função "fábrica" que você postou
    const pageWrapper = await this.renderPage(pageIndex);

    // 2. AGORA VEM O PULO DO GATO:
    // Você precisa limpar o container do React e colocar o wrapper lá dentro.
    container.innerHTML = "";
    container.appendChild(pageWrapper);

    console.log(
      `[PdfAdapter] DOM updated: Wrapper added to container for page ${pageIndex}`,
    );
  }

  destroy(): void {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }

    this.invalidateCache();
    this.container = undefined;
    this.currentPage = 1;
    this.totalPages = 0;
  }
}
