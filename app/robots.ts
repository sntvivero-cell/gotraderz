import type { MetadataRoute } from 'next';

const BASE_URL = 'https://gotraderz.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Rutas que requieren sesión — no aportan nada indexadas, y publicar/mensajes
      // muestran contenido distinto por usuario de todas formas. /forgot-password y
      // /reset-password se suman por el mismo motivo: son pasos de un flujo de
      // sesión (y la segunda además lleva tokens de un solo uso en la URL mientras
      // se procesa) — ya tienen su propio `robots: { index: false }` en
      // generateMetadata, esto es la segunda capa (bloquea el rastreo en sí, no solo
      // la indexación) que ya existe para el resto de esta lista.
      disallow: [
        '/login',
        '/publicar',
        '/mensajes',
        '/configuracion',
        '/guardados',
        '/watchlist',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
