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

    // Retorno da API: { success: true, data: [...] }
    const response = await fetchPendingDispatches();

    // Garantir que sempre caia em um array
    const pendentes = response?.data || [];

    if (pendentes.length === 0) {
      console.log("⏳ Nenhuma mensagem na fila.");
      return setTimeout(processQueue, 3000);
    }

    console.log(`📨 Encontradas ${pendentes.length} mensagens.`);

    for (const job of pendentes) {
      const { id, phone, message, sessionName } = job;

      console.log(`📤 Enviando para ${phone} via sessão ${sessionName}: ${message}`);

      try {
        // Envio para sua rota Next.js → /api/whatsapp/send-message
        await sendWhatsAppMessage({ phone, message, sessionName });

        await markDispatchSent(id);

        console.log(`✅ Mensagem enviada com sucesso (dispatchId=${id})`);
      } catch (err) {
        console.error("❌ Erro ao enviar:", err.message);
        await markDispatchFailed(id, err.message);
      }

      // Delay entre mensagens
      await new Promise((r) => setTimeout(r, SEND_DELAY));
    }

    // Delay entre ciclos
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
