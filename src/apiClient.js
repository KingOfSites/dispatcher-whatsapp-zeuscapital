import axios from "axios";
import { config } from "./config.js";

const api = axios.create({
    baseURL: config.nextApiBaseUrl,
    timeout: 10000,
});

api.interceptors.request.use((reqConfig) => {
    if (config.nextApiToken) {
        reqConfig.headers.Authorization = `Bearer ${config.nextApiToken}`;
    }
    reqConfig.headers["Content-Type"] = "application/json";
    return reqConfig;
});

export async function fetchPendingDispatches() {
    const response = await api.get("/api/dispatcher/pending");
    return response.data;
}

export async function markDispatchSent(id, payload = {}) {
    await api.post(`/api/dispatcher/${id}/mark-sent`, payload);
}

export async function markDispatchFailed(id, errorMessage) {
    await api.post(`/api/dispatcher/${id}/mark-failed`, {
        error: errorMessage?.slice(0, 1000) || "Erro desconhecido",
    });
}
