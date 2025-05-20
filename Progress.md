# 📘 progresso.md - Projeto "Projetinho"

Registro técnico de desenvolvimento e decisões do sistema de gestão para barbearias e salões de beleza.

---

## 📅 Etapas concluídas

### ✅ Autenticação

* Rota de login e registro criadas no backend
* JWT implementado
* Validação com Zod no frontend
* Redirecionamento após login
* Token salvo no `localStorage`

### ✅ Estrutura de layout

* Sidebar criada com navegação protegida
* Rotas estruturadas com React Router DOM
* Dashboard inicial criado

### ✅ Módulo de Profissionais

* Tabela com listagem via React Query
* Cadastro de novos profissionais
* Backend com módulo e service dedicado
* Associação de profissionais a serviços prevista

### ✅ Módulo de Serviços

* Listagem de serviços via React Query
* Cadastro com nome e preço
* Campos `description` e `durationMin` removidos do schema
* Padronização de chamadas com `axios` (baseURL definida)
* `ServiceForm` e `ServiceTable` isolados como componentes

### ✅ Sidebar com botão de logout

* Botão "Sair" posicionado corretamente na parte inferior
* Evita scroll extra com uso de `flex-grow` e `overflow-y-auto`
* Corrigido comportamento de conteúdo ultrapassando altura da tela

---

## 🔄 Alterações técnicas

* Atualização do `schema.prisma` (remoção de campos obsoletos)
* `prisma generate` com output manual em `prisma/generated/client`
* Remoção de tipagem explícita com `Service` para evitar conflito
* Correção de acessibilidade em modais (`DialogDescription`)

---

## 🔜 Próximas etapas

### 🧩 Módulo de Atendimentos (próximo foco)

* Registro de atendimento: seleção de profissional e serviço
* Geração de valor a pagar
* Base para cálculo de comissão

### 🧩 Clientes

* Cadastro e listagem básica de clientes

---

## 🔧 Observações e práticas adotadas

* Imports absolutos com alias `@/`
* Separação de UI (`components/ui`) e lógicas (`components/custom`)
* Validação com Zod + RHF
* Controle de sessão com token JWT

---

Documento atualizado em tempo real conforme evolução do projeto ✂️

