// src/reader/ReaderAdapterContext.ts
import { createContext, useContext } from 'react';
import { useReaderAdapter } from './useReaderAdapter.ts'; // Importe seu hook de lógica aqui

export type ReaderAdapterContextType = ReturnType<typeof useReaderAdapter>;

export const ReaderAdapterContext = createContext<ReaderAdapterContextType | undefined>(undefined);

export const useReaderAdapterContext = () => {
    const context = useContext(ReaderAdapterContext);
    if (context === undefined) {
        throw new Error('useReaderAdapterContext must be used within a ReaderAdapterProvider');
    }
    return context;
};