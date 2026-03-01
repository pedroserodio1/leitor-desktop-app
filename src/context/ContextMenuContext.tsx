import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setContextMenuOpenRef } from "../utils/contextMenu";
import type { ContextMenuEntry } from "../utils/contextMenu";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuEntry[];
}

interface ContextMenuContextValue {
  state: ContextMenuState;
  openMenu: (items: ContextMenuEntry[], x: number, y: number) => void;
  closeMenu: () => void;
}

const initialState: ContextMenuState = {
  visible: false,
  x: 0,
  y: 0,
  items: [],
};

const ContextMenuContext = createContext<ContextMenuContextValue | undefined>(undefined);

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ContextMenuState>(initialState);

  const openMenu = useCallback((items: ContextMenuEntry[], x: number, y: number) => {
    setState({ visible: true, x, y, items });
  }, []);

  const closeMenu = useCallback(() => {
    setState(initialState);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler, { capture: true });
    return () => document.removeEventListener("contextmenu", handler, { capture: true });
  }, []);

  useEffect(() => {
    const attachContextMenuBlocker = (iframe: HTMLIFrameElement) => {
      const attach = () => {
        try {
          const doc = iframe.contentDocument;
          if (doc) {
            const handler = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              const ev = e as MouseEvent;
              window.dispatchEvent(
                new CustomEvent("contextmenu-from-iframe", {
                  detail: { clientX: ev.clientX, clientY: ev.clientY },
                })
              );
            };
            doc.addEventListener("contextmenu", handler, { capture: true });
          }
        } catch {
          // Cross-origin iframe - cannot access contentDocument
        }
      };
      if (iframe.contentDocument) {
        attach();
      } else {
        iframe.addEventListener("load", attach, { once: true });
        setTimeout(attach, 0);
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            attachContextMenuBlocker(node);
          }
          if (node instanceof Node && node.nodeType === Node.ELEMENT_NODE) {
            (node as Element).querySelectorAll?.("iframe").forEach(attachContextMenuBlocker);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll("iframe").forEach(attachContextMenuBlocker);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setContextMenuOpenRef(openMenu);
    return () => setContextMenuOpenRef(null);
  }, [openMenu]);

  const value: ContextMenuContextValue = {
    state,
    openMenu,
    closeMenu,
  };

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  }
  return ctx;
}
