import React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
  /** Conteúdo do header (AppHeader ou custom) */
  header?: React.ReactNode;
  /** Se true, aplica max-w-2xl e padding ao main */
  constrained?: boolean;
}

/**
 * Layout padrão para views fullscreen: header fixo + main scrollável.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  constrained = false,
}) => {
  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950">
      {header}
      <main
        className={`flex-1 overflow-y-auto p-8 ${
          constrained ? "max-w-2xl" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
};
