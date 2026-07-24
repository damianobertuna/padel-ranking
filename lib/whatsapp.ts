'use server'

/**
 * Utility per l'invio di notifiche WhatsApp tramite il bot dedicato a gruppi multipli.
 */
export async function sendWhatsAppNotification(message: string) {
  const url = process.env.WHATSAPP_BOT_URL;
  const token = process.env.WHATSAPP_BOT_SECRET;
  
  // Accetta la nuova variabile al plurale, o usa quella vecchia per retrocompatibilità
  const groupIdsString = process.env.WHATSAPP_GROUP_IDS || process.env.WHATSAPP_GROUP_ID;

  if (!url || !token || !groupIdsString) {
    console.error("❌ [WhatsApp API] Variabili d'ambiente mancanti.");
    return { success: false, error: "Configurazione mancante" };
  }

  // Convertiamo la stringa "id1, id2" in un array ["id1", "id2"] pulendo gli spazi
  const targetGroups = groupIdsString
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

  try {
    console.log(`🟡 [WhatsApp API] Invio messaggio a ${targetGroups.length} gruppi...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // Passiamo l'array invece della singola stringa!
      body: JSON.stringify({ groupId: targetGroups, message }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ [WhatsApp API] Errore: ${response.status}`, errorData);
      return { success: false, error: `Server error: ${response.status}` };
    }

    const responseData = await response.json();
    console.log("✅ [WhatsApp API] Processo completato dal bot!");
    
    // Restituiamo anche i risultati granulari gestiti dal bot (successi ed errori)
    return { success: true, results: responseData.results };

  } catch (error) {
    console.error("❌ [WhatsApp API] Eccezione:", error);
    return { success: false, error: "Errore di connessione" };
  }
}