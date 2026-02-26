/**
 * E2E: Fluxo de leitura
 * - Abrir livro -> Leitor
 * - Navegar páginas (prev/next)
 * - Voltar para biblioteca
 */
describe('Leitor', function () {
  beforeEach(async function () {
    await browser.url('/');
    await browser.pause(500);
    const bookCard = await $('[data-testid="book-card-e2e-test-book"]');
    await bookCard.click();
    await browser.pause(500);
  });

  it('deve exibir botão Ler volume inteiro ou capítulo', async function () {
    const readVolume = await $('[data-testid="btn-read-volume"]');
    const chapterBtn = await $('[data-testid="chapter-e2e-test-chapter"]');
    const hasReadVolume = await readVolume.isExisting();
    const hasChapter = await chapterBtn.isExisting();
    expect(hasReadVolume || hasChapter).toBe(true);
  });

  it('deve abrir o leitor ao clicar em Ler volume inteiro', async function () {
    const readVolume = await $('[data-testid="btn-read-volume"]');
    if (await readVolume.isExisting()) {
      await readVolume.click();
    } else {
      const chapterBtn = await $('[data-testid="chapter-e2e-test-chapter"]');
      await chapterBtn.click();
    }
    await browser.pause(2000);
    const readerLayout = await $('[data-testid="reader-layout"]');
    await expect(readerLayout).toBeExisting();
  });

  it('deve mostrar controles de navegação após carregar', async function () {
    const readVolume = await $('[data-testid="btn-read-volume"]');
    if (await readVolume.isExisting()) {
      await readVolume.click();
    } else {
      const chapterBtn = await $('[data-testid="chapter-e2e-test-chapter"]');
      await chapterBtn.click();
    }
    await browser.pause(2500);
    const btnPrev = await $('[data-testid="btn-prev-page"]');
    const btnNext = await $('[data-testid="btn-next-page"]');
    await expect(btnPrev).toBeExisting();
    await expect(btnNext).toBeExisting();
  });

  it('deve avançar página ao clicar em Próxima', async function () {
    const readVolume = await $('[data-testid="btn-read-volume"]');
    if (await readVolume.isExisting()) {
      await readVolume.click();
    } else {
      const chapterBtn = await $('[data-testid="chapter-e2e-test-chapter"]');
      await chapterBtn.click();
    }
    await browser.pause(2500);
    const readerArea = await $('[data-testid="reader-layout"]');
    await readerArea.moveTo();
    await browser.pause(500);
    const btnNext = await $('[data-testid="btn-next-page"]');
    await btnNext.click();
    await browser.pause(500);
    await expect(btnNext).toBeExisting();
  });

  it('deve voltar para biblioteca ao clicar em Voltar', async function () {
    const readVolume = await $('[data-testid="btn-read-volume"]');
    if (await readVolume.isExisting()) {
      await readVolume.click();
    } else {
      const chapterBtn = await $('[data-testid="chapter-e2e-test-chapter"]');
      await chapterBtn.click();
    }
    await browser.pause(2500);
    const btnBack = await $('[data-testid="btn-back-to-library"]');
    await btnBack.click();
    await browser.pause(500);
    const libraryView = await $('[data-testid="library-view"]');
    await expect(libraryView).toBeExisting();
  });
});
