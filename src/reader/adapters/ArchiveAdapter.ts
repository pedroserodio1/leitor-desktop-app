import { invoke } from '@tauri-apps/api/core';
import { ImageAdapter } from './ImageAdapter';

interface ArchiveExtracted {
  temp_dir: string;
  paths: string[];
}

/**
 * ArchiveAdapter — CBZ (ZIP) and RAR support.
 *
 * Extracts the archive to a temp directory via Tauri, then uses ImageAdapter
 * to display pages. On destroy(), the temp directory is removed.
 */
export class ArchiveAdapter extends ImageAdapter {
  private tempDir: string | null = null;

  async load(source: string | string[]): Promise<void> {
    const archivePath = typeof source === 'string' ? source : source[0];
    if (!archivePath) throw new Error('Archive path required');

    const result = await invoke<ArchiveExtracted>('extract_archive', {
      archivePath,
    });
    this.tempDir = result.temp_dir;
    await super.load(result.paths);
  }

  override destroy(): void {
    if (this.tempDir) {
      invoke('delete_temp_dir', { tempDir: this.tempDir }).catch((err) =>
        console.warn('[ArchiveAdapter] Failed to delete temp dir:', err)
      );
      this.tempDir = null;
    }
    super.destroy();
  }
}
