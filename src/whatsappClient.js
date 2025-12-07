import axios from "axios";
import { config } from "./config.js";

export async function sendWhatsAppMessage({ phone, message, sessionName }) {
    console.log(`[WA] Enviando para ${phone} via sessão ${sessionName}`);

    try {
        const response = await axios.post(
            `${config.nextApiBaseUrl}/api/whatsapp/send-phone`,
            {
                phone,
                message,
                sessionName
            },
            {
                timeout: 20000
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
