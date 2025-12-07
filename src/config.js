import dotenv from "dotenv";
dotenv.config();

export const config = {
    nextApiBaseUrl: process.env.NEXTJS_API_BASE_URL || "http://localhost:3000", 
    nextApiToken: process.env.NEXTJS_API_TOKEN || "",
    wppconnectBaseUrl: process.env.WHATSAPP_API_URL
};

export const SEND_DELAY = Number(process.env.SEND_DELAY || 3000);
export const POLLING_INTERVAL_MS = Number(process.env.POLLING_INTERVAL_MS || 3000);
