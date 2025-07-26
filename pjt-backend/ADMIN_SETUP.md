# Configuração de Administradores

## Método 1: Script de Criação (Recomendado para primeiro SuperAdmin)

### 1. Criar SuperAdmin inicial

```bash
npm run create-admin <email> <password> <name> <businessName> [branchName]
```

**Exemplo:**
```bash
npm run create-admin superadmin@empresa.com senha123 "Seu Nome" "Sua Empresa" "Matriz"
```

## Método 2: API Protegida (Para criar clientes)

### 1. Endpoint para criar administradores

```http
POST /api/auth/create-admin
Authorization: Bearer <seu_token_superadmin>
Content-Type: application/json

{
  "email": "admin@cliente.com",
  "password": "senha123",
  "name": "João Silva",
  "businessName": "Barbearia do João",
  "branchName": "Matriz"
}
```

### 2. Exemplo com cURL

```bash
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cliente.com",
    "password": "senha123",
    "name": "João Silva",
    "businessName": "Barbearia do João",
    "branchName": "Matriz"
  }'
```

### 3. Obter token SuperAdmin

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@empresa.com",
  "password": "senha123"
}
```

## Fluxo Recomendado

1. **Você cria SuperAdmin** via script (apenas uma vez)
2. **Faz login** e obtém token JWT
3. **Usa API protegida** para criar administradores de clientes
4. **Clientes recebem credenciais** e fazem primeiro login
5. **Sistema detecta primeiro acesso** → Onboarding automático

## Segurança

- ✅ Endpoint protegido por SuperAdminGuard
- ✅ Apenas SuperAdmins podem criar administradores
- ✅ Token JWT validado em cada requisição
- ✅ Sem interface pública para criação
- ✅ Controle total via API