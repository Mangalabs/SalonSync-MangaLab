# Beauty Management System - Backend

Sistema de gerenciamento para salões de beleza e barbearias com suporte a múltiplas filiais.

## 🚀 Configuração Inicial

### 1. Pré-requisitos
- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

### 2. Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd pjt-backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### 3. Configuração do Banco de Dados

```bash
# Execute as migrações
npx prisma migrate dev

# (Opcional) Popule com dados de exemplo
npx prisma db seed
```

### 4. Executar o Projeto

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## 🔧 Configuração de Ambiente

### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Chave secreta para JWT | `openssl rand -base64 32` |

### Variáveis Opcionais

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `NODE_ENV` | `development` | Ambiente de execução |
| `JWT_EXPIRES_IN` | `24h` | Expiração do token JWT |
| `FRONTEND_URL` | `http://localhost:5173` | URL do frontend para CORS |

### 🔒 Segurança em Produção

**⚠️ IMPORTANTE:** Antes de fazer deploy em produção:

1. **Gere um JWT_SECRET forte:**
   ```bash
   openssl rand -base64 32
   ```

2. **Configure DATABASE_URL para produção:**
   ```
   DATABASE_URL="postgresql://user:password@production-host:5432/database"
   ```

3. **Defina NODE_ENV como production:**
   ```
   NODE_ENV=production
   ```

4. **Configure CORS adequadamente:**
   ```
   FRONTEND_URL=https://yourdomain.com
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

## 📚 API Documentation

Com o servidor rodando, acesse:
- **Swagger UI:** http://localhost:3000/api
- **OpenAPI JSON:** http://localhost:3000/api-json

## 🏗️ Estrutura do Projeto

```
src/
├── auth/           # Autenticação e autorização
├── users/          # Gerenciamento de usuários
├── branches/       # Filiais
├── professionals/  # Profissionais
├── services/       # Serviços
├── clients/        # Clientes
├── appointments/   # Agendamentos
├── config/         # Configurações
├── prisma/         # Schema e migrações
└── main.ts         # Ponto de entrada
```

## 🔄 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev      # Servidor com hot-reload
npm run start:debug    # Servidor com debug

# Produção
npm run build          # Build da aplicação
npm run start:prod     # Servidor de produção

# Database
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:migrate   # Executar migrações
npm run prisma:studio    # Interface visual do banco

# Testes
npm run test           # Testes unitários
npm run test:e2e       # Testes end-to-end
npm run test:cov       # Cobertura de testes
```

## 🐳 Docker (Opcional)

```bash
# Build da imagem
docker build -t beauty-backend .

# Executar container
docker run -p 3000:3000 --env-file .env beauty-backend
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.