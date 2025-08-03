# 💈 SalonSync - Sistema de Gestão para Salões

Sistema completo de gestão para salões de beleza e barbearias, desenvolvido com tecnologias modernas.

## 🚀 Tecnologias

### Frontend
- **React + TypeScript** com Vite
- **Tailwind CSS** + Shadcn/ui
- **React Query** para estado
- **React Hook Form** + Zod

### Backend
- **NestJS + TypeScript**
- **Prisma ORM** + PostgreSQL
- **JWT** para autenticação
- **Swagger** para documentação

## ✨ Funcionalidades

### 🎯 Core Features
- ✅ **Autenticação** completa com JWT
- ✅ **Dashboard** responsivo com métricas
- ✅ **Multi-filial** com isolamento de dados
- ✅ **Sistema de agendamentos** com calendário
- ✅ **Gestão de profissionais** com funções customizadas
- ✅ **Catálogo de serviços** por filial
- ✅ **Cadastro de clientes** com histórico
- ✅ **Relatórios de comissão** detalhados
- ✅ **Controle de estoque** básico

### 🆕 Recém Implementado
- ✅ **Sistema de Funções** customizadas com comissões
- ✅ **Edição de profissionais** com seleção de roles
- ✅ **API completa** para gestão de funções
- ✅ **Interface visual** diferenciada por tipo de função

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
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

## 🎨 Design System

### Paleta de Cores
- **#1A1A1A** - Preto elegante (títulos, sidebar)
- **#D4AF37** - Dourado (valores, botões principais)
- **#8B4513** - Marrom couro (botão atendimento)
- **#F5F5F0** - Bege claro (background)
- **#737373** - Cinza médio (texto secundário)

## 📚 Documentação

- [**📋 README Principal**](./docs/README.md) - Visão geral completa
- [**🔧 API Reference**](./docs/API.md) - Documentação da API
- [**🛠️ Development Guide**](./docs/DEVELOPMENT.md) - Guia para desenvolvedores
- [**📋 Changelog**](./docs/CHANGELOG.md) - Histórico de mudanças

## 🔧 Configuração

### Variáveis de Ambiente

**Backend (.env)**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/salonsync"
JWT_SECRET="your-secret-key"
PORT=3000
```

**Frontend (.env)**:
```env
VITE_API_URL="http://localhost:3000"
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma feature branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

Veja o [Development Guide](./docs/DEVELOPMENT.md) para mais detalhes.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🏆 Créditos

Desenvolvido com ❤️ para modernizar a gestão de salões de beleza e barbearias.

---

**SalonSync** - Transformando a gestão de salões com tecnologia moderna! 💈✨