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

## ✅ Funcionalidades já implementadas

### 🔐 Autenticação

* Cadastro e login de usuários com email/senha
* Proteção de rotas usando `PrivateRoute`
* Token JWT armazenado no `localStorage`

### 📊 Dashboard (admin)

* Layout com Sidebar fixa e rotas protegidas
* Logout integrado na Sidebar

### 👥 Profissionais

* CRUD de profissionais no backend (NestJS + Prisma)
* Listagem de profissionais no frontend (React Query)
* Modal de criação/edição com validação (Zod + React Hook Form)

### 📝 Serviços

* CRUD de serviços no backend
* Listagem de serviços no frontend
* Modal de criação/edição de serviço com validação

### 📅 Atendimentos

* Página de listagem de atendimentos do dia
* Botão "Novo Atendimento" destacado na Sidebar
* Modal de "Finalizar Atendimento" com formulário:
  - Seleção de profissional
  - Seleção de cliente (com link para cadastro)
  - Seleção de serviços (checkboxes) e cálculo automático do total
* Persistência de atendimentos via API e atualização em tempo real

---

## 🧭 Direcionamento do Projeto

O sistema será voltado para **barbearias e salões de beleza**, com foco em resolver problemas reais de gestão e atendimento.

### 1. Agendamento com Fidelidade e Cashback
### 2. Controle Financeiro / Caixa Diário
### 3. Gestão de Comissão de Profissionais
### 4. Controle de Estoque com Alerta
### 5. Fila Virtual
### 6. Catálogo Interativo de Cortes + Portfólio
### 7. Painel Administrativo

Futuro:

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

* Associação de serviços a profissionais (multi-select)
* Controle de comissão de profissionais baseado em atendimentos
* Integração do calendário no módulo de agendamentos
* Dashboard financeiro com relatórios de caixa e comissão

