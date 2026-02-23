// src/contexts/ReaderAdapterProvider.tsx (ou onde ele estiver)
import React from 'react';
import { ReaderAdapterContext } from '../reader/ReaderAdapterContext'; // <--- IMPORTAÇÃO CHAVE
import { useReaderAdapter } from '../reader/useReaderAdapter';

export const ReaderAdapterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const adapterApi = useReaderAdapter();

    return (
        <ReaderAdapterContext.Provider value={adapterApi}>
            {children}
        </ReaderAdapterContext.Provider>
    );
};