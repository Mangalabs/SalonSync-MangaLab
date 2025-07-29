# 💈 SalonSync

Sistema completo de gestão para barbearias e salões de beleza, desenvolvido com tecnologias modernas para otimizar operações e melhorar a experiência do cliente.

## 🚀 Tecnologias

### Backend
- **Node.js** + **TypeScript**
- **Prisma ORM** com PostgreSQL
- **Express.js** para API REST
- **JWT** para autenticação
- **Bcrypt** para criptografia

### Frontend
- **React** + **TypeScript**
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **React Query** para gerenciamento de estado
- **React Router** para navegação

## 🎨 Design System

### Paleta de Cores
```css
/* Cores principais */
--primary: #1A1A1A     /* Preto elegante */
--secondary: #D4AF37   /* Dourado clássico */
--accent: #8B4513      /* Marrom couro */
--background: #F5F5F0  /* Bege claro */
--text: #2C2C2C        /* Cinza escuro */
--muted: #737373       /* Cinza médio */
```

### Responsividade
- **Mobile First** com breakpoints otimizados
- **Grid responsivo** que se adapta a diferentes telas
- **Componentes flexíveis** para desktop e mobile

## 📁 Estrutura do Projeto

```
salonsync/
├── pjt-backend/                 # API Backend
│   ├── src/
│   │   ├── controllers/         # Controladores da API
│   │   ├── services/           # Lógica de negócio
│   │   ├── middleware/         # Middlewares
│   │   ├── routes/             # Rotas da API
│   │   └── prisma/             # Schema e migrações
│   └── package.json
│
├── pjt-frontend/               # Interface React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── ui/            # Componentes base (Shadcn)
│   │   │   ├── custom/        # Componentes específicos
│   │   │   ├── layout/        # Layout e navegação
│   │   │   └── pages/         # Páginas da aplicação
│   │   ├── contexts/          # Context API
│   │   ├── lib/               # Utilitários
│   │   └── styles/            # Estilos globais
│   └── package.json
│
└── README.md                   # Esta documentação
```

## 🔧 Configuração do Ambiente

### Pré-requisitos
- **Node.js** 18+ 
- **PostgreSQL** 14+
- **npm** ou **yarn**

### 1. Clone o repositório
```bash
git clone <repository-url>
cd salonsync
```

### 2. Backend Setup
```bash
cd pjt-backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrações
npx prisma migrate dev
npx prisma generate

# Iniciar servidor
npm run dev
```

### 3. Frontend Setup
```bash
cd pjt-frontend
npm install

# Iniciar aplicação
npm run dev
```

### 4. Variáveis de Ambiente

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/salonsync"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## 👥 Tipos de Usuário

### 🛡️ Administrador
- **Gestão completa** do sistema
- **Múltiplas filiais** e profissionais
- **Relatórios financeiros** e comissões
- **Configurações** avançadas

### 👨‍💼 Profissional
- **Dashboard personalizado** com métricas
- **Agendamentos** e atendimentos
- **Comissões** mensais e diárias
- **Gestão de clientes** e serviços

## 🏗️ Funcionalidades Principais

### 📅 Agendamentos
- **Calendário interativo** para visualização
- **Agendamento rápido** e imediato
- **Status tracking** (agendado, confirmado, concluído)
- **Notificações** automáticas

### 👥 Gestão de Clientes
- **Cadastro completo** de clientes
- **Histórico de atendimentos**
- **Preferências** e observações
- **Busca avançada**

### 💼 Serviços
- **Catálogo de serviços** por filial
- **Preços dinâmicos**
- **Categorização** e filtros
- **Serviços globais** vs específicos

### 💰 Financeiro
- **Receitas** diárias e mensais
- **Comissões** por profissional
- **Relatórios** detalhados
- **Métricas** de performance

### 📦 Estoque
- **Controle de produtos**
- **Movimentações** de entrada/saída
- **Alertas** de estoque baixo
- **Histórico** completo

## 🔐 Autenticação e Segurança

### Sistema de Autenticação
- **JWT Tokens** para sessões
- **Bcrypt** para hash de senhas
- **Middleware** de autorização
- **Roles** e permissões

### Segurança
- **Validação** de dados com Zod
- **Sanitização** de inputs
- **Rate limiting** nas APIs
- **CORS** configurado

## 📱 Componentes Principais

### Layout
```tsx
// Sidebar com navegação contextual
<Sidebar />

// Dashboard responsivo
<DashboardLayout />

// Header com branding
<Header />
```

### Formulários
```tsx
// Formulários com validação
<AppointmentForm />
<ClientForm />
<ServiceForm />
```

### Tabelas
```tsx
// Tabelas responsivas com ações
<ServiceTable />
<ClientTable />
<AppointmentTable />
```

## 🎯 Padrões de Desenvolvimento

### Estrutura de Componentes
```tsx
// Componente padrão
export function ComponentName() {
  // 1. Hooks e estado
  // 2. Queries e mutations
  // 3. Handlers
  // 4. Render
}
```

### Estilização
```tsx
// Cores inline com Tailwind
className="bg-[#1A1A1A] text-[#D4AF37]"

// Classes responsivas
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### API Calls
```tsx
// React Query para cache e sincronização
const { data, isLoading } = useQuery({
  queryKey: ['appointments'],
  queryFn: fetchAppointments
});
```

## 🚀 Deploy

### Backend
```bash
# Build
npm run build

# Produção
npm start
```

### Frontend
```bash
# Build
npm run build

# Preview
npm run preview
```

## 🤝 Contribuindo

### Workflow
1. **Fork** o repositório
2. **Clone** sua fork
3. **Branch** para feature: `git checkout -b feature/nova-funcionalidade`
4. **Commit** mudanças: `git commit -m 'feat: nova funcionalidade'`
5. **Push** para branch: `git push origin feature/nova-funcionalidade`
6. **Pull Request** para main

### Padrões de Commit
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

### Code Style
- **TypeScript** strict mode
- **ESLint** + **Prettier**
- **Componentes funcionais** com hooks
- **Nomes descritivos** para variáveis e funções

## 📊 Métricas e Analytics

### Dashboard Metrics
- **Receita** diária/mensal
- **Agendamentos** por período
- **Performance** por profissional
- **Comissões** detalhadas

### Relatórios
- **Financeiro** por filial
- **Produtividade** por profissional
- **Clientes** mais ativos
- **Serviços** mais procurados

## 🔄 Atualizações Futuras

### Roadmap
- [ ] **App Mobile** nativo
- [ ] **Notificações** push
- [ ] **Integração** com WhatsApp
- [ ] **Sistema** de fidelidade
- [ ] **Pagamentos** online
- [ ] **Multi-idioma**

## 📞 Suporte

### Documentação
- **API Docs**: `/api/docs`
- **Componentes**: Storybook (em desenvolvimento)
- **Database**: Schema Prisma

### Contato
- **Issues**: GitHub Issues
- **Discussões**: GitHub Discussions
- **Email**: suporte@salonsync.com

---

**SalonSync** - Transformando a gestão de salões e barbearias com tecnologia moderna e design elegante.