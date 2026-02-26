import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

export const EmptyState: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950">
      <div className="w-28 h-28 mb-6 rounded-3xl bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center border border-stone-200 dark:border-stone-700 shadow-inner">
        <BookOpen className="w-12 h-12 text-stone-400 dark:text-stone-500" strokeWidth={1.25} />
      </div>
      <h2 className="font-heading text-2xl font-medium text-stone-900 dark:text-stone-100 mb-2 tracking-tight">
        {t('states.empty.title')}
      </h2>
      <p className="text-sm max-w-sm text-center text-stone-500 dark:text-stone-400 leading-relaxed">
        {t('states.empty.message')}
      </p>
    </div>
  );
};
