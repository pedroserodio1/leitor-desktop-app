import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App";
import React from "react";
import { ReaderAdapterProvider } from "./reader/ReaderAdapterProvider";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { ContextMenuProvider } from "./context/ContextMenuContext";
import { ContextMenu } from "./components/ui/ContextMenu";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ContextMenuProvider>
        <ReaderAdapterProvider>
          <App />
        </ReaderAdapterProvider>
        <ContextMenu />
      </ContextMenuProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
