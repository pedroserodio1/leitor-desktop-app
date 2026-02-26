import type { ReaderAdapter } from './ReaderAdapter';
import { PdfAdapter } from './PdfAdapter';
import { EpubAdapter } from './EpubAdapter';
import { ImageAdapter } from './ImageAdapter';
import { ArchiveAdapter } from './ArchiveAdapter';

export type AdapterType = 'pdf' | 'epub' | 'image' | 'cbz' | 'rar';

/**
 * Factory function to create the appropriate adapter for a document type.
 *
 * Usage:
 *   const adapter = createAdapter('pdf');
 *   await adapter.load('/path/to/document.pdf');
 *   await adapter.render(containerEl, 1);
 *
 * The returned adapter is fully independent of React/Zustand.
 * The UI layer (React hooks or components) should call adapter methods
 * in response to store changes.
 */
export function createAdapter(type: AdapterType): ReaderAdapter {
  switch (type) {
    case 'pdf':
      return new PdfAdapter();
    case 'epub':
      return new EpubAdapter();
    case 'image':
      return new ImageAdapter();
    case 'cbz':
    case 'rar':
      return new ArchiveAdapter();
    default:
      throw new Error(`Unknown adapter type: ${type}`);
  }
}
