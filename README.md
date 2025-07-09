![Node.js](https://img.shields.io/badge/NestJS-API-red?logo=nestjs&style=flat-square)
![React](https://img.shields.io/badge/React-Frontend-blue?logo=react&style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

# 💈 Projetinho - Sistema para Barbearias e Salões

Sistema fullstack completo para gestão de barbearias e salões de beleza, com foco em organização de atendimentos, controle de agendamentos e facilidade no cálculo de comissões.

---

## 🚀 Tecnologias Utilizadas

### Frontend
* **React + TypeScript** - Interface moderna e tipada
* **Tailwind CSS v4** - Estilização utilitária
* **ShadCN UI** - Componentes acessíveis
* **Vite** - Build tool rápido
* **React Router DOM** - Roteamento
* **React Query** - Gerenciamento de estado servidor

### Backend
* **Node.js + NestJS** - Framework escalável
* **PostgreSQL** - Banco de dados relacional
* **Prisma ORM** - Type-safe database access
* **JWT** - Autenticação segura

---

## 📁 Estrutura do Projeto

```
projetinho/
├── pjt-backend/           # API NestJS + Prisma
│   ├── src/
│   │   ├── auth/          # Autenticação JWT
│   │   ├── professionals/ # Gestão de profissionais
│   │   ├── services/      # Gestão de serviços
│   │   ├── clients/       # Gestão de clientes
│   │   └── appointments/  # Sistema de agendamentos
│   └── prisma/
│       ├── schema.prisma  # Schema do banco
│       └── migrations/    # Migrações
├── pjt-frontend/          # Interface React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   └── lib/           # Utilitários
├── README.md
└── Progress.md            # Documentação técnica
```

---

## 📦 Instalação e Execução

### Pré-requisitos
* Node.js 18+
* PostgreSQL
* npm ou yarn

### Backend
```bash
cd pjt-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run seed              # Dados de teste (opcional)
npm run start:dev
```

### Frontend
```bash
cd pjt-frontend
npm install
npm run dev
```

**Acesso:** http://localhost:5173

---

## ✨ Funcionalidades Implementadas

### 🔐 **Autenticação**
* Login/registro com JWT
* Rotas protegidas
* Logout seguro

### 👥 **Gestão de Profissionais**
* CRUD completo (criar, listar, editar, excluir)
* Validação de exclusão (não permite se houver agendamentos)
* Interface responsiva com modais

### 💼 **Gestão de Serviços**
* CRUD completo com preços
* Formatação monetária
* Validação de integridade

### 👤 **Gestão de Clientes**
* CRUD completo
* Campos opcionais (telefone, email)
* Interface em cards

### 📅 **Sistema de Agendamentos**

#### **Novo Atendimento** (Serviços já realizados)
* Modal na sidebar
* Registro direto como COMPLETED
* Vai direto para "Atendimentos do Dia"

#### **Novo Agendamento** (Agendamentos futuros)
* Modal no dashboard
* Status SCHEDULED
* Sistema de horários disponíveis
* Validação de conflitos

#### **Confirmação de Agendamentos**
* **Futuros**: Botão "Cancelar"
* **Passados**: "Confirmar" ou "Não Compareceu"
* Conversão automática: SCHEDULED → COMPLETED

### 🗂️ **Organização "Gaveta Digital"**
* Atendimentos agrupados por profissional
* Separação por mês (facilita cálculo de comissões)
* Interface expansível
* **Filtros avançados**: Data, profissional, cliente, serviço

### 📊 **Dashboard Intuitivo**
* **Card Agendamentos**: Todos os SCHEDULED com ações dinâmicas
* **Card Atendimentos do Dia**: COMPLETED de hoje
* Interface responsiva
* Cores intuitivas (amarelo = pendente, verde = realizado)

---

## 🔗 API Endpoints

### Autenticação
* `POST /api/auth/login` - Login
* `POST /api/auth/register` - Registro

### Profissionais
* `GET /api/professionals` - Listar
* `POST /api/professionals` - Criar
* `PATCH /api/professionals/:id` - Editar
* `DELETE /api/professionals/:id` - Excluir

### Serviços
* `GET /api/services` - Listar
* `POST /api/services` - Criar
* `PATCH /api/services/:id` - Editar
* `DELETE /api/services/:id` - Excluir

### Clientes
* `GET /api/clients` - Listar
* `POST /api/clients` - Criar
* `PATCH /api/clients/:id` - Editar
* `DELETE /api/clients/:id` - Excluir

### Agendamentos
* `GET /api/appointments` - Listar
* `POST /api/appointments` - Criar
* `POST /api/appointments/:id/confirm` - Confirmar
* `POST /api/appointments/:id/cancel` - Cancelar
* `GET /api/appointments/available-slots/:professionalId/:date` - Horários disponíveis

---

## 🎯 Próximas Funcionalidades (Roadmap)

### **FASE 2** - Funcionalidades de Negócio
* Sistema de comissões por profissional
* Relatórios financeiros
* Controle de estoque básico

### **FASE 3** - Funcionalidades Avançadas
* Sistema de fidelidade
* Notificações e lembretes
* Analytics avançado

### **FASE 4** - Funcionalidades Premium
* Integração WhatsApp
* App Mobile (PWA)
* Catálogo de serviços

---

## 🛠️ Dados de Teste

Após executar `npm run seed` no backend:

**Login:** admin@teste.com  
**Senha:** 123456

**Dados criados:**
* 2 Profissionais (João Silva, Maria Santos)
* 3 Serviços (Corte Masculino, Barba, Corte Feminino)
* 2 Clientes (Pedro Oliveira, Ana Costa)

---

## 📌 Observações Técnicas

* API sob prefixo `/api`
* Prisma Client gerado automaticamente
* Alias `@/` configurado para imports absolutos
* Timezone configurado para America/Sao_Paulo
* Validação de integridade referencial
* Cache inteligente com React Query

---

