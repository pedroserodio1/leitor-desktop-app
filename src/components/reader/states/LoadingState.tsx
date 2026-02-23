import React from 'react';
import { useTranslation } from 'react-i18next';

export const LoadingState: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full" />
                <div className="absolute inset-0 border-4 border-brand rounded-full animate-spin border-t-transparent" />
            </div>
            <p className="mt-6 text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse">
                {t('states.loading.message')}
            </p>
        </div>
    );
};
