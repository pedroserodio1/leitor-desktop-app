import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useReaderStore } from '../../../store/readerStore';

export const ErrorState: React.FC = () => {
  const { setStatus } = useReaderStore();
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-8">
      <div className="w-20 h-20 mb-5 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center border border-red-200/50 dark:border-red-800/50">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
        {t('states.error.title')}
      </h2>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 max-w-sm text-center leading-relaxed">
        {t('states.error.message')}
      </p>

      <button
        onClick={() => setStatus('empty')}
        className="px-6 py-3 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-brand dark:hover:bg-brand hover:text-white dark:hover:text-white transition-colors font-medium text-sm shadow-lg"
      >
        {t('states.error.back')}
      </button>
    </div>
  );
};
