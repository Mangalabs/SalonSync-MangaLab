# 🛠️ Development Guide - SalonSync

Guia completo para desenvolvedores contribuindo com o SalonSync.

## 🚀 Setup do Ambiente

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Git
- VS Code (recomendado)

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd salonsync

# Backend
cd pjt-backend
npm install
cp .env.example .env
# Configure DATABASE_URL no .env
npx prisma migrate dev
npm run start:dev

# Frontend (novo terminal)
cd pjt-frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

### Backend (NestJS)
```
pjt-backend/
├── src/
│   ├── auth/              # Autenticação JWT
│   ├── professionals/     # Gestão de profissionais
│   ├── services/          # Catálogo de serviços
│   ├── clients/           # Cadastro de clientes
│   ├── appointments/      # Sistema de agendamentos
│   ├── roles/             # Funções customizadas
│   ├── branches/          # Multi-filial
│   ├── products/          # Controle de estoque
│   ├── common/            # Middlewares e utilitários
│   └── prisma/            # Configuração do Prisma
├── prisma/
│   ├── schema.prisma      # Schema do banco
│   └── migrations/        # Migrações
└── test/                  # Testes E2E
```

### Frontend (React)
```
pjt-frontend/
├── src/
│   ├── components/
│   │   ├── ui/            # Componentes base (Shadcn)
│   │   └── custom/        # Componentes específicos
│   ├── pages/             # Páginas da aplicação
│   ├── contexts/          # Contextos React
│   ├── hooks/             # Hooks customizados
│   ├── lib/               # Utilitários e configurações
│   └── styles/            # Estilos globais
└── public/                # Assets estáticos
```

## 🎨 Design System

### Paleta de Cores
```typescript
// Use sempre essas cores
const colors = {
  primary: '#1A1A1A',      // Preto elegante
  accent: '#D4AF37',       // Dourado
  secondary: '#8B4513',    // Marrom couro
  background: '#F5F5F0',   // Bege claro
  text: '#2C2C2C',         // Cinza escuro
  muted: '#737373',        // Cinza médio
};
```

### Componentes
```tsx
// ✅ Use componentes do Shadcn
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ✅ Componentes customizados
import { ServiceTable } from "@/components/custom/ServiceTable";

// ✅ Cores inline com Tailwind
className="bg-[#1A1A1A] text-[#D4AF37]"
```

## 📝 Padrões de Código

### TypeScript
```typescript
// ✅ Interfaces bem definidas
interface Professional {
  id: string;
  name: string;
  role: string;
  commissionRate: number;
  branchId: string;
}

// ✅ Tipos para props
interface ProfessionalFormProps {
  onSuccess: () => void;
  initialData?: Professional | null;
}

// ❌ Evitar any
const data: any = {};
```

### React Components
```tsx
// ✅ Estrutura padrão
export function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks e estado
  const [state, setState] = useState();
  
  // 2. Queries e mutations
  const { data, isLoading } = useQuery({
    queryKey: ['key'],
    queryFn: fetchData
  });
  
  // 3. Handlers
  const handleSubmit = useCallback(() => {
    // lógica
  }, []);
  
  // 4. Early returns
  if (isLoading) return <div>Loading...</div>;
  
  // 5. Render principal
  return (
    <div className="space-y-4">
      {/* conteúdo */}
    </div>
  );
}
```

### Backend Controllers
```typescript
// ✅ Estrutura padrão
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly service: ProfessionalsService) {}

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.service.findAll({
      id: req.user.id,
      role: req.user.role,
      branchId: req.user.branchId,
    });
  }

  @Post()
  async create(@Body() dto: CreateProfessionalDto, @Request() req) {
    return this.service.create(dto, req.user);
  }
}
```

## 🔧 Ferramentas de Desenvolvimento

### VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "Prisma.prisma"
  ]
}
```

### Scripts Úteis
```bash
# Backend
npm run start:dev      # Desenvolvimento com hot reload
npm run build          # Build para produção
npm run test           # Testes unitários
npm run test:e2e       # Testes E2E
npx prisma studio      # Interface visual do banco

