import { useTranslation } from "react-i18next";
import { useReaderStore } from "../../store/readerStore";
import { PageItem } from "./PageItem";

export const ScrollView: React.FC = () => {
    const { totalPages, settings } = useReaderStore();
    const { t } = useTranslation();

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const containerWidth = '80vw';
    const pageHeight = '80vh';
    return (
        <div className="w-full h-full py-[10%] px-[10%] overflow-y-auto overflow-x-hidden flex flex-col items-center gap-8 bg-white dark:bg-slate-900 box-border" dir={settings.direction}>
            {pages.map((pageNum) => (
                <div
                    key={pageNum}
                    className="reader-page-view relative bg-white dark:bg-slate-900 shrink-0 transition-all duration-300 overflow-hidden flex items-center justify-center transition-all duration-300 overflow-hidden flex items-center justify-center"
                    style={{
                        width: containerWidth,
                        height: pageHeight,
                        transform: `scale(${settings.zoom / 100})`,
                        transformOrigin: 'top center',
                        marginBottom: `calc(80vh * ${settings.zoom / 100} - 80vh + 32px)`,
                    }}
                >
                    {/* Renderiza a página real aqui */}
                    <PageItem pageNum={pageNum} zoom={settings.zoom} />

                    {/* Label flutuante com o número da página (opcional) */}
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity">
                        {t('views.page')} {pageNum}
                    </div>
                </div>
            ))}
        </div>
    );
};