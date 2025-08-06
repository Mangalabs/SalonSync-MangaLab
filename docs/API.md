# 🔧 API Reference - SalonSync

Documentação completa da API REST do SalonSync.

## 🔐 Autenticação

Todas as rotas (exceto login/register) requerem token JWT no header:
```
Authorization: Bearer <token>
```

### Auth Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@salon.com",
  "password": "senha123"
}
```

#### Criar Funcionário
```http
POST /api/auth/create-employee
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@salon.com", 
  "password": "senha123",
  "role": "Barbeiro Senior",
  "roleId": "uuid-da-role",
  "commissionRate": 15,
  "branchId": "uuid-da-filial"
}
```

## 👥 Profissionais

#### Listar Profissionais
```http
GET /api/professionals
```

#### Criar Profissional
```http
POST /api/professionals
Content-Type: application/json

{
  "name": "Maria Santos",
  "role": "Manicure",
  "commissionRate": 10
}
```

#### Atualizar Profissional
```http
PATCH /api/professionals/:id
Content-Type: application/json

{
  "name": "Maria Santos Silva",
  "roleId": "uuid-da-role",
  "commissionRate": 12
}
```

#### Calcular Comissão
```http
GET /api/professionals/:id/commission?startDate=2024-01-01&endDate=2024-01-31
```

## 🎯 Funções (Roles)

#### Listar Funções
```http
GET /api/roles
```

#### Criar Função
```http
POST /api/roles
Content-Type: application/json

{
  "title": "Barbeiro Senior",
  "commissionRate": 15
}
```

#### Atualizar Função
```http
PATCH /api/roles/:id
Content-Type: application/json

{
  "title": "Barbeiro Master",
  "commissionRate": 20
}
```

#### Deletar Função
```http
DELETE /api/roles/:id
```

## 💼 Serviços

#### Listar Serviços
```http
GET /api/services
```

#### Criar Serviço
```http
POST /api/services
Content-Type: application/json

{
  "name": "Corte Masculino",
  "price": 25.00
}
```

## 👤 Clientes

#### Listar Clientes
```http
GET /api/clients
```

#### Criar Cliente
```http
POST /api/clients
Content-Type: application/json

{
  "name": "Carlos Silva",
  "phone": "(11) 99999-9999",
  "email": "carlos@email.com"
}
```

## 📅 Agendamentos

#### Listar Agendamentos
```http
GET /api/appointments
```

#### Criar Agendamento
```http
POST /api/appointments
Content-Type: application/json

{
  "clientId": "uuid-do-cliente",
  "professionalId": "uuid-do-profissional",
  "serviceIds": ["uuid-servico-1", "uuid-servico-2"],
  "scheduledAt": "2024-01-15T14:30:00Z"
}
```

#### Confirmar Agendamento
```http
POST /api/appointments/:id/confirm
```

#### Cancelar Agendamento
```http
POST /api/appointments/:id/cancel
```

## 🏢 Filiais

#### Listar Filiais
```http
GET /api/branches
```

## 📦 Produtos (Estoque)

#### Listar Produtos
```http
GET /api/products
```

#### Criar Produto
```http
POST /api/products
Content-Type: application/json

{
  "name": "Shampoo Profissional",
  "sku": "SH001",
  "costPrice": 15.00,
  "salePrice": 25.00,
  "currentStock": 50,
  "minStock": 10
}
```

#### Ajustar Estoque
```http
POST /api/products/:id/adjust
Content-Type: application/json

{
  "quantity": 10,
  "type": "ADD",
  "reason": "Compra de estoque"
}
```

## 📊 Relatórios

#### Dashboard
```http
GET /api/dashboard
```

#### Movimentações de Estoque
```http
GET /api/inventory/movements
```

## 🔒 Isolamento de Dados

Todos os dados são automaticamente isolados por:
- **Usuário ADMIN**: Acesso às suas filiais
- **Usuário PROFESSIONAL**: Acesso apenas à sua filial
- **branchId**: Sempre validado nas operações

## 📝 Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `500` - Erro interno

## 🔄 Formato de Resposta

### Sucesso
```json
{
  "id": "uuid",
  "name": "Nome do Item",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Erro
```json
{
  "message": "Descrição do erro",
  "error": "Bad Request",
  "statusCode": 400
}
```

## 🧪 Exemplos de Uso

### Fluxo Completo: Criar Funcionário com Função

1. **Criar função customizada**:
```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Barbeiro Senior", "commissionRate": 15}'
```

2. **Criar funcionário com a função**:
```bash
curl -X POST http://localhost:3000/api/auth/create-employee \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@salon.com",
    "password": "senha123", 
    "roleId": "uuid-da-role-criada",
    "branchId": "uuid-da-filial"
  }'
```

### Calcular Comissões do Mês
```bash
curl "http://localhost:3000/api/professionals/uuid-profissional/commission?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

## 🔧 Desenvolvimento

### Swagger UI
Acesse `http://localhost:3000/api` para documentação interativa.

### Postman Collection
Importe a collection disponível em `/docs/postman/`.