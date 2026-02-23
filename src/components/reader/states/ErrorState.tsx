import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useReaderStore } from '../../../store/readerStore';

export const ErrorState: React.FC = () => {
    const { setStatus } = useReaderStore();
    const { t } = useTranslation();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('states.error.title')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center">
                {t('states.error.message')}
            </p>

            <button
                onClick={() => setStatus('empty')}
                className="px-6 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-brand dark:hover:bg-brand dark:hover:text-white hover:text-white transition-colors rounded-lg font-medium text-sm shadow-md"
            >
                {t('states.error.back')}
            </button>
        </div>
    );
};
