import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import type { ProfilePreset } from '../../types/reader';

export const ProfilePresetSelector: React.FC = () => {
  const { applyPreset } = useReaderStore();
  const { t } = useTranslation();
  const [active, setActive] = useState<ProfilePreset | null>(null);

  const handleApply = (preset: ProfilePreset) => {
    setActive(preset);
    applyPreset(preset);
    setTimeout(() => setActive(null), 1000);
  };

  const presetsList: { id: ProfilePreset; labelKey: string }[] = [
    { id: 'book', labelKey: 'presets.book' },
    { id: 'manga', labelKey: 'presets.manga' },
    { id: 'comic', labelKey: 'presets.comic' },
    { id: 'pdf', labelKey: 'presets.pdf' },
  ];

  return (
    <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
      {presetsList.map((p) => (
        <button
          key={p.id}
          onClick={() => handleApply(p.id)}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${active === p.id ? 'bg-brand text-white shadow-sm' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700'}`}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  );
};
