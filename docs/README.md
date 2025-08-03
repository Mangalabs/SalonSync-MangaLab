# 📋 SalonSync - Sistema de Gestão para Salões

Sistema completo de gestão para salões de beleza e barbearias, desenvolvido com React + NestJS.

## 🚀 Stack Tecnológica

### Frontend
- **React + TypeScript** com Vite
- **Tailwind CSS** com design system customizado
- **Shadcn/ui** para componentes base
- **React Query** para gerenciamento de estado
- **React Hook Form + Zod** para formulários

### Backend
- **NestJS + TypeScript**
- **Prisma ORM** com PostgreSQL
- **JWT** para autenticação
- **Swagger** para documentação da API

## 🎯 Funcionalidades Principais

### ✅ Implementadas
- **Autenticação** completa com JWT
- **Dashboard** responsivo com métricas
- **Gestão de Profissionais** com funções customizadas
- **Catálogo de Serviços** por filial
- **Cadastro de Clientes** com histórico
- **Sistema de Agendamentos** com calendário
- **Controle de Atendimentos** realizados
- **Sistema de Comissões** por profissional
- **Relatórios Financeiros** com filtros
- **Multi-filial** com isolamento de dados
- **Controle de Estoque** básico

### 🔄 Em Desenvolvimento
- **Sistema de Funções** customizadas (backend implementado)
- **Relatórios Avançados** com gráficos
- **Notificações** e lembretes
- **App Mobile** (PWA)

## 🎨 Design System

### Paleta de Cores
```css
#1A1A1A  /* Preto elegante - títulos, sidebar */
#D4AF37  /* Dourado - valores, botões principais */
#8B4513  /* Marrom couro - botão atendimento */
#F5F5F0  /* Bege claro - background */
#737373  /* Cinza médio - texto secundário */
```

### Componentes
- Interface responsiva mobile-first
- Componentes reutilizáveis com Shadcn/ui
- Cores inline com Tailwind CSS
- Tipografia consistente

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- npm ou yarn

### Backend
```bash
cd pjt-backend
npm install
cp .env.example .env
# Configure DATABASE_URL no .env
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd pjt-frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
projetinho/
├── pjt-backend/          # API NestJS
│   ├── src/
│   │   ├── auth/         # Autenticação
│   │   ├── professionals/ # Gestão de profissionais
│   │   ├── services/     # Catálogo de serviços
│   │   ├── appointments/ # Agendamentos
│   │   ├── roles/        # Sistema de funções
│   │   └── ...
│   └── prisma/           # Schema e migrações
├── pjt-frontend/         # Interface React
│   └── src/
│       ├── components/   # Componentes UI
│       ├── pages/        # Páginas da aplicação
│       ├── contexts/     # Contextos React
│       └── lib/          # Utilitários
└── docs/                 # Documentação
```

## 🔧 Configuração

### Variáveis de Ambiente (Backend)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/salonsync"
JWT_SECRET="your-secret-key"
PORT=3000
```

### Variáveis de Ambiente (Frontend)
```env
VITE_API_URL="http://localhost:3000"
```

## 📚 Documentação Adicional

- [**API Reference**](./API.md) - Documentação completa da API
- [**Development Guide**](./DEVELOPMENT.md) - Guia para desenvolvedores
- [**Deployment**](./DEPLOYMENT.md) - Instruções de deploy

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](../LICENSE) para detalhes.

## 🏆 Créditos

Desenvolvido com ❤️ para modernizar a gestão de salões de beleza e barbearias.