const { sendMessage } = require("./whatsappClient");
const { SEND_DELAY } = require("./config");

// Exemplo: números do banco → troque para sua query real
async function loadNumbersFromDatabase() {
  return [
    "5599999999999",
    "5588989898989",
    "5511999998888"
  ];
}

async function dispatcher() {
  const numbers = await loadNumbersFromDatabase();
  const message = "Olá! Essa é uma mensagem automática 😊";

  console.log(`🚀 Iniciando disparo para ${numbers.length} contatos...`);

  for (const number of numbers) {
    await sendMessage(number, message);
    await new Promise(res => setTimeout(res, SEND_DELAY)); // delay entre envios
  }

  console.log("✨ Disparo finalizado!");
}

module.exports = { dispatcher };
