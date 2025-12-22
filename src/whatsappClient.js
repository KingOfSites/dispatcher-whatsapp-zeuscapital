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
                    30000; // 30s para texto e outros

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

        throw new Error(
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Erro ao enviar mensagem"
        );
    }
}
