import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useContextMenu } from "../../context/ContextMenuContext";
import type {
  ContextMenuEntry,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSubmenu,
} from "../../utils/contextMenu";

function isSubmenu(entry: ContextMenuEntry): entry is ContextMenuSubmenu {
  return "items" in entry && Array.isArray((entry as ContextMenuSubmenu).items);
}

function isSeparator(entry: ContextMenuEntry): entry is ContextMenuSeparator {
  return "type" in entry && (entry as ContextMenuSeparator).type === "separator";
}

interface ContextMenuProps {
  /** Optional: custom portal container. Defaults to document.body */
  container?: HTMLElement;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ container }) => {
  const { state, closeMenu } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);
  const target = container ?? (typeof document !== "undefined" ? document.body : null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    if (state.visible) {
      document.addEventListener("click", handleClick, { capture: true });
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.visible, closeMenu]);

  if (!state.visible || state.items.length === 0 || !target) return null;

  const menuEl = (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[9999] py-1.5 min-w-[180px] rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xl"
      style={{
        left: state.x,
        top: state.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {state.items.map((entry) => {
        if (isSeparator(entry)) {
          return (
            <hr
              key={entry.id}
              className="my-1 border-t border-[var(--color-border)]"
            />
          );
        }
        if (isSubmenu(entry)) {
          return (
            <SubmenuItem
              key={entry.id}
              text={entry.text}
              items={entry.items}
              closeMenu={closeMenu}
            />
          );
        }
        return (
          <MenuItem
            key={entry.id}
            text={entry.text}
            action={entry.action}
            enabled={entry.enabled ?? true}
            variant={entry.id === "remove" ? "danger" : "default"}
            closeMenu={closeMenu}
          />
        );
      })}
    </div>
  );

  return createPortal(menuEl, target);
};

interface MenuItemProps {
  text: string;
  action: () => void;
  enabled: boolean;
  variant?: "default" | "danger";
  closeMenu: () => void;
}

function MenuItem({ text, action, enabled, variant = "default", closeMenu }: MenuItemProps) {
  const handleClick = () => {
    if (!enabled) return;
    closeMenu();
    action();
  };

  const variantClass =
    variant === "danger"
      ? "text-amber-600 dark:text-amber-400"
      : "text-[var(--color-text)]";

  return (
    <button
      type="button"
      role="menuitem"
      disabled={!enabled}
      onClick={handleClick}
      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${variantClass} ${
        enabled
          ? "hover:bg-[var(--color-surface-hover)] cursor-pointer"
          : "opacity-50 cursor-not-allowed"
      }`}
    >
      {text}
    </button>
  );
}

interface SubmenuItemProps {
  text: string;
  items: ContextMenuItem[];
  closeMenu: () => void;
}

function SubmenuItem({ text, items, closeMenu }: SubmenuItemProps) {
  const [showSubmenu, setShowSubmenu] = React.useState(false);
  const submenuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => setShowSubmenu(true)}
      onMouseLeave={() => setShowSubmenu(false)}
    >
      <div
        role="menuitem"
        className="w-full px-4 py-2.5 text-left text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] cursor-pointer flex items-center justify-between"
      >
        {text}
        <span className="text-stone-400 dark:text-stone-500 ml-2">▸</span>
      </div>
      {showSubmenu && (
        <div
          ref={submenuRef}
          role="menu"
          className="absolute left-full top-0 ml-0.5 py-1.5 min-w-[160px] rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xl z-[10000]"
        >
          {items.map((item) => (
            <MenuItem
              key={item.id}
              text={item.text}
              action={item.action}
              enabled={item.enabled ?? true}
              variant={item.id === "remove" ? "danger" : "default"}
              closeMenu={closeMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
