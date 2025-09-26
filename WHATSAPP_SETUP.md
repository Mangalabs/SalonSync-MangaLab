# WhatsApp Business API - Setup Guide

## Pré-requisitos

### 1. Meta for Developers App
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um novo app do tipo "Business"
3. Adicione o produto "WhatsApp Business API"
4. Configure as permissões:
   - `business_management`
   - `whatsapp_business_management`

### 2. Variáveis de Ambiente
Adicione ao seu `.env`:

```env
# Meta/Facebook App
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_WEBHOOK_VERIFY_TOKEN=your-verify-token
META_REDIRECT_URI=http://localhost:3000/api/whatsapp/callback

# Criptografia (32 caracteres)
ENCRYPTION_KEY=your-32-character-encryption-key

# URLs
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### 3. Configurar Webhook no Meta
1. No painel do Meta for Developers
2. WhatsApp > Configuration
3. Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
4. Verify Token: mesmo valor de `META_WEBHOOK_VERIFY_TOKEN`
5. Subscribe to: `messages`

## Como Usar

### 1. Backend
```bash
# Instalar dependências
npm install

# Executar migração
npx prisma generate
npx prisma db push

# Iniciar servidor
npm run start:dev
```

### 2. Frontend
```tsx
import { WhatsAppSetup } from '@/components/whatsapp/WhatsAppSetup'

function SettingsPage() {
  return (
    <div>
      <WhatsAppSetup branchId="your-branch-id" />
    </div>
  )
}
```

## Fluxo de Funcionamento

### 1. Usuário Inicia Conexão
- Digita número do WhatsApp Business
- Clica em "Conectar WhatsApp"
- Sistema cria configuração pendente

### 2. OAuth com Meta
- Usuário é redirecionado para Facebook
- Autoriza acesso à conta Business
- Meta redireciona de volta com `code`

### 3. Configuração Automática
- Backend troca `code` por `access_token`
- Registra número no WhatsApp Cloud API
- Configura webhook automaticamente
- Marca configuração como "CONNECTED"

### 4. Pronto para Usar
- WhatsApp conectado e funcionando
- Mensagens chegam via webhook
- Sistema pronto para IA (futuro)

## Endpoints da API

### POST /api/whatsapp/connect
Inicia processo de conexão
```json
{
  "phoneNumber": "+5511999999999",
  "branchId": "branch-uuid"
}
```

### GET /api/whatsapp/callback
Callback do OAuth (automático)

### GET /api/whatsapp/config/:branchId
Verifica status da configuração

### POST /api/whatsapp/webhook
Recebe mensagens do WhatsApp

## Estrutura do Banco

```sql
-- Configuração do WhatsApp
WhatsAppConfig {
  id: String (UUID)
  branchId: String (único)
  phoneNumber: String (único)
  phoneNumberId: String
  wabaId: String
  businessId: String
  accessToken: String (criptografado)
  status: PENDING | CONNECTING | CONNECTED | ERROR
  aiEnabled: Boolean (futuro)
}

-- Mensagens do chat
ChatMessage {
  id: String (UUID)
  whatsappConfigId: String
  phone: String
  message: String
  messageType: text | image | audio
  direction: incoming | outgoing
  timestamp: DateTime
}
```

## Testes

```bash
# Executar testes
npm run test

# Testes específicos do WhatsApp
npm run test -- whatsapp
```

## Troubleshooting

### Erro: "Can't reach database"
- Verifique se PostgreSQL está rodando
- Confirme `DATABASE_URL` no `.env`

### Erro: "Invalid redirect URI"
- Verifique `META_REDIRECT_URI` no `.env`
- Configure a mesma URL no Meta for Developers

### Erro: "Webhook verification failed"
- Confirme `META_WEBHOOK_VERIFY_TOKEN`
- Verifique se webhook está acessível publicamente

### Erro: "Phone number not found"
- Certifique-se que o número está associado à conta Business
- Verifique se o número está verificado no WhatsApp Business

## Próximos Passos

1. ✅ Estrutura básica implementada
2. ⏳ Processamento de mensagens
3. ⏳ Interface de conversas
4. ⏳ Integração com IA
5. ⏳ Respostas automáticas
6. ⏳ Analytics e relatórios