'use server'

/**
 * Utility per l'invio di notifiche WhatsApp tramite il bot dedicato.
 */
export async function sendWhatsAppNotification(message: string) {
  const url = process.env.WHATSAPP_BOT_URL;
  const token = process.env.WHATSAPP_BOT_SECRET;
  const groupId = process.env.WHATSAPP_GROUP_ID;

  if (!url || !token || !groupId) {
    console.error("❌ [WhatsApp API] Variabili d'ambiente mancanti.");
    return { success: false, error: "Configurazione mancante" };
  }

  try {
    console.log("🟡 [WhatsApp API] Invio messaggio...");
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ groupId, message }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ [WhatsApp API] Errore: ${response.status}`, errorData);
      return { success: false, error: `Server error: ${response.status}` };
    }

    console.log("✅ [WhatsApp API] Notifica inviata!");
    return { success: true };

  } catch (error) {
    console.error("❌ [WhatsApp API] Eccezione:", error);
    return { success: false, error: "Errore di connessione" };
  }
}