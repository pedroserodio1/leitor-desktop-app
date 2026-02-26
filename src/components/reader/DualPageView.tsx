import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PageRenderer } from "./PageRedered";
import { useReaderStore } from "../../store/readerStore";

const SLOT_ASPECT = 1.414; // altura/largura do slot (A4)

/**
 * Aspect ratio intrínseco (altura/largura) do conteúdo.
 * Preferir naturalWidth/naturalHeight (estável); fallback para dimensões renderizadas.
 */
function getContentAspectRatio(container: HTMLDivElement): number {
    const img = container.querySelector("img");
    if (img) {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) return img.naturalHeight / img.naturalWidth;
        const rect = img.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return rect.height / rect.width;
    }
    const canvas = container.querySelector("canvas");
    if (canvas) {
        if (canvas.width > 0 && canvas.height > 0) return canvas.height / canvas.width;
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return rect.height / rect.width;
    }
    return 0;
}

/** Diferença mínima (8%) no aspect ratio para considerar uma página "mais baixa" e exibir sozinha. */
const ASPECT_DIFF_THRESHOLD = 0.08;

export const DualPageView: React.FC = () => {
    const { currentPage, settings, totalPages, adapterType, prevPage, nextPage, setCurrentPage } = useReaderStore();
    const { t } = useTranslation();

    let page1 = currentPage;
    if (page1 % 2 === 0) page1--;
    const page2 = page1 + 1 <= totalPages ? page1 + 1 : null;

    const leftPage = settings.direction === "rtl" ? page2 : page1;
    const rightPage = settings.direction === "rtl" ? page1 : page2;

    const leftContainerRef = useRef<HTMLDivElement | null>(null);
    const rightContainerRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [leftAspect, setLeftAspect] = useState<number>(0);
    const [rightAspect, setRightAspect] = useState<number>(0);
    const [transitionDirection, setTransitionDirection] = useState<'prev' | 'next'>('next');
    const prevPagesRef = useRef({ left: leftPage, right: rightPage });
    const prevShowOnlyOneRef = useRef(false);

    const measureBoth = useCallback(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const l = leftContainerRef.current;
                const r = rightContainerRef.current;
                if (l && r) {
                    const la = getContentAspectRatio(l);
                    const ra = getContentAspectRatio(r);
                    setLeftAspect(la);
                    setRightAspect(ra);
                }
            });
        });
    }, []);

    const onLeftRendered = useCallback(
        (el: HTMLDivElement) => {
            leftContainerRef.current = el;
            if (rightContainerRef.current) measureBoth();
        },
        [measureBoth]
    );
    const onRightRendered = useCallback(
        (el: HTMLDivElement) => {
            rightContainerRef.current = el;
            if (leftContainerRef.current) measureBoth();
        },
        [measureBoth]
    );

    // Ao mudar livro/volume (totalPages muda): zerar aspects para voltar ao dual até nova medição.
    useEffect(() => {
        setLeftAspect(0);
        setRightAspect(0);
    }, [totalPages]);

    // Ao mudar de página: limpar refs para nova medição. Zerar aspects no primeiro spread (p.1–2)
    // para garantir dual ao abrir; nos demais mantém aspects e evita flash/animação dupla.
    useEffect(() => {
        leftContainerRef.current = null;
        rightContainerRef.current = null;
        const onFirstSpread = (leftPage ?? 0) <= 1 || (rightPage ?? 0) <= 1;
        if (onFirstSpread) {
            setLeftAspect(0);
            setRightAspect(0);
        }
    }, [leftPage, rightPage]);

    // Direção da navegação para animação (next = entra da direita, prev = entra da esquerda)
    useEffect(() => {
        const prev = prevPagesRef.current;
        const prevLeft = prev.left ?? 0;
        const prevRight = prev.right ?? 0;
        const currLeft = leftPage ?? 0;
        const currRight = rightPage ?? 0;
        if (currLeft !== prevLeft || currRight !== prevRight) {
            setTransitionDirection(currLeft > prevLeft || currRight > prevRight ? 'next' : 'prev');
            prevPagesRef.current = { left: leftPage ?? 0, right: currRight };
        }
    }, [leftPage, rightPage]);

    // Só exibir uma página quando uma for claramente mais baixa (≥8% menor em aspect ratio)
    const leftShorter =
        leftAspect > 0 && rightAspect > 0 && leftAspect <= rightAspect * (1 - ASPECT_DIFF_THRESHOLD);
    const rightShorter =
        rightAspect > 0 && leftAspect > 0 && rightAspect <= leftAspect * (1 - ASPECT_DIFF_THRESHOLD);
    const showOnlyOne = leftShorter || rightShorter;

    // Ao sair do single-shot (ir para dual), não animar naquela transição para evitar travada
    const wasShowOnlyOne = prevShowOnlyOneRef.current;
    prevShowOnlyOneRef.current = showOnlyOne;
    const skipAnimation = wasShowOnlyOne && !showOnlyOne;

    const handlePrev = useCallback(() => {
        if (showOnlyOne && rightShorter && rightPage != null && leftPage != null) {
            setCurrentPage(leftPage);
            return;
        }
        if (showOnlyOne && leftShorter) {
            setCurrentPage(Math.max(1, page1 - 2));
            return;
        }
        prevPage();
    }, [showOnlyOne, leftShorter, rightShorter, leftPage, rightPage, page1, setCurrentPage, prevPage]);

    const handleNext = useCallback(() => {
        if (showOnlyOne && leftShorter && rightPage != null) {
            setCurrentPage(rightPage);
            return;
        }
        if (showOnlyOne && rightShorter && rightPage != null) {
            setCurrentPage(rightPage + 1);
            return;
        }
        nextPage();
    }, [showOnlyOne, leftShorter, rightShorter, rightPage, nextPage, setCurrentPage]);

    // Evento disparado pelo overlay em ReaderLayout (clique na tela)
    useEffect(() => {
        const handler = (e: Event) => {
            const ev = e as CustomEvent<{ direction: 'prev' | 'next' }>;
            if (ev.detail?.direction === 'prev') handlePrev();
            else if (ev.detail?.direction === 'next') handleNext();
        };
        document.addEventListener('reader-navigate', handler);
        return () => document.removeEventListener('reader-navigate', handler);
    }, [handlePrev, handleNext]);

    // Clique/toque na tela: esquerda = voltar, direita = avançar (LTR); em RTL inverte
    const handleAreaPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = rect.width > 0 ? x / rect.width : 0;
            if (pct < 0.25) {
                e.preventDefault();
                e.stopPropagation();
                if (settings.direction === "rtl") handleNext();
                else handlePrev();
            } else if (pct > 0.75) {
                e.preventDefault();
                e.stopPropagation();
                if (settings.direction === "rtl") handlePrev();
                else handleNext();
            }
        },
        [settings.direction, handlePrev, handleNext]
    );

    const hideLeft = showOnlyOne && rightShorter;
    const hideRight = showOnlyOne && leftShorter;
    const singleShot = showOnlyOne && (leftShorter || rightShorter);

    const isEpub = adapterType === "epub";

    if (isEpub) {
        return (
            <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 relative">
                <div
                    className="absolute inset-0 z-20 cursor-pointer"
                    onPointerDown={handleAreaPointerDown}
                    onClick={(e) => e.preventDefault()}
                    role="presentation"
                    aria-hidden
                />
                <div
                    className="reader-page-view absolute inset-0 flex items-center justify-center transition-all duration-300 overflow-hidden"
                    dir="ltr"
                    style={{
                        transform: `scale(${settings.zoom / 100})`,
                        transformOrigin: "center center",
                    }}
                >
                    <div
                        key={page1}
                        className={`h-full w-full bg-white dark:bg-slate-900 relative overflow-hidden page-transition-${transitionDirection}`}
                    >
                        <PageRenderer pageNum={page1} />
                    </div>
                </div>
            </div>
        );
    }

    const slotClass = "dual-page-slot h-full flex-shrink-0";
    const slotStyle: React.CSSProperties = singleShot
        ? { width: '100%', height: '100%' }
        : { aspectRatio: 1 / SLOT_ASPECT, maxWidth: "100%" };
    // Só animar o slot visível; ao sair do single-shot (skipAnimation) não animar para evitar travada
    const animateLeft = !hideLeft && !skipAnimation;
    const animateRight = !hideRight && !skipAnimation;
    const leftSlotWrapClass =
        "h-full min-w-0 flex overflow-hidden bg-white dark:bg-slate-900 transition-[flex] duration-200 " +
        (hideLeft
            ? "invisible w-0 flex-none overflow-hidden items-center"
            : "flex-1 " + (hideRight ? "items-stretch justify-center" : "items-center justify-end"));
    const rightSlotWrapClass =
        "h-full min-w-0 flex overflow-hidden bg-white dark:bg-slate-900 transition-[flex] duration-200 " +
        (hideRight
            ? "invisible w-0 flex-none overflow-hidden items-center"
            : "flex-1 " + (hideLeft ? "items-stretch justify-center" : "items-center justify-start"));

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 relative"
            role="presentation"
        >
            <div
                className="reader-page-view absolute inset-0 flex items-center transition-all duration-300 overflow-hidden"
                dir="ltr"
                style={{
                    transform: `scale(${settings.zoom / 100})`,
                    transformOrigin: "center center",
                }}
            >
                <div className={leftSlotWrapClass}>
                    {leftPage ? (
                        <div
                            key={leftPage}
                            className={`${slotClass} ${animateLeft ? `page-transition-${transitionDirection}` : ''}`}
                            style={slotStyle}
                        >
                            <PageRenderer pageNum={leftPage} onRendered={onLeftRendered} />
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 italic">
                            {t("views.blank")}
                        </div>
                    )}
                </div>
                <div className={rightSlotWrapClass}>
                    {rightPage ? (
                        <div
                            key={rightPage}
                            className={`${slotClass} ${animateRight ? `page-transition-${transitionDirection}` : ''}`}
                            style={slotStyle}
                        >
                            <PageRenderer pageNum={rightPage} onRendered={onRightRendered} />
                        </div>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 italic">
                            {t("views.blank")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};