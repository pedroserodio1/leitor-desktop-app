import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw, Copy } from "lucide-react";

interface CrashScreenProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export const CrashScreen: React.FC<CrashScreenProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const { t } = useTranslation();

  const handleCopy = useCallback(() => {
    const text = `Readito Crash Report\n\n${error.name}: ${error.message}\n\n${error.stack ?? ""}`;
    void navigator.clipboard.writeText(text);
  }, [error]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] p-8">
      <div className="w-24 h-24 mb-6 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center border border-red-300/50 dark:border-red-600/50">
        <AlertTriangle
          className="w-12 h-12 text-red-600 dark:text-red-400"
          strokeWidth={1.5}
        />
      </div>
      <h1 className="font-heading text-2xl font-semibold text-[var(--color-text)] mb-3 text-center">
        {t("crash.title", "Something went wrong")}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-md text-center leading-relaxed">
        {t(
          "crash.message",
          "An unexpected error occurred. You can try reloading the app or copy the error details to report it."
        )}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium text-sm shadow-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2} />
            {t("crash.reload", "Reload app")}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] font-medium text-sm border border-[var(--color-border)] transition-colors"
        >
          <Copy className="w-4 h-4" strokeWidth={2} />
          {t("crash.copy", "Copy details")}
        </button>
      </div>
    </div>
  );
};
