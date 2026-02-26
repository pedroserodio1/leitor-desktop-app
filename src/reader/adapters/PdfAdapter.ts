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
    if (!this.pdfDocument) throw new Error("PDF document not loaded");

    try {
      const page = await this.pdfDocument.getPage(pageIndex);
      const viewport = page.getViewport({ scale: this.zoom * 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context failed");

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / 2}px`;
      canvas.style.height = `${viewport.height / 2}px`;

      await page.render({
        canvasContext: ctx,
        canvas: canvas,
        viewport: viewport,
      }).promise;

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
      return wrapper;
    } catch (error) {
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
