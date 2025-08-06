# Deploy Alternativo - Opções Mais Baratas

## 🆓 Opções Gratuitas/Muito Baratas

### 1. Vercel + PlanetScale (Recomendado)

**Custos**: $0/mês
- **Frontend**: Vercel (gratuito)
- **Backend**: Vercel Functions (gratuito até 100GB-hours)
- **Banco**: PlanetScale (gratuito até 5GB)

```bash
# Deploy Frontend
npm i -g vercel
vercel --prod

# Deploy Backend como API Routes
# Mover backend para /api no projeto Vercel
```

### 2. Netlify + Supabase

**Custos**: $0/mês
- **Frontend**: Netlify (gratuito)
- **Backend**: Netlify Functions
- **Banco**: Supabase (gratuito até 500MB)

### 3. Railway

**Custos**: ~$5/mês
- **Full-stack**: Deploy completo
- **Banco**: PostgreSQL incluído

```bash
# Deploy completo
npm i -g @railway/cli
railway login
railway init
railway up
```

### 4. Render

**Custos**: $0-7/mês
- **Frontend**: Gratuito
- **Backend**: $7/mês
- **Banco**: PostgreSQL gratuito

## 🐳 Docker + VPS Barato

### DigitalOcean Droplet ($4/mês)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Copy backend code
COPY backend/ ./backend/

EXPOSE 3000

CMD ["node", "backend/server.js"]
```

```bash
# Deploy
docker build -t salonsync .
docker run -p 3000:3000 -e DATABASE_URL=... salonsync
```

## 📱 Deploy Mobile-First

### Capacitor + Ionic

```bash
# Transformar em PWA/App
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
npx cap run android
```

## 🔄 CI/CD Gratuito

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install and Build
        run: |
          npm install
          npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 💾 Banco de Dados Gratuitos

### 1. Supabase (PostgreSQL)
- **Gratuito**: 500MB, 2 projetos
- **API REST** automática
- **Auth** incluído

### 2. PlanetScale (MySQL)
- **Gratuito**: 5GB, 1 banco
- **Branching** como Git
- **Serverless**

### 3. MongoDB Atlas
- **Gratuito**: 512MB
- **Cluster compartilhado**

### 4. Aiven (PostgreSQL)
- **Gratuito**: 1 mês trial
- **Depois**: ~$20/mês

## 🌐 CDN Gratuito

### Cloudflare
```bash
# Configurar Cloudflare
# 1. Adicionar domínio
# 2. Configurar DNS
# 3. Ativar proxy (laranja)
# 4. SSL automático
```

## 📊 Monitoramento Gratuito

### 1. Uptime Robot
- **Gratuito**: 50 monitores
- **Alertas**: Email/SMS

### 2. LogRocket (Frontend)
- **Gratuito**: 1000 sessões/mês

### 3. Sentry (Errors)
- **Gratuito**: 5000 errors/mês

## 🔐 Domínio Barato

### Registrars Baratos
1. **Namecheap**: ~$8-12/ano
2. **Porkbun**: ~$7-10/ano
3. **Cloudflare**: ~$8-10/ano

### Domínio Gratuito
- **Freenom**: .tk, .ml, .ga (gratuito)
- **GitHub Pages**: username.github.io

## 🚀 Deploy Rápido - Vercel

```bash
# 1. Preparar projeto
mkdir salonsync-vercel
cd salonsync-vercel

# 2. Estrutura
# /pages/api/ - Backend
# /pages/ - Frontend (Next.js)
# /public/ - Assets

# 3. Deploy
vercel --prod
```

## 📱 PWA Configuration

```javascript
// vite.config.js
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'SalonSync',
        short_name: 'SalonSync',
        description: 'Sistema de Gestão para Salões',
        theme_color: '#D4AF37',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
}
```

## 💡 Resumo de Custos

| Opção | Custo/Mês | Prós | Contras |
|-------|------------|------|---------|
| Vercel + PlanetScale | $0 | Gratuito, fácil | Limites |
| Railway | $5 | Simples, completo | Pago |
| AWS Free Tier | $0-5 | Escalável | Complexo |
| DigitalOcean | $4 | VPS completo | Configuração manual |
| Render | $7 | Fácil, confiável | Backend pago |

## 🎯 Recomendação Final

**Para testes**: Vercel + PlanetScale (gratuito)
**Para produção**: Railway ou AWS (escalável)
**Para aprender**: DigitalOcean VPS (controle total)