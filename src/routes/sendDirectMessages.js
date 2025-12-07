import express from "express";
import axios from "axios";
import { config } from "../config.js";

const router = express.Router();

/**
 * ➤ Rota para enviar mensagem direta IMEDIATA (sem fila)
 * POST /send-direct-message
 * body: { contact, message, sessionName }
 */
router.post("/", async (req, res) => {
  try {
    const { contact, message, sessionName } = req.body;

    if (!contact || !message || !sessionName) {
      return res.status(400).json({
        error: "contact, message e sessionName são obrigatórios",
      });
    }

    console.log(`📨 Enviando mensagem direta para: ${contact}`);

    // Envia via WPPConnect
    const response = await axios.post(
      `${config.wppconnectBaseUrl}/${sessionName}/send-message`,
      {
        phone: contact,
        message,
      }
    );

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    console.error("❌ erro sendDirectMessage:", err.response?.data || err);

    return res.status(500).json({
      error: "Erro ao enviar mensagem direta",
      detail: err.response?.data || err.message,
    });
  }
});

export default router;
