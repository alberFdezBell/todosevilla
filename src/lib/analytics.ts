import { db } from "./db";
import { headers } from "next/headers";

/**
 * Registra una visita a una ruta de forma server-side y cookieless.
 * Descarta peticiones de rastreadores comunes (bots) analizando el User-Agent.
 */
export async function recordVisit(params: {
  path: string;
  zoneId?: string;
  businessId?: string;
}) {
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "";
    
    // Lista básica de bots/crawlers comunes para filtrar
    const botPattern = /bot|crawl|spider|slurp|facebookexternalhit|embedly|quora link preview|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator|redditbot|Applebot|WhatsApp|TelegramBot|Twitterbot|Lighthouse/i;
    
    if (botPattern.test(userAgent)) {
      // Ignorar visitas de bots para no distorsionar las estadísticas reales
      return;
    }

    // Insertar la visita en la base de datos de manera anónima (sin IP ni cookies)
    await db.pageVisit.create({
      data: {
        path: params.path,
        zoneId: params.zoneId || null,
        businessId: params.businessId || null,
      },
    });
  } catch (error) {
    // Si hay un error registrando la visita, no queremos tumbar la petición del usuario
    console.error("Error registrando visita en analítica:", error);
  }
}
