const axios = require("axios");
const { WHATSAPP_API_URL, WHATSAPP_API_TOKEN } = require("./config");

const api = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
    "Content-Type": "application/json"
  }
});

module.exports = api;
