# 🤝 Guia de Contribuição - SalonSync

Obrigado por considerar contribuir com o SalonSync! Este guia ajudará você a começar rapidamente.

## 🚀 Começando

### 1. Setup do Ambiente
```bash
# Clone o repositório
git clone <repository-url>
cd salonsync

# Backend
cd pjt-backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev

# Frontend (novo terminal)
cd pjt-frontend
npm install
npm run dev
```

### 2. Estrutura de Branches
- **main**: Código de produção
- **develop**: Desenvolvimento ativo
- **feature/**: Novas funcionalidades
- **fix/**: Correções de bugs
- **docs/**: Documentação

## 📝 Padrões de Código

### TypeScript
```typescript
// ✅ Bom
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Evitar
const user: any = {};
```

### React Components
```tsx
// ✅ Estrutura padrão
export function ComponentName() {
  // 1. Hooks e estado
  const [state, setState] = useState();
  
  // 2. Queries e mutations
  const { data } = useQuery();
  
  // 3. Handlers
  const handleClick = () => {};
  
  // 4. Render
  return <div>...</div>;
}
```

### Estilização
```tsx
// ✅ Cores da paleta
className="bg-[#1A1A1A] text-[#D4AF37]"

// ✅ Responsivo
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// ❌ Evitar cores hardcoded
className="bg-red-500"
```

## 🎨 Design System

### Paleta de Cores
```css
/* Use sempre essas cores */
#1A1A1A  /* Preto elegante - títulos, sidebar */
#D4AF37  /* Dourado - valores, botões principais */
#8B4513  /* Marrom couro - botão atendimento */
#F5F5F0  /* Bege claro - background */
#2C2C2C  /* Cinza escuro - texto principal */
#737373  /* Cinza médio - texto secundário */
```

### Componentes
```tsx
// ✅ Use componentes do Shadcn
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ✅ Componentes customizados em /custom
import { ServiceTable } from "@/components/custom/ServiceTable";
```

## 🔧 Desenvolvimento

### Backend (API)
```typescript
// ✅ Estrutura de controller
export const createService = async (req: Request, res: Response) => {
  try {
    // Validação
    const data = serviceSchema.parse(req.body);
    
    // Lógica de negócio
    const service = await serviceService.create(data);
    
    // Resposta
    res.status(201).json(service);
  } catch (error) {
    handleError(error, res);
  }
};
```

### Frontend (React)
```tsx
// ✅ Queries com React Query
const { data: services, isLoading } = useQuery({
  queryKey: ['services'],
  queryFn: fetchServices
});

// ✅ Mutations
const createService = useMutation({
  mutationFn: (data) => api.post('/services', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['services']);
    toast.success('Serviço criado!');
  }
});
```

## 📋 Checklist de PR

### Antes de enviar
- [ ] **Código** testado localmente
- [ ] **Lint** sem erros (`npm run lint`)
- [ ] **Build** funcionando (`npm run build`)
- [ ] **Responsividade** testada
- [ ] **Cores** da paleta aplicadas
- [ ] **TypeScript** sem erros

### Descrição do PR
```markdown
## 🎯 Objetivo
Breve descrição da mudança

## 🔧 Mudanças
- [ ] Nova funcionalidade X
- [ ] Correção do bug Y
- [ ] Melhoria na performance Z

## 📱 Screenshots
(Se aplicável)

## 🧪 Como testar
1. Passo 1
2. Passo 2
3. Resultado esperado
```

## 🐛 Reportando Bugs

### Template de Issue
```markdown
## 🐛 Descrição do Bug
Descrição clara do problema

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

## 💻 Ambiente
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/Safari]
- Versão: [v1.0.0]

## 📱 Screenshots
(Se aplicável)
```

## ✨ Sugerindo Features

### Template de Feature Request
```markdown
## 🚀 Feature Request
Descrição da funcionalidade

## 🎯 Problema
Que problema isso resolve?

## 💡 Solução Proposta
Como você imagina que funcione?

## 🔄 Alternativas
Outras formas de resolver?
```

## 📁 Estrutura de Arquivos

### Novos Componentes
```
src/components/
├── ui/              # Componentes base (Shadcn)
├── custom/          # Componentes específicos
│   ├── forms/       # Formulários
│   ├── tables/      # Tabelas
│   └── charts/      # Gráficos
├── layout/          # Layout e navegação
└── pages/           # Páginas
```

### Naming Convention
```
// ✅ Componentes
PascalCase: UserProfile.tsx

// ✅ Hooks
camelCase: useUserData.ts

// ✅ Utilitários
camelCase: formatCurrency.ts

// ✅ Constantes
UPPER_CASE: API_ENDPOINTS.ts
```

## 🧪 Testes

### Frontend
```tsx
// ✅ Testes de componente
import { render, screen } from '@testing-library/react';
import { ServiceTable } from './ServiceTable';

test('renders service table', () => {
  render(<ServiceTable />);
  expect(screen.getByText('Serviços')).toBeInTheDocument();
});
```

### Backend
```typescript
// ✅ Testes de API
describe('Services API', () => {
  test('should create service', async () => {
    const response = await request(app)
      .post('/api/services')
      .send(mockService);
    
    expect(response.status).toBe(201);
  });
});
```

## 📚 Recursos Úteis

### Documentação
- [React Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn/ui](https://ui.shadcn.com)
- [Prisma](https://prisma.io)

### Ferramentas
- **VS Code** com extensões React/TypeScript
- **Postman** para testar APIs
- **React DevTools** para debug
- **Prisma Studio** para database

## 🎯 Áreas que Precisam de Ajuda

### Frontend
- [ ] **Testes** unitários e integração
- [ ] **Acessibilidade** (ARIA labels)
- [ ] **Performance** otimizações
- [ ] **PWA** features

### Backend
- [ ] **Documentação** da API
- [ ] **Rate limiting** implementação
- [ ] **Logs** estruturados
- [ ] **Cache** estratégias

### Design
- [ ] **Componentes** novos
- [ ] **Animações** micro-interações
- [ ] **Dark mode** suporte
- [ ] **Iconografia** consistente

## 🏆 Reconhecimento

Contribuidores são reconhecidos em:
- **README.md** principal
- **CHANGELOG.md** nas releases
- **GitHub** contributors page

## 📞 Dúvidas?

- **GitHub Issues** para bugs
- **GitHub Discussions** para ideias
- **Email**: dev@salonsync.com

---

**Obrigado por contribuir com o SalonSync!** 🚀