import axios from "axios";
import { config } from "./config.js";

export async function sendWhatsAppMessage({ phone, message, sessionName }) {
    console.log(`[WA] Enviando para ${phone} via sessão ${sessionName}`);

    // Detecta tipo de mensagem para ajustar timeout
    let messageData = message;
    if (typeof message === 'string') {
        try {
            messageData = JSON.parse(message);
        } catch {
            messageData = { type: 'text', text: message };
        }
    }
    
    const messageType = messageData.type || 'text';
    const timeout = messageType === 'audio' ? 90000 : // 90s para áudio
                    messageType === 'video' ? 120000 : // 120s para vídeo
                    60000; // 60s para texto e outros (aumentado de 30s)

    try {
        const response = await axios.post(
            `${config.nextApiBaseUrl}/api/whatsapp/send-phone`,
            {
                phone,
                message,
                sessionName
            },
            {
                timeout: timeout
            }
        );

        return response.data;

    } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err.response?.data || err.message);

        // Captura erro detalhado
        const errorMessage = err.response?.data?.error ||
                           err.response?.data?.message ||
                           err.response?.data?.details ||
                           err.message ||
                           "Erro desconhecido ao enviar mensagem";

        // Se for timeout, deixa claro na mensagem
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            throw new Error(`Timeout ao enviar mensagem (${timeout}ms excedido) - A mensagem pode ter sido enviada`);
        }

        throw new Error(errorMessage);
    }
}
