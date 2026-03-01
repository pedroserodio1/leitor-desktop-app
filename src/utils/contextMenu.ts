export interface ContextMenuItem {
  id: string;
  text: string;
  action: () => void;
  enabled?: boolean;
}

export interface ContextMenuSubmenu {
  id: string;
  text: string;
  items: ContextMenuItem[];
}

export interface ContextMenuSeparator {
  id: string;
  type: "separator";
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSubmenu | ContextMenuSeparator;

let openMenuRef: ((items: ContextMenuEntry[], x: number, y: number) => void) | null = null;

export function setContextMenuOpenRef(
  fn: ((items: ContextMenuEntry[], x: number, y: number) => void) | null
): void {
  openMenuRef = fn;
}

export function showContextMenu(
  items: ContextMenuEntry[],
  x: number,
  y: number
): Promise<void> {
  if (openMenuRef) {
    openMenuRef(items, x, y);
  }
  return Promise.resolve();
}
