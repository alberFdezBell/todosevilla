import { NextResponse } from "next/server";

export async function POST() {
  const webhookUrl = process.env.PORTAINER_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "La variable de entorno PORTAINER_WEBHOOK_URL no está configurada." },
      { status: 500 }
    );
  }

  try {
    console.log("Enviando petición de redespliegue al webhook de Portainer...");
    
    // Llamar al webhook de Portainer. Portainer suele retornar 204 No Content o un JSON simple.
    // Desactivamos la verificación de SSL si es local y se usa HTTPS autofirmado para Portainer
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      throw new Error(`Portainer retornó estado ${res.status}: ${text}`);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook de Portainer invocado correctamente.",
    });
  } catch (error: any) {
    console.error("Error llamando al webhook de Portainer:", error);
    return NextResponse.json(
      { error: `Error de red al llamar a Portainer: ${error.message}` },
      { status: 500 }
    );
  }
}
