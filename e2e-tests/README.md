# Testes E2E — Leitor

Testes end-to-end usando **WebdriverIO** e **tauri-driver** para validar o fluxo completo do app.

## Pré-requisitos

1. **tauri-driver** (obrigatório)
   ```bash
   cargo install tauri-driver --locked
   ```

2. **WebDriver do sistema**
   - **Windows**: [Microsoft Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) com versão igual à do Edge instalado. Coloque no `PATH` ou use: `cargo install --git https://github.com/chippers/msedgedriver-tool`
   - **Linux**: `webkit2gtk-driver` ou similar (WebKitWebDriver)

3. **Build do app** funcionando (`npm run build` e `npm run tauri build` devem passar)

## Instalação

```bash
cd e2e-tests
npm install
```

## Execução

Na raiz do projeto:
```bash
npm run e2e
```

Ou em `e2e-tests`:
```bash
npm test
```

O script:
1. Popula o banco com um livro de teste (`fixtures/e2e-book/`)
2. Faz o build de debug do Tauri (`--debug --no-bundle`)
3. Inicia o `tauri-driver` e roda os testes

## Estrutura dos testes

| Spec | Descrição |
|------|-----------|
| `library.e2e.cjs` | Biblioteca: grid, botões, modal de adicionar |
| `navigation.e2e.cjs` | Navegação: biblioteca ↔ configurações ↔ detalhe |
| `settings.e2e.cjs` | Configurações: tema, idioma |
| `reader.e2e.cjs` | Leitor: abrir livro, prev/next, voltar |

## Ambiente

- **Plataformas suportadas**: Windows e Linux (macOS não suporta tauri-driver no desktop)
- O banco de teste é o mesmo usado pelo app em `%APPDATA%/com.serodio.leitor/leitor.db` (Windows)
