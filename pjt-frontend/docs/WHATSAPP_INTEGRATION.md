# Integração WhatsApp - SalonSync

## 🛠️ Ferramentas Disponíveis

### 1. **Twilio** (Recomendado)
- **Custo**: $0.005/msg + número $1/mês
- **Prós**: Confiável, documentação excelente
- **Contras**: Precisa aprovação Meta

### 2. **WhatsApp Business API**
- **Custo**: Variável por provedor
- **Prós**: Oficial, recursos completos
- **Contras**: Complexo, caro

### 3. **Baileys** (Open Source)
- **Custo**: Gratuito
- **Prós**: Gratuito, controle total
- **Contras**: Pode ser bloqueado, instável

### 4. **Evolution API**
- **Custo**: Gratuito (self-hosted)
- **Prós**: Brasileiro, fácil setup
- **Contras**: Não oficial

### 5. **ChatAPI / Chat-API**
- **Custo**: $20-50/mês
- **Prós**: Fácil integração
- **Contras**: Não oficial

### 6. **Wppconnect**
- **Custo**: Gratuito
- **Prós**: Open source brasileiro
- **Contras**: Risco de bloqueio

## 🎯 Casos de Uso para SalonSync

### 1. **Confirmação de Agendamentos**
```
📅 Olá Maria! 

Seu agendamento está confirmado:
• Data: 15/12/2024 às 14:00
• Serviço: Corte + Escova
• Profissional: Ana Silva
• Valor: R$ 80,00

Confirme digitando *SIM* ou reagende em: link.salonsync.com
```

### 2. **Lembretes Automáticos**
```
⏰ Lembrete: Seu agendamento é amanhã!

📅 16/12/2024 às 14:00
💇‍♀️ Corte + Escova com Ana Silva
📍 Salão Beleza Total

Precisa reagendar? Responda REAGENDAR
```

### 3. **Promoções e Marketing**
```
🎉 OFERTA ESPECIAL!

50% OFF em tratamentos capilares
Válido até 31/12/2024

Agende já: wa.me/5511999999999
```

### 4. **Pesquisa de Satisfação**
```
⭐ Como foi seu atendimento hoje?

Avalie de 1 a 5:
1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣

Sua opinião é muito importante!
```

## 🏗️ Arquitetura Recomendada

```
SalonSync → Webhook → WhatsApp API → Cliente
    ↑                     ↓
Database ← Queue System ← Webhook
```

## 📋 Implementação com Twilio

### 1. Setup Inicial
```javascript
// backend/services/whatsapp.js
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendMessage = async (to, message) => {
  try {
    const result = await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio Sandbox
      to: `whatsapp:+55${to}`,
      body: message
    });
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { sendMessage };
```

### 2. Templates de Mensagens
```javascript
// backend/templates/whatsapp.js
const templates = {
  appointmentConfirmation: (appointment) => `
📅 *Agendamento Confirmado*

Olá ${appointment.client.name}!

✅ *Detalhes do seu agendamento:*
📅 Data: ${formatDate(appointment.scheduledAt)}
⏰ Horário: ${formatTime(appointment.scheduledAt)}
💇‍♀️ Serviço: ${appointment.services.join(', ')}
👩‍💼 Profissional: ${appointment.professional.name}
💰 Valor: R$ ${appointment.total.toFixed(2)}

📍 *Local:* ${appointment.branch.address}

Precisa reagendar? Responda *REAGENDAR*
  `,

  appointmentReminder: (appointment) => `
⏰ *Lembrete de Agendamento*

Olá ${appointment.client.name}!

Seu agendamento é *amanhã*:
📅 ${formatDate(appointment.scheduledAt)} às ${formatTime(appointment.scheduledAt)}
💇‍♀️ ${appointment.services.join(', ')}

Confirme sua presença respondendo *SIM*
Para reagendar, responda *REAGENDAR*
  `,

  appointmentCancellation: (appointment) => `
❌ *Agendamento Cancelado*

Olá ${appointment.client.name}!

Seu agendamento foi cancelado:
📅 ${formatDate(appointment.scheduledAt)} às ${formatTime(appointment.scheduledAt)}

Para reagendar: ${process.env.FRONTEND_URL}/scheduling
Ou responda *REAGENDAR*
  `
};

module.exports = templates;
```

