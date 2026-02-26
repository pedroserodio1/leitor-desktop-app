/**
 * E2E: Navegação entre telas
 * - Biblioteca -> Configurações -> Voltar
 * - Biblioteca -> Detalhe do livro -> Voltar
 */
describe('Navegação', function () {
  beforeEach(async function () {
    await browser.url('/');
    await browser.pause(500);
  });

  it('deve ir para Configurações e voltar', async function () {
    const btnSettings = await $('[data-testid="btn-settings"]');
    await btnSettings.click();
    await browser.pause(400);
    const settingsView = await $('[data-testid="settings-view"]');
    await expect(settingsView).toBeExisting();
    const btnBack = await $('[data-testid="btn-back"]');
    await btnBack.click();
    await browser.pause(400);
    const libraryView = await $('[data-testid="library-view"]');
    await expect(libraryView).toBeExisting();
  });

  it('deve ir para detalhe do livro ao clicar no card', async function () {
    const bookCard = await $('[data-testid="book-card-e2e-test-book"]');
    await bookCard.click();
    await browser.pause(400);
    const detailView = await $('[data-testid="book-detail-view"]');
    await expect(detailView).toBeExisting();
  });

  it('deve voltar da tela de detalhe para a biblioteca', async function () {
    const bookCard = await $('[data-testid="book-card-e2e-test-book"]');
    await bookCard.click();
    await browser.pause(400);
    const btnBack = await $('[data-testid="btn-back"]');
    await btnBack.click();
    await browser.pause(400);
    const libraryView = await $('[data-testid="library-view"]');
    await expect(libraryView).toBeExisting();
  });
});