# Frontend
npm run dev            # Desenvolvimento
npm run build          # Build para produção
npm run preview        # Preview do build
npm run lint           # Linting
```

## 🗄️ Banco de Dados

### Schema Principal
```prisma
model User {
  id           String @id @default(uuid())
  email        String @unique
  name         String
  role         String @default("ADMIN")
  branches     Branch[]
  roles        Role[]
}

model Role {
  id             String @id @default(uuid())
  title          String
  commissionRate Decimal @default(0)
  branchId       String
  branch         Branch @relation(fields: [branchId], references: [id])
  professionals  Professional[]
}

model Professional {
  id             String @id @default(uuid())
  name           String
  role           String
  commissionRate Decimal @default(0)
  roleId         String?
  customRole     Role? @relation(fields: [roleId], references: [id])
  branchId       String
  branch         Branch @relation(fields: [branchId], references: [id])
}
```

### Migrações
```bash
# Criar nova migração
npx prisma migrate dev --name add_new_feature

# Reset do banco (desenvolvimento)
npx prisma migrate reset

# Deploy em produção
npx prisma migrate deploy
```

## 🧪 Testes

### Frontend (React Testing Library)
```tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfessionalTable } from './ProfessionalTable';

test('renders professional table', () => {
  const queryClient = new QueryClient();
  
  render(
    <QueryClientProvider client={queryClient}>
      <ProfessionalTable />
    </QueryClientProvider>
  );
  
  expect(screen.getByText('Profissionais')).toBeInTheDocument();
});
```

### Backend (Jest)
```typescript
describe('ProfessionalsController', () => {
  let controller: ProfessionalsController;
  let service: ProfessionalsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProfessionalsController],
      providers: [ProfessionalsService],
    }).compile();

    controller = module.get<ProfessionalsController>(ProfessionalsController);
  });

  it('should return professionals', async () => {
    const result = await controller.findAll(mockRequest);
    expect(result).toBeDefined();
  });
});
```

## 🔄 Git Workflow

### Branch Strategy
```bash
# Feature branch
git checkout -b feature/custom-roles
git commit -m "feat: add custom roles system"
git push origin feature/custom-roles

# Bug fix
git checkout -b fix/commission-calculation
git commit -m "fix: correct commission calculation"
```

### Commit Messages
```bash
# Tipos de commit
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas de manutenção

# Exemplos
git commit -m "feat: add role selection in professional form"
git commit -m "fix: resolve infinite loading in commission cards"
git commit -m "docs: update API documentation"
```

## 🚀 Deploy

### Variáveis de Ambiente

#### Produção (Backend)
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="super-secure-secret"
PORT=3000
```

#### Produção (Frontend)
```env
VITE_API_URL="https://api.salonsync.com"
```

### Build Commands
```bash
# Backend
npm run build
npm run start:prod

# Frontend
npm run build
# Servir pasta dist/ com nginx/apache
```

## 🔍 Debugging

### Backend
```typescript
// Logger personalizado
import { Logger } from '@nestjs/common';

export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  async findAll() {
    this.logger.log('Finding all professionals');
    // lógica
  }
}
```

### Frontend
```tsx
// React Query Devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

## 📚 Recursos Úteis

### Documentação
- [NestJS](https://nestjs.com/)
- [Prisma](https://prisma.io/)
- [React Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)

### Ferramentas
- **Postman** - Testar APIs
- **Prisma Studio** - Visualizar banco
- **React DevTools** - Debug React
- **Redux DevTools** - Debug estado

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma feature branch
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### Checklist do PR
- [ ] Código testado localmente
- [ ] Lint sem erros
- [ ] Build funcionando
- [ ] Documentação atualizada
- [ ] Testes passando

## 🆘 Problemas Comuns

### "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql start

# Verificar conexão
psql -h localhost -U postgres -d salonsync
```

### "Module not found"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### "Prisma Client out of sync"
```bash
# Regenerar cliente
npx prisma generate
```