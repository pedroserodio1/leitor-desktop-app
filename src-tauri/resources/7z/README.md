# 7-Zip para extração de arquivos RAR

O Leitor usa o 7-Zip em modo linha de comando para abrir arquivos RAR **sem exigir instalação** pelo usuário.

## O que você tem aqui

- **7za.exe + 7za.dll** — o app já usa se estiverem na pasta, mas **7za não abre RAR** (só 7z, ZIP, etc.).
- **Para abrir RAR** é preciso ter **7z.exe** e **7z.dll** na mesma pasta.

## Onde achar 7z.exe e 7z.dll (para RAR)

O **7-Zip Extra** que você baixou traz só **7za** (7za.exe/7za.dll). O **7z.exe** e **7z.dll** vêm do **instalador normal** do 7-Zip:

1. Baixe o **instalador** do 7-Zip (não o Extra):  
   https://www.7-zip.org/download.html  
   → por exemplo **7-Zip 25.01 (64-bit)** — arquivo `.exe`.

2. Instale o 7-Zip (só para você, na sua máquina de desenvolvimento).

3. Copie estes dois arquivos da pasta de instalação para **esta pasta** (`resources/7z/`):
   - `C:\Program Files\7-Zip\7z.exe`
   - `C:\Program Files\7-Zip\7z.dll`

4. Depois você pode desinstalar o 7-Zip se quiser; os arquivos já estarão dentro do app.

Estrutura final:
   ```
   resources/7z/
   ├── README.md   (este arquivo)
   ├── 7z.exe      ← necessário para RAR
   ├── 7z.dll      ← necessário para RAR
   ├── 7za.exe     (opcional; você já tem)
   └── 7za.dll     (opcional; você já tem)
   ```

**CBZ/ZIP** não dependem do 7-Zip (o app extrai por código). Só **RAR** precisa de 7z.exe + 7z.dll.

Licença: 7-Zip está sob GNU LGPL (https://www.7-zip.org/license.txt).
