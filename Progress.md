# 📘 Documentação Técnica do Projeto Fullstack

## 🛠️ Stack Utilizada

### Frontend

* **React + TypeScript**
* **Tailwind CSS v4** (com @tailwindcss/vite plugin)
* **ShadCN UI**
* **Vite**
* **React Router DOM** (para rotas)
* **React Query**

### Backend

* **Node.js com NestJS**
* **Prisma ORM**
* **PostgreSQL**
* **JWT para autenticação**
* **@nestjs/config** para variáveis de ambiente

---

## 📂 Estrutura de Pastas

```
meu-projeto/
├── backend/        ← API NestJS + Prisma
│   ├── src/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── professionals/
│   │   ├── prisma/
│   │   └── main.ts
│   └── prisma/
│       ├── schema.prisma
│       └── generated/
│           └── client/
├── frontend/       ← Interface React com Tailwind e ShadCN
│   ├── components/
│   │   ├── custom/
│   │   │   ├── ProfessionalForm.tsx
│   │   │   └── ProfessionalTable.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── DashboardLayout.tsx
│   ├── lib/
│   │   └── PrivateRoute.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   └── Professionals.tsx
│   ├── App.tsx
│   └── main.tsx
```

---

## ✅ Funcionalidades já implementadas

### 🔐 Autenticação

* Cadastro e login de usuários com email/senha
* Proteção de rotas usando `PrivateRoute`
* Token JWT armazenado no `localStorage`

### 📊 Dashboard (admin)

* Estrutura de layout com Sidebar fixa
* Remoção do Header: logout integrado à Sidebar
* Sidebar visível apenas em rotas protegidas

### 👥 Profissionais

* CRUD de profissionais no backend
* Tela de listagem no frontend com React Query
* Formulário modal de criação com validação (Zod + RHF)
* Requisições para `/api/professionals`
* Exibição dinâmica dos dados

---

## 🧭 Direcionamento do Projeto

O sistema será voltado para **barbearias e salões de beleza**, com foco em resolver problemas reais de gestão e atendimento. A seguir, os principais módulos:

### 1. Agendamento com Fidelidade e Cashback

### 2. Controle Financeiro / Caixa Diário

### 3. Gestão de Comissão de Profissionais

### 4. Controle de Estoque com Alerta

### 5. Fila Virtual

### 6. Catálogo Interativo de Cortes + Portfólio

### 7. Painel Administrativo

### Futuro:

* App mobile
* Integração com WhatsApp API

---

## 🎯 MVP Inicial sugerido

* Cadastro/login de usuários
* Agendamento simples com horários e profissionais
* Dashboard com caixa básico
* Cadastro de serviços
* Comissão básica por serviço

---

## 🔄 Próximos Passos

* Tela de associação de serviços a profissionais (multi-select)
* Implementar cadastro de clientes
* Tela de agendamentos com calendário/lista

---

## 🧠 Observações Técnicas

* Prisma Client gerado em `prisma/generated/client` e importado via caminho relativo
* Prefixo global da API: `/api`
* Todos os endpoints seguem estrutura REST (`/api/professionals`, `/api/auth/login`, etc.)
* Sidebar encapsulada em layout protegido (`DashboardLayout`)
* Frontend usa aliases absolutos com `@/`
* React Query utilizado para cache, loading e reatividade de dados

---

Este documento será mantido atualizado conforme novas etapas forem concluídas.

