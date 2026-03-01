/**
 * Validação de CSS para temas personalizados.
 * Garante que o CSS não altera comportamento (apenas aparência).
 * Blacklist mínima: bloqueia pointer-events e visibility.
 */

const BLOCKED_PROPERTIES = ['pointer-events', 'visibility'];

/**
 * Valida e sanitiza CSS para uso em temas custom.
 * Remove declarações que alteram comportamento (pointer-events, visibility).
 * Retorna { valid: true, css } ou { valid: false, error }.
 */
export function validateCustomThemeCss(css: string): { valid: true; css: string } | { valid: false; error: string } {
  const trimmed = css.trim();
  if (trimmed.length === 0) {
    return { valid: true, css: '' };
  }

  try {
    const sanitized = removeBlockedDeclarations(trimmed);
    return { valid: true, css: sanitized };
  } catch {
    return { valid: false, error: 'Invalid CSS syntax' };
  }
}

/**
 * Remove declarações de propriedades bloqueadas (pointer-events, visibility).
 * Mantém o resto do CSS intacto.
 */
function removeBlockedDeclarations(css: string): string {
  return css.replace(
    new RegExp(
      `\\s*(${BLOCKED_PROPERTIES.map((p) => p.replace(/-/g, '\\-')).join('|')})\\s*:[^;};]*;?`,
      'gi'
    ),
    ''
  );
}
