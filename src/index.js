import { fetchPendingDispatches, markDispatchSent, markDispatchFailed } from "./apiClient.js";
import { sendWhatsAppMessage } from "./whatsappClient.js";
import { SEND_DELAY } from "./config.js";
import { startDispatcher } from "./dispatcher.js";

console.log("🚀 Iniciando Dispatcher de WhatsApp...");

// Inicia o processo do dispatcher (processo de mensagens em massa)
startDispatcher();

// Executa a fila manual (caso você queira processar também por aqui)
async function processQueue() {
    console.log("🔄 Buscando disparos pendentes...");

    const pendentes = await fetchPendingDispatches();

    if (!pendentes.length) {
        console.log("📭 Nenhum disparo pendente.");
        return;
    }

    console.log(`📨 ${pendentes.length} mensagens para enviar...`);

    for (const dispatch of pendentes) {
        const { id, contact, message, sessionName } = dispatch;

        try {
            await sendWhatsAppMessage({ contact, message, sessionName });
            await markDispatchSent(id);

            console.log(`✅ Enviado para ${contact}`);

        } catch (err) {
            console.error("❌ Erro ao enviar:", err.message);
            await markDispatchFailed(id, err.message);
        }

        // Delay entre mensagens
        await new Promise(res => setTimeout(res, SEND_DELAY));
    }
}

setInterval(processQueue, 5000);
processQueue();
