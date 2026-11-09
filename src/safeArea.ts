/**
 * Área segura do Instagram (Reels e Stories, 9:16), seguindo a recomendação da Meta:
 * deixar livres 14% em cima (nome do perfil), 35% embaixo (legenda, áudio e botões)
 * e 6% nas laterais (ícones de curtir/comentar/compartilhar à direita).
 */
export const IG_SAFE = { top: 0.14, bottom: 0.35, left: 0.06, right: 0.06 };

/** A área segura vale para o formato vertical 9:16 (Reels/Stories). */
export function usesSafeArea(width: number, height: number, values: Record<string, unknown>) {
  return values._safe !== false && height / width >= 1.7;
}

export function safeRect(width: number, height: number) {
  const left = Math.round(width * IG_SAFE.left);
  const top = Math.round(height * IG_SAFE.top);
  return { left, top, width: Math.round(width * (1 - IG_SAFE.left - IG_SAFE.right)), height: Math.round(height * (1 - IG_SAFE.top - IG_SAFE.bottom)) };
}

/**
 * Estilos que são uma "cena inteira" (o fundo animado faz parte do visual): ficam na tela toda,
 * com o texto no centro, que já está dentro da área segura.
 */
export function isFullScene(style: string, values: Record<string, unknown>) {
  if (["background-scene", "retro-floor", "strobe-cut", "impact-frame", "trailer", "depth-tunnel"].includes(style)) return true;
  if (style === "cine-reveal" && values.leaks) return true;
  if (style === "slam-impact" && values.stripes) return true;
  return false;
}
