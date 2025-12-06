const api = require("./apiClient");

async function sendMessage(number, message) {
  try {
    const res = await api.post("/send-message", {
      number,
      message
    });

    console.log(`✔ Mensagem enviada para ${number}`);
    return res.data;
  } catch (err) {
    console.error(`❌ Erro ao enviar para ${number}`, err.message);
  }
}

module.exports = { sendMessage };
