import axios from "axios";
import { config } from "./config.js";

const wa = axios.create({
    baseURL: config.wppconnectBaseUrl,
    timeout: 15000,
});

export async function sendWhatsAppMessage({ contact, message, sessionName }) {
    console.log(`[WA] Enviando para ${contact} via sessão ${sessionName}`);

    try {
        const response = await wa.post(`/${sessionName}/send-message`, {
            phone: contact,
            message: message,
        });

        return response.data;
    } catch (err) {
        throw new Error(
            err.response?.data?.message || "Erro ao enviar mensagem"
        );
    }
}
