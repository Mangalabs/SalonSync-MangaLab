# 📱 WhatsApp Integration - SalonSync

Documentação completa para configuração, gerenciamento e manutenção da integração WhatsApp com Twilio.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração Inicial](#configuração-inicial)
- [Gerenciamento de Contas](#gerenciamento-de-contas)
- [Webhook e Automação](#webhook-e-automação)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)
- [Produção](#produção)

---

## 🎯 Visão Geral

### **Funcionalidades Implementadas**
- ✅ **Envio de mensagens** via Twilio WhatsApp API
- ✅ **Respostas automáticas** com fluxo de agendamento
- ✅ **Multi-filial** - cada filial tem sua configuração
- ✅ **Interface de configuração** no painel admin
- ✅ **Monitoramento** de mensagens recebidas
- ✅ **Webhook** para processamento automático

### **Arquitetura**
```
Cliente WhatsApp → Twilio → Webhook → SalonSync API → Banco de Dados
                                   ↓
                            Processamento Automático
                                   ↓
                            Resposta → Twilio → Cliente
```

---

## 🔧 Configuração Inicial

### **1. Pré-requisitos**

#### **1.1 Conta Twilio**
- Acesse [console.twilio.com](https://console.twilio.com)
- Crie conta ou faça login
- Verifique saldo disponível

#### **1.2 WhatsApp Sandbox (Desenvolvimento)**
1. No Console Twilio: **Messaging > Try it out > Send a WhatsApp message**
2. Siga instruções para ativar Sandbox
3. Anote número do Sandbox: `+1 415 523 8886`
4. Configure seu número pessoal no Sandbox

### **2. Obter Credenciais**

#### **2.1 Account SID e Auth Token**
```
Console Twilio > Dashboard > Account Info
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **2.2 Número WhatsApp**
```
Desenvolvimento: +14155238886 (Sandbox)
Produção: Seu número aprovado para WhatsApp Business
```

### **3. Configurar no Sistema**

#### **3.1 Acesso à Configuração**
1. Login como **Administrador**
2. Navegue: **Dashboard > WhatsApp > Configuração**

#### **3.2 Preencher Formulário**
```
Account SID: [Cole o Account SID do Twilio]
Auth Token: [Cole o Auth Token do Twilio]
Número WhatsApp: +14155238886 (ou seu número em produção)
```

#### **3.3 Salvar e Testar**
1. Clique **"Salvar Configuração"**
2. Clique **"Testar"** para enviar mensagem de teste
3. Verifique se status aparece como **"Ativo"**

---

## 👥 Gerenciamento de Contas

### **Adicionar Nova Conta**

#### **Cenário: Nova Filial**
```sql
-- A configuração é automática por filial
-- Cada admin de filial configura sua própria conta Twilio
```

**Passos:**
1. Admin da nova filial faz login
2. Acessa **WhatsApp > Configuração**
3. Insere credenciais da conta Twilio da filial
4. Testa configuração
5. Configura webhook (se necessário)

#### **Cenário: Trocar Conta Twilio**
1. Acesse **WhatsApp > Configuração**
2. Insira novas credenciais
3. Clique **"Atualizar Configuração"**
4. Teste nova configuração
5. Configuração anterior é desativada automaticamente

### **Atualizar Conta Existente**

#### **Atualizar Credenciais**
```typescript
// Sistema mantém apenas 1 configuração ativa por filial
// Nova configuração substitui a anterior automaticamente
```

**Processo:**
1. Acesse configuração existente
2. Modifique campos necessários
3. Salve alterações
4. Sistema desativa configuração anterior
5. Ativa nova configuração

#### **Atualizar Número WhatsApp**
1. Configure novo número no Twilio
2. Atualize campo "Número WhatsApp" no sistema
3. Teste envio de mensagem
4. Atualize webhook se necessário

### **Remover Conta**

#### **Desativar Temporariamente**
```sql
-- No banco de dados
UPDATE WhatsAppConfig 
SET isActive = false 
WHERE branchId = 'branch-id';
```

#### **Remover Permanentemente**
⚠️ **Cuidado**: Remove histórico de mensagens

```sql
-- Remover configuração
DELETE FROM WhatsAppConfig WHERE branchId = 'branch-id';

-- Remover mensagens (opcional)
DELETE FROM WhatsAppMessage WHERE branchId = 'branch-id';
DELETE FROM WhatsAppConversation WHERE branchId = 'branch-id';
```

**Via Interface:**
1. Não há opção de remoção na interface
2. Para desativar: configure credenciais inválidas
3. Para remoção: contate desenvolvedor

---

## 🔗 Webhook e Automação

### **Configurar Webhook**

#### **URL do Webhook**
```
Desenvolvimento: http://localhost:3000/api/whatsapp/webhook
Produção: https://seu-dominio.com/api/whatsapp/webhook
```

#### **Configuração no Twilio**
1. **Console Twilio > Messaging > Settings > WhatsApp sandbox settings**
2. **"When a message comes in"**: Cole URL do webhook
3. **HTTP Method**: POST
4. **Save Configuration**

#### **Testar Webhook**
```bash
# Enviar mensagem de teste
curl -X POST https://seu-dominio.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "MessageSid": "test123",
    "From": "whatsapp:+5511999999999",
    "To": "whatsapp:+14155238886",
    "Body": "oi",
    "MessageStatus": "received",
    "AccountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }'
```

### **Fluxo de Automação**

#### **Estados da Conversa**
```typescript
enum ConversationStep {
  GREETING = "GREETING",           // Saudação inicial
  MENU_SELECT = "MENU_SELECT",     // Seleção do menu
  NAME_COLLECT = "NAME_COLLECT",   // Coleta do nome
  BRANCH_SELECT = "BRANCH_SELECT", // Seleção da filial
  PROFESSIONAL_SELECT = "PROFESSIONAL_SELECT", // Seleção do profissional
  WAITING_HUMAN = "WAITING_HUMAN"  // Aguardando atendimento humano
}
```

#### **Mensagens Automáticas**
```
1. GREETING → "👋 Olá! Bem-vindo ao nosso sistema de agendamentos!"
2. MENU_SELECT → "Escolha: 1-Agendar, 2-Atendimento, 0-Cancelar"
3. NAME_COLLECT → "Digite seu nome completo:"
4. BRANCH_SELECT → "Escolha a filial: [lista de filiais]"
5. PROFESSIONAL_SELECT → "Escolha o profissional: [lista]"
```

#### **Personalizar Mensagens**
```typescript
// Arquivo: src/whatsapp/whatsapp.service.ts
// Método: generateResponse()

// Exemplo de personalização
case 'GREETING':
  return {
    message: '👋 Olá! Bem-vindo ao [NOME_SALAO]!\n\nEscolha uma opção:',
    nextStep: 'MENU_SELECT',
    buttons: [
      { reply: { id: '1', title: '📅 Agendar' } },
      { reply: { id: '2', title: '📞 Atendimento' } }
    ]
  };
```

---

## 📊 Monitoramento

### **Interface de Monitoramento**

#### **Acessar Mensagens**
1. **Dashboard > WhatsApp > Notificações**
2. Visualizar mensagens recebidas
3. Filtros automáticos para agendamentos

#### **Informações Exibidas**
- 📞 **Número do cliente**
- 🕐 **Data/hora da mensagem**
- 💬 **Conteúdo da mensagem**
- 📋 **Status do agendamento**

### **Logs do Sistema**

#### **Backend Logs**
```bash
# Ver logs em tempo real
docker logs -f salonSyncAPI

# Filtrar logs WhatsApp
docker logs salonSyncAPI 2>&1 | grep "WhatsApp"

# Logs específicos
docker logs salonSyncAPI 2>&1 | grep -E "(webhook|sendMessage|processConversation)"
```

#### **Tipos de Log**
```
✅ WhatsApp webhook received: [dados da mensagem]
✅ Config found for branch: [branch-id]
✅ Message saved: [message-sid]
✅ Auto-response sent to: [número]
❌ No config found for AccountSid: [account-sid]
❌ Error sending auto-response: [erro]
```

### **Métricas Importantes**

#### **KPIs para Monitorar**
- 📈 **Mensagens recebidas/dia**
- 📈 **Respostas automáticas enviadas**
- 📈 **Agendamentos via WhatsApp**
- 📈 **Taxa de conversão (mensagem → agendamento)**
- ❌ **Erros de webhook**
- ❌ **Falhas no envio**

#### **Queries Úteis**
```sql
-- Mensagens por dia
SELECT DATE(createdAt) as data, COUNT(*) as total
FROM WhatsAppMessage 
WHERE branchId = 'branch-id'
GROUP BY DATE(createdAt)
ORDER BY data DESC;

-- Conversas ativas
SELECT phoneNumber, currentStep, lastMessageAt
FROM WhatsAppConversation 
WHERE branchId = 'branch-id' AND isActive = true;

-- Erros recentes
SELECT * FROM logs 
WHERE message LIKE '%WhatsApp%' AND level = 'ERROR'
ORDER BY timestamp DESC LIMIT 10;
```

---

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **1. Mensagem não enviada**
```
❌ Erro: "Authentication failed"
✅ Solução: Verificar Account SID e Auth Token

❌ Erro: "Invalid phone number"
✅ Solução: Verificar formato do número (+5511999999999)

❌ Erro: "Insufficient funds"
✅ Solução: Adicionar créditos na conta Twilio
```

#### **2. Webhook não funciona**
```
❌ Erro: "Webhook timeout"
✅ Solução: Verificar se API está acessível externamente

❌ Erro: "404 Not Found"
✅ Solução: Confirmar URL do webhook no Twilio

❌ Erro: "No config found"
✅ Solução: Verificar se Account SID está correto
```

#### **3. Respostas automáticas não funcionam**
```
❌ Problema: Bot não responde
✅ Verificar: Webhook configurado corretamente
✅ Verificar: Logs do backend para erros
✅ Verificar: Número está no Sandbox (desenvolvimento)

❌ Problema: Resposta incorreta
✅ Verificar: Estado da conversa no banco
✅ Verificar: Lógica do generateResponse()
```

### **Comandos de Diagnóstico**

#### **Testar Conectividade**
```bash
# Testar webhook externamente
curl -X POST https://seu-dominio.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Verificar configuração no banco
docker exec -it postgres_container psql -U postgres -d salonSync \
  -c "SELECT * FROM WhatsAppConfig WHERE isActive = true;"
```

#### **Reset de Conversa**
```sql
-- Resetar conversa específica
UPDATE WhatsAppConversation 
SET currentStep = 'GREETING', selectedData = '{}' 
WHERE phoneNumber = '+5511999999999';

-- Limpar conversas antigas
DELETE FROM WhatsAppConversation 
WHERE lastMessageAt < NOW() - INTERVAL '7 days';
```

### **Logs de Debug**

#### **Ativar Debug Detalhado**
```typescript
// No whatsapp.service.ts, adicionar logs:
console.log('🔍 DEBUG - Webhook data:', JSON.stringify(webhookData, null, 2));
console.log('🔍 DEBUG - Current conversation:', conversation);
console.log('🔍 DEBUG - Generated response:', response);
```

#### **Monitorar em Tempo Real**
```bash
# Terminal 1: Logs do backend
docker logs -f salonSyncAPI

# Terminal 2: Logs do banco
docker logs -f postgres_container

# Terminal 3: Teste de mensagens
# Enviar mensagens via WhatsApp e observar logs
```

---

## 🚀 Produção

### **Migração para Produção**

#### **1. Upgrade da Conta Twilio**
- Sair do Sandbox mode
- Verificar conta Twilio
- Adicionar créditos suficientes

#### **2. Número WhatsApp Business**
```
1. Solicitar aprovação do número no Twilio
2. Processo pode levar 1-3 dias úteis
3. Número deve estar registrado como WhatsApp Business
4. Atualizar configuração no sistema
```

#### **3. Webhook HTTPS**
```
⚠️ Obrigatório: Webhook deve usar HTTPS em produção

Configurações necessárias:
- Certificado SSL válido
- Domínio próprio
- URL acessível externamente
```

#### **4. Configurações de Produção**
```typescript
// Variáveis de ambiente
TWILIO_WEBHOOK_URL=https://api.salonsync.com/api/whatsapp/webhook
TWILIO_RATE_LIMIT=10 // mensagens por segundo
TWILIO_RETRY_ATTEMPTS=3
```

### **Monitoramento em Produção**

#### **Alertas Recomendados**
```
🚨 Webhook failures > 5% em 1 hora
🚨 Mensagens não enviadas > 10 em 1 hora  
🚨 Erro de autenticação Twilio
🚨 Saldo Twilio < $10
```

#### **Backup e Recuperação**
```sql
-- Backup das configurações
pg_dump -t WhatsAppConfig -t WhatsAppMessage -t WhatsAppConversation salonSync > whatsapp_backup.sql

-- Restaurar backup
psql salonSync < whatsapp_backup.sql
```

### **Escalabilidade**

#### **Limites do Twilio**
```
Sandbox: 1 mensagem/segundo
Produção: 10-100 mensagens/segundo (dependendo do plano)
```

#### **Otimizações**
```typescript
// Implementar rate limiting
// Usar queue para mensagens em massa
// Cache de configurações
// Retry automático para falhas
```

---

## 📚 Referências

### **Documentação Oficial**
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Twilio Console](https://console.twilio.com)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

### **Endpoints da API**
```
POST /api/whatsapp/config     # Salvar configuração
GET  /api/whatsapp/config     # Obter configuração
POST /api/whatsapp/test       # Enviar mensagem teste
POST /api/whatsapp/webhook    # Webhook para mensagens
GET  /api/whatsapp/messages   # Listar mensagens
```

### **Estrutura do Banco**
```sql
WhatsAppConfig:
- id, branchId, accountSid, authTokenEncrypted, whatsappNumber, isActive

WhatsAppMessage:
- id, branchId, messageSid, from, to, body, status, direction

WhatsAppConversation:
- id, branchId, phoneNumber, currentStep, selectedData, isActive
```

---

**📝 Última atualização:** Janeiro 2025  
**👨‍💻 Desenvolvido por:** MangaLab  
**📞 Suporte:** Para dúvidas técnicas, consulte os logs ou contate o desenvolvedor