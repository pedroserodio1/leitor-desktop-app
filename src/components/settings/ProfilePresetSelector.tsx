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
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {presetsList.map((p) => (
                <button
                    key={p.id}
                    onClick={() => handleApply(p.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${active === p.id
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                >
                    {t(p.labelKey)}
                </button>
            ))}
        </div>
    );
};
