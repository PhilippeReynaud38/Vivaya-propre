// lib/twemoji.ts – helper pour appliquer Twemoji aux émojis rendus
// -----------------------------------------------------------------------------
// • Utilise la librairie twemoji (npm i twemoji)
// • Transforme chaque caractère emoji dans le subtree donné en balise <img>
//   pointant vers le CDN SVG Twemoji (ou vos assets si vous self‑hostez)
// -----------------------------------------------------------------------------

import twemoji from 'twemoji';

/**
 * Remplace les caractères emoji dans `root` par des <img> SVG Twemoji.
 * Appeler après chaque mise à jour du DOM (ex. après setMessages ou showPicker).
 */
export function applyTwemoji(root: HTMLElement) {
  if (!root) return;
  twemoji.parse(root, {
    folder: 'svg', // utiliser les SVG (plus nets, 2‑3 Ko)
    ext: '.svg',
    className: 'twemoji', // classe CSS pour custom éventuel
  });
}
