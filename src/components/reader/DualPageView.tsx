import { useTranslation } from "react-i18next";
import { PageRenderer } from "./PageRedered";
import { useReaderStore } from "../../store/readerStore";

export const DualPageView: React.FC = () => {
    const { currentPage, settings, totalPages, adapterType, prevPage, nextPage } = useReaderStore();
    const { t } = useTranslation();

    let page1 = currentPage;
    if (page1 % 2 === 0) page1--;
    const page2 = page1 + 1 <= totalPages ? page1 + 1 : null;

    const leftPage = settings.direction === 'rtl' ? page2 : page1;
    const rightPage = settings.direction === 'rtl' ? page1 : page2;

    // EPUB só suporta UMA rendition; usa spread para mostrar duas páginas em um container
    const isEpub = adapterType === 'epub';
    const sideZone = (
        <>
            <div
                className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer z-10"
                onClick={settings.direction === 'rtl' ? nextPage : prevPage}
                title={settings.direction === 'rtl' ? t('controls.next') : t('controls.prev')}
            />
            <div
                className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer z-10"
                onClick={settings.direction === 'rtl' ? prevPage : nextPage}
                title={settings.direction === 'rtl' ? t('controls.prev') : t('controls.next')}
            />
        </>
    );
    if (isEpub) {
        return (
            <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 relative">
                {sideZone}
                <div
                    className="reader-page-view absolute inset-0 flex items-center justify-center transition-all duration-300 overflow-hidden"
                    dir="ltr"
                    style={{
                        transform: `scale(${settings.zoom / 100})`,
                        transformOrigin: 'center center',
                    }}
                >
                    <div className="h-full w-full bg-white dark:bg-slate-900 relative overflow-hidden">
                        <PageRenderer pageNum={page1} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 relative">
            {sideZone}
            <div
                className="reader-page-view absolute inset-0 flex items-center transition-all duration-300 overflow-hidden"
                dir="ltr"
                style={{
                    transform: `scale(${settings.zoom / 100})`,
                    transformOrigin: 'center center',
                }}
            >
                {/* Left Page (LTR) / Second page (RTL) — encostada no centro */}
                <div className="h-full flex-1 min-w-0 flex items-center overflow-hidden bg-white dark:bg-slate-900 justify-end">
                    {leftPage ? (
                        <div className="dual-page-slot h-full flex-shrink-0" style={{ aspectRatio: '1/1.414', maxWidth: '100%' }}>
                            <PageRenderer pageNum={leftPage} />
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 italic">
                            {t('views.blank')}
                        </div>
                    )}
                </div>

                {/* Right Page (LTR) / First page (RTL) — encostada no centro */}
                <div className="h-full flex-1 min-w-0 flex items-center overflow-hidden bg-white dark:bg-slate-900 justify-start">
                    {rightPage ? (
                        <div className="dual-page-slot h-full flex-shrink-0" style={{ aspectRatio: '1/1.414', maxWidth: '100%' }}>
                            <PageRenderer pageNum={rightPage} />
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 italic">
                            {t('views.blank')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};