require("dotenv").config();

module.exports = {
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
  SEND_DELAY: 1000 // 1 segundo entre mensagens
};
