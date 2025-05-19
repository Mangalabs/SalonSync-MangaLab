![Node.js](https://img.shields.io/badge/NestJS-API-red?logo=nestjs&style=flat-square)
![React](https://img.shields.io/badge/React-Frontend-blue?logo=react&style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

# 💈 Projetinho - Sistema para Barbearias e Salões

Sistema fullstack para gestão de barbearias e salões de beleza, com funcionalidades como agendamento, controle de caixa, gestão de profissionais, controle de estoque e fidelização de clientes.

---

## 🚀 Tecnologias Utilizadas

### Frontend

* React + TypeScript
* Tailwind CSS v4
* ShadCN UI
* Vite
* React Router DOM
* React Query

### Backend

* Node.js com NestJS
* PostgreSQL
* Prisma ORM
* JWT para autenticação

---

## 📁 Estrutura de Pastas

```
projetinho/
├── backend/       # API NestJS + Prisma
│   ├── src/
│   └── prisma/
├── frontend/      # Interface React + Tailwind + ShadCN
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── .gitignore
├── README.md
└── progresso.md   # Documento técnico de evolução
```

---

## 📦 Instalação e Execução

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Endpoints Principais

* `POST /api/auth/login` → login de usuário
* `POST /api/auth/register` → registro de usuário
* `GET /api/professionals` → listar profissionais
* `POST /api/professionals` → criar profissional

---

## ✅ Funcionalidades Concluídas

* Autenticação JWT (login/registro)
* Estrutura com Sidebar protegida
* Cadastro de profissionais
* React Query para dados em tempo real

---

## 🛣️ Próximas Funcionalidades

* Cadastro e gestão de clientes
* Associação de serviços aos profissionais
* Agendamento com calendário
* Relatórios financeiros e controle de caixa
* Fidelização: cashback e pontos

---

## 📌 Observações

* Toda a API está sob o prefixo `/api`
* Prisma Client é gerado em `prisma/generated/client`
* Alias `@/` configurado no frontend para imports absolutos

---

Contribuições e sugestões são bem-vindas ✂️

