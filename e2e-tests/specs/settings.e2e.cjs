/**
 * E2E: Configurações globais
 * - Trocar tema (light/dark)
 * - Trocar idioma
 */
describe('Configurações', function () {
  beforeEach(async function () {
    await browser.url('/');
    await browser.pause(500);
    const btnSettings = await $('[data-testid="btn-settings"]');
    await btnSettings.click();
    await browser.pause(400);
  });

  it('deve exibir a view de configurações', async function () {
    const view = await $('[data-testid="settings-view"]');
    await expect(view).toBeExisting();
  });

  it('deve exibir botões de tema light e dark', async function () {
    const themeLight = await $('[data-testid="theme-light"]');
    const themeDark = await $('[data-testid="theme-dark"]');
    await expect(themeLight).toBeExisting();
    await expect(themeDark).toBeExisting();
  });

  it('deve trocar para tema dark ao clicar', async function () {
    const themeDark = await $('[data-testid="theme-dark"]');
    await themeDark.click();
    await browser.pause(300);
    const html = await $('html');
    const classes = await html.getAttribute('class');
    expect(classes).toContain('dark');
  });
});