### 3. Sistema de Filas
```javascript
// backend/queues/whatsapp.js
const Queue = require('bull');
const { sendMessage } = require('../services/whatsapp');
const templates = require('../templates/whatsapp');

const whatsappQueue = new Queue('WhatsApp notifications', {
  redis: process.env.REDIS_URL
});

// Processar mensagens
whatsappQueue.process('send-message', async (job) => {
  const { phone, template, data } = job.data;
  
  const message = templates[template](data);
  await sendMessage(phone, message);
});

// Agendar lembretes
whatsappQueue.process('schedule-reminder', async (job) => {
  const { appointmentId } = job.data;
  
  // Buscar agendamento
  const appointment = await getAppointment(appointmentId);
  
  // Agendar lembrete 24h antes
  const reminderTime = new Date(appointment.scheduledAt);
  reminderTime.setHours(reminderTime.getHours() - 24);
  
  whatsappQueue.add('send-message', {
    phone: appointment.client.phone,
    template: 'appointmentReminder',
    data: appointment
  }, {
    delay: reminderTime.getTime() - Date.now()
  });
});

module.exports = whatsappQueue;
```

### 4. Webhooks para Respostas
```javascript
// backend/routes/whatsapp.js
const express = require('express');
const router = express.Router();

router.post('/webhook', async (req, res) => {
  const { From, Body } = req.body;
  const phone = From.replace('whatsapp:+55', '');
  const message = Body.toLowerCase().trim();
  
  // Buscar cliente pelo telefone
  const client = await Client.findOne({ phone });
  
  if (!client) {
    await sendMessage(phone, 'Número não encontrado. Entre em contato conosco.');
    return res.status(200).send();
  }
  
  // Processar comandos
  switch (message) {
    case 'sim':
      await confirmAppointment(client);
      break;
      
    case 'reagendar':
      await sendRescheduleOptions(client);
      break;
      
    case 'cancelar':
      await cancelAppointment(client);
      break;
      
    default:
      await sendHelpMessage(client);
  }
  
  res.status(200).send();
});

module.exports = router;
```

## 🔄 Fluxos Automáticos

### 1. Novo Agendamento
```javascript
// backend/controllers/appointments.js
const createAppointment = async (req, res) => {
  const appointment = await Appointment.create(req.body);
  
  // Enviar confirmação imediata
  whatsappQueue.add('send-message', {
    phone: appointment.client.phone,
    template: 'appointmentConfirmation',
    data: appointment
  });
  
  // Agendar lembrete
  whatsappQueue.add('schedule-reminder', {
    appointmentId: appointment.id
  });
  
  res.json(appointment);
};
```

### 2. Sistema de Reagendamento
```javascript
const sendRescheduleOptions = async (client) => {
  const availableSlots = await getAvailableSlots();
  
  let message = '📅 *Horários Disponíveis:*\n\n';
  availableSlots.forEach((slot, index) => {
    message += `${index + 1}. ${formatDateTime(slot)}\n`;
  });
  message += '\nResponda o número da opção desejada.';
  
  await sendMessage(client.phone, message);
};
```

## 💰 Estimativa de Custos

### Twilio (1000 mensagens/mês)
- Mensagens: $5.00
- Número: $1.00
- **Total**: $6.00/mês

### Evolution API (Self-hosted)
- Servidor: $5.00/mês
- **Total**: $5.00/mês

### WhatsApp Business API
- Setup: $100-500
- Mensagens: $0.01-0.05 cada
- **Total**: $50-200/mês

## 🚀 Implementação Rápida

### 1. Baileys (Gratuito)
```bash
npm install @whiskeysockets/baileys qrcode-terminal
```

```javascript
const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');

const startWhatsApp = () => {
  const sock = makeWASocket({
    printQRInTerminal: true
  });
  
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    if (!message.key.fromMe) {
      // Processar mensagem recebida
      await handleIncomingMessage(message);
    }
  });
};
```

### 2. Evolution API
```bash
# Docker
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=your-key \
  evolution-api/evolution-api
```

## 📊 Métricas e Analytics

### Dashboard WhatsApp
```javascript
// Métricas para adicionar ao dashboard
const whatsappMetrics = {
  messagesSent: await WhatsAppLog.count({ type: 'sent' }),
  messagesReceived: await WhatsAppLog.count({ type: 'received' }),
  confirmationRate: await calculateConfirmationRate(),
  responseTime: await calculateAverageResponseTime()
};
```

## 🔐 Compliance e Segurança

### LGPD
- Consentimento explícito
- Opt-out fácil
- Dados criptografados

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const whatsappLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 mensagens por minuto
  message: 'Muitas mensagens. Tente novamente em 1 minuto.'
});
```

## 🎯 Próximos Passos

1. **Escolher ferramenta** (Twilio recomendado)
2. **Implementar templates** básicos
3. **Configurar webhooks**
4. **Testar fluxos** principais
5. **Monitorar métricas**
6. **Escalar gradualmente**

Envie seu planejamento detalhado que posso ajudar com a implementação específica!