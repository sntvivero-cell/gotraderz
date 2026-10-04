// Dominio canónico único del sitio. gotraderz.com (sin "www") hace un redirect 308 a
// www.gotraderz.com a nivel DNS/hosting — por eso toda URL ABSOLUTA que genera el
// servidor (metadataBase, og:url, links de "Copy link"/WhatsApp/Telegram) tiene que
// apuntar directo a www: evita un salto de redirect extra en cada preview/click, y
// evita que Google indexe las dos variantes como páginas distintas.
//
// NO confundir con `SITE_URL` de app/api/send-notifications/route.ts: esa variable
// cae hoy a 'https://gotraderz.com' (sin "www") si no está configurada en el entorno
// — un dominio DISTINTO al de acá a propósito no tocado, ver nota en el chat. Si en
// algún momento se define la env var SITE_URL en Vercel, AMBOS helpers la heredan
// (son el mismo nombre de variable), así que lo ideal es que esa env var ya incluya
// el "www" cuando se configure.
const DEFAULT_SITE_URL = 'https://www.gotraderz.com';

export function siteUrl(): string {
  const configured = process.env.SITE_URL?.trim();
  // Sin barra final: cada caller concatena su propio path empezando con "/"
  // (ej. `${siteUrl()}/trade/${id}`) — dejar una barra acá produciría "//trade/...".
  return (configured || DEFAULT_SITE_URL).replace(/\/+$/, '');
}
