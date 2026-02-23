import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

export const EmptyState: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
                <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
                {t('states.empty.title')}
            </h2>
            <p className="text-sm max-w-sm text-center text-slate-500 dark:text-slate-400">
                {t('states.empty.message')}
            </p>
        </div>
    );
};
