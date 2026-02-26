import React from "react";
import { ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

/**
 * Header reutilizável para views fullscreen (Library, Detail, Settings, Edit).
 * Altura e estilo padronizados conforme tokens de design.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actions,
}) => {
  return (
    <header className="flex-shrink-0 flex items-center gap-4 px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          data-testid="btn-back"
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
};
