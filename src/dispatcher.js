import {
  fetchPendingDispatches,
  markDispatchSent,
  markDispatchFailed,
} from "./apiClient.js";

import { sendWhatsAppMessage } from "./whatsappClient.js";
import { SEND_DELAY } from "./config.js";

const CONTACT_DELAY_MS = 8000;

/**
 * Gera um delay aleatório entre min e max (em milissegundos)
 */
function getRandomDelay(min, max) {
  if (!min || !max || min === max) return min || max || 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Substitui variáveis na mensagem pelos valores do contato
 * Variáveis suportadas: {{nome}}, {{telefone}}, {{email}}, {{empresa}}
 */
function replaceVariables(text, contactData) {
  if (!text || typeof text !== "string") return text;

  const variables = {
    "{{nome}}": contactData?.name || "",
    "{{telefone}}": contactData?.phone || "",
    "{{email}}": contactData?.email || "",
    "{{empresa}}": contactData?.empresa || "",
  };

  let result = text;
  for (const [variable, value] of Object.entries(variables)) {
    // Substitui todas as ocorrências da variável (case insensitive)
    const regex = new RegExp(variable.replace(/[{}]/g, "\\$&"), "gi");
    result = result.replace(regex, value);
  }

  return result;
}

async function processQueue() {
  try {
    console.log("🔄 Buscando mensagens pendentes...");

    // Retorno da API: { success: true, data: [...] }
    const response = await fetchPendingDispatches();

    // Garantir que sempre caia em um array
    const pendentes = response?.data || [];

    if (pendentes.length === 0) {
      console.log("⏳ Nenhuma mensagem na fila.");
      return setTimeout(processQueue, 3000);
    }

    console.log(`📨 Encontradas ${pendentes.length} mensagens.`);

    // Agrupa mensagens por contato e campanha
    // Estrutura: { "campaignId-contact": [mensagens ordenadas] }
    const grouped = {};

    for (const job of pendentes) {
      const { campaignId, contact } = job;
      const key = `${campaignId}-${contact}`;

      if (!grouped[key]) {
        grouped[key] = {
          contact,
          campaignId,
          delayMin: job.delayMin || job.delay || 30000,
          delayMax: job.delayMax || job.delay || 30000,
          contactDelayMin: job.contactDelayMin || job.contactDelay || 10000,
          contactDelayMax: job.contactDelayMax || job.contactDelay || 10000,
          messages: [],
        };
      }

      grouped[key].messages.push(job);
    }

    // Ordena mensagens dentro de cada grupo por messageOrder
    for (const key in grouped) {
      grouped[key].messages.sort((a, b) => {
        const orderA = a.messageOrder || 0;
        const orderB = b.messageOrder || 0;
        return orderA - orderB;
      });
    }

    // Processa cada grupo (contato + campanha)
    const groups = Object.values(grouped);
    console.log(`👥 Processando ${groups.length} contatos únicos`);

    for (const group of groups) {
      const { contact, messages, delayMin, delayMax, contactDelayMin, contactDelayMax } = group;
      const phone = contact;

      if (!phone) {
        console.error(`❌ Grupo sem telefone: ${group.campaignId}`);
        // Marca todas as mensagens como falhas
        for (const msg of messages) {
          await markDispatchFailed(
            msg.id,
            "Telefone não encontrado no registro"
          );
        }
        continue;
      }

      console.log(
        `📱 Processando ${messages.length} mensagens para ${phone} (delay: ${delayMin}-${delayMax}ms entre mensagens)`
      );

      // Busca dados do contato para substituição de variáveis
      const contactData = messages[0]?.contactData || {
        name: "",
        email: "",
        empresa: "",
        phone: contact,
      };

      // Envia todas as mensagens do mesmo contato em sequência
      for (let i = 0; i < messages.length; i++) {
        const job = messages[i];
        const {
          id,
          message,
          sessionName,
          messageOrder,
          contactData: jobContactData,
        } = job;

        // Usa contactData do job se disponível, senão usa do grupo
        const currentContactData = jobContactData || contactData;

        // Parse do JSON da mensagem (pode ser string JSON ou objeto)
        let messageData;
        try {
          messageData =
            typeof message === "string" ? JSON.parse(message) : message;
        } catch (e) {
          // Se não for JSON, trata como texto simples
          messageData = { type: "text", text: message };
        }

        // Substitui variáveis no texto da mensagem
        const originalText = messageData.text || messageData.message || "";
        if (messageData.text) {
          messageData.text = replaceVariables(
            messageData.text,
            currentContactData
          );
        }
        if (messageData.message) {
          messageData.message = replaceVariables(
            messageData.message,
            currentContactData
          );
        }

        // Extrai o texto da mensagem (já com variáveis substituídas)
        const messageText =
          messageData.text ||
          messageData.message ||
          JSON.stringify(messageData);

        // Log se houve substituição de variáveis
        if (originalText !== messageText && originalText.includes("{{")) {
          console.log(
            `🔄 Variáveis substituídas: "${originalText.substring(
              0,
              50
            )}..." → "${messageText.substring(0, 50)}..."`
          );
        }

        console.log(
          `📤 [${i + 1}/${
            messages.length
          }] Enviando para ${phone} via sessão ${sessionName} (ordem: ${
            messageOrder || i + 1
          }): ${messageText.substring(0, 50)}...`
        );

        try {
          // Envio para sua rota Next.js → /api/whatsapp/send-phone
          await sendWhatsAppMessage({
            phone,
            message: messageData,
            sessionName,
          });

          await markDispatchSent(id);

          console.log(
            `✅ Mensagem ${i + 1}/${
              messages.length
            } enviada com sucesso (dispatchId=${id})`
          );
        } catch (err) {
          console.error(
            `❌ Erro ao enviar mensagem ${i + 1}/${messages.length}:`,
            err.message
          );
          await markDispatchFailed(id, err.message);
          // Continua tentando as próximas mensagens mesmo se uma falhar
        }

        // Delay entre mensagens do mesmo contato (exceto na última)
        if (i < messages.length - 1) {
          const delayMs = getRandomDelay(delayMin, delayMax) || SEND_DELAY;
          console.log(
            `⏳ Aguardando ${delayMs}ms antes da próxima mensagem...`
          );
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      // Delay entre contatos diferentes
      const contactDelayMs = getRandomDelay(contactDelayMin, contactDelayMax) || CONTACT_DELAY_MS;
      console.log(
        `⏳ Aguardando ${contactDelayMs}ms antes do próximo contato...`
      );
      await new Promise((r) => setTimeout(r, contactDelayMs));
    }

    // Delay entre ciclos
    await new Promise((r) => setTimeout(r, 2000));
    processQueue();
  } catch (error) {
    console.error("🔥 Erro geral no dispatcher:", error);
    setTimeout(processQueue, 5000);
  }
}

export function startDispatcher() {
  console.log("🚀 Dispatcher iniciado!");
  processQueue();
}
