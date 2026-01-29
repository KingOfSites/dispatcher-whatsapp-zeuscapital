# Dispatcher WhatsApp - Zeus Capital

## 🚀 Como usar

Este é o dispatcher **oficial** para envio de mensagens agendadas. Ele roda como um serviço independente e não precisa que o navegador esteja aberto.

### Vantagens do Dispatcher Externo

✅ **Roda em background** - Não precisa ter o navegador aberto  
✅ **Mais leve e eficiente** - Focado apenas em enviar mensagens  
✅ **Evita conflitos** - Um único dispatcher processa todas as mensagens  
✅ **Ordenação correta** - Envia todas as mensagens de um contato antes de passar para o próximo  

### Como iniciar

```bash
cd dispatcher-whatsapp-zeuscapital
npm install
npm start
```

### Como manter rodando em produção

#### Opção 1: PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o dispatcher
pm2 start src/index.js --name "dispatcher-whatsapp"

# Ver logs
pm2 logs dispatcher-whatsapp

# Parar
pm2 stop dispatcher-whatsapp

# Reiniciar
pm2 restart dispatcher-whatsapp

# Configurar para iniciar automaticamente no boot
pm2 startup
pm2 save
```

#### Opção 2: systemd (Linux)

Criar arquivo `/etc/systemd/system/dispatcher-whatsapp.service`:

```ini
[Unit]
Description=Dispatcher WhatsApp Zeus Capital
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/dispatcher-whatsapp-zeuscapital
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Depois:

```bash
sudo systemctl daemon-reload
sudo systemctl enable dispatcher-whatsapp
sudo systemctl start dispatcher-whatsapp
sudo systemctl status dispatcher-whatsapp
```

#### Opção 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
CMD ["node", "src/index.js"]
```

```bash
docker build -t dispatcher-whatsapp .
docker run -d --name dispatcher-whatsapp --restart always dispatcher-whatsapp
```

### Configuração

Edite o arquivo `src/config.js`:

```javascript
export const API_BASE_URL = "http://localhost:3000"; // URL do seu CRM
export const SEND_DELAY = 30000; // Delay entre mensagens (30 segundos)
export const POLL_INTERVAL = 3000; // Verificar fila a cada 3 segundos
```

### Como funciona

1. **Busca mensagens pendentes** da API do CRM
2. **Agrupa por contato e campanha**
3. **Ordena por messageOrder** dentro de cada grupo
4. **Envia todas as mensagens de um contato** em sequência
5. **Aguarda delay configurado** entre mensagens
6. **Passa para o próximo contato** após terminar o anterior

### Logs

O dispatcher mostra logs detalhados:

```
🔄 Buscando mensagens pendentes...
📨 Encontradas 5 mensagens.
👥 Processando 2 contatos únicos
📱 Processando 3 mensagens para 5541999999999 (delay: 30000-30000ms entre mensagens)
📤 [1/3] Enviando para 5541999999999 via sessão leo-dorea (ordem: 1): Olá João, tudo bem?
✅ Mensagem 1/3 enviada com sucesso (dispatchId=abc123)
⏳ Aguardando 30000ms antes da próxima mensagem...
```

### Troubleshooting

**Problema: Mensagens duplicadas**  
✅ **Solução**: Certifique-se de que apenas UM dispatcher está rodando (externo OU CRM, nunca os dois)

**Problema: Mensagens fora de ordem**  
✅ **Solução**: O dispatcher externo já cuida disso automaticamente

**Problema: Dispatcher não processa mensagens**  
- Verifique se a `API_BASE_URL` está correta no `config.js`
- Verifique os logs do CRM para ver se as mensagens estão sendo agendadas
- Teste a API manualmente: `curl http://localhost:3000/api/dispatcher/pending`

### Diferença vs Dispatcher do CRM

| Característica | Dispatcher CRM | Dispatcher Externo |
|----------------|----------------|-------------------|
| Precisa de navegador | ✅ Sim | ❌ Não |
| Roda em background | ❌ Não | ✅ Sim |
| Ordenação por contato | ⚠️ Limitado | ✅ Perfeito |
| Uso de recursos | 🔴 Alto | 🟢 Baixo |
| **Recomendado** | ❌ | ✅ |

---

**⚠️ IMPORTANTE**: O dispatcher do CRM foi **DESABILITADO** para evitar conflitos. Use apenas este dispatcher externo.
