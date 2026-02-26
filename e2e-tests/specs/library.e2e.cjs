/**
 * E2E: Biblioteca
 * - Tela inicial carrega e mostra grid ou empty state
 * - Botão Adicionar abre o modal
 * - Botão Configurações navega para settings
 */
describe('Biblioteca', function () {
  beforeEach(async function () {
    await browser.url('/');
    await browser.pause(500);
  });

  it('deve exibir a view da biblioteca', async function () {
    const view = await $('[data-testid="library-view"]');
    await expect(view).toBeExisting();
  });

  it('deve exibir botão Adicionar Livro', async function () {
    const btn = await $('[data-testid="btn-add-book"]');
    await expect(btn).toBeExisting();
  });

  it('deve exibir botão Configurações', async function () {
    const btn = await $('[data-testid="btn-settings"]');
    await expect(btn).toBeExisting();
  });

  it('deve ter livros no grid após seed (E2E Test Book)', async function () {
    const grid = await $('[data-testid="library-grid"]');
    await expect(grid).toBeExisting();
    const bookCard = await $('[data-testid="book-card-e2e-test-book"]');
    await expect(bookCard).toBeExisting();
    await expect(bookCard).toHaveText(expect.stringContaining('E2E Test Book'));
  });

  it('deve abrir modal ao clicar em Adicionar Livro', async function () {
    const btn = await $('[data-testid="btn-add-book"]');
    await btn.click();
    await browser.pause(300);
    const modal = await $('[data-testid="add-book-modal"]');
    await expect(modal).toBeExisting();
    const selectFolder = await $('[data-testid="add-book-select-folder"]');
    const selectFile = await $('[data-testid="add-book-select-file"]');
    await expect(selectFolder).toBeExisting();
    await expect(selectFile).toBeExisting();
  });
});
