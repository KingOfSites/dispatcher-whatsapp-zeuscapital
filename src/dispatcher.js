import { 
    fetchPendingDispatches, 
    markDispatchSent, 
    markDispatchFailed 
} from "./apiClient.js";

import { sendWhatsAppMessage } from "./whatsappClient.js";
import { SEND_DELAY } from "./config.js";

const CONTACT_DELAY_MS = 8000;

async function processQueue() {
  try {
    console.log("🔄 Buscando mensagens pendentes...");

    const pendentes = await fetchPendingDispatches();

    if (!pendentes || pendentes.length === 0) {
      console.log("⏳ Nenhuma mensagem na fila.");
      return setTimeout(processQueue, 3000);
    }

    console.log(`📨 Encontradas ${pendentes.length} mensagens.`);

    for (const job of pendentes) {
      const { id, contact, message, sessionName } = job;

      console.log(`📤 Enviando para ${contact}: ${message}`);

      try {
        await sendWhatsAppMessage({ contact, message, sessionName });

        await markDispatchSent(id);

        console.log(`✅ Mensagem enviada para ${contact}`);
      } catch (err) {
        console.error("❌ Erro ao enviar:", err.message);
        await markDispatchFailed(id, err.message);
      }

      await new Promise((r) => setTimeout(r, SEND_DELAY));
    }

    await new Promise((r) => setTimeout(r, CONTACT_DELAY_MS));
    processQueue();
    
  } catch (error) {
    console.error("🔥 Erro geral no dispatcher:", error);
    setTimeout(processQueue, 5000);
  }
}

export function startDispatcher() {
  console.log("🚀 Dispatcher iniciado!");
  processQueue();
}
