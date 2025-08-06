# Deploy SalonSync na AWS - Guia Completo

## 🎯 Objetivo
Deploy do sistema SalonSync na AWS para testes de usuários com **custos mínimos**.

## 💰 Estratégia de Custos Baixos

### Serviços AWS Gratuitos/Baratos:
- **EC2 t2.micro** (Free Tier - 750h/mês grátis)
- **RDS MySQL t3.micro** (Free Tier - 750h/mês grátis)
- **Route 53** (apenas domínio - ~$12/ano)
- **CloudFront** (Free Tier - 1TB/mês grátis)
- **S3** (Free Tier - 5GB grátis)

### Custo Estimado Mensal:
- **Primeiros 12 meses**: ~$0-5/mês (Free Tier)
- **Após Free Tier**: ~$15-25/mês

## 🏗️ Arquitetura Recomendada

```
Internet → CloudFront → S3 (Frontend) 
                    ↘ EC2 (Backend + Nginx) → RDS MySQL
```

## 📋 Pré-requisitos

1. **Conta AWS** (com Free Tier ativo)
2. **AWS CLI** instalado
3. **Domínio** (opcional, mas recomendado)
4. **Node.js 18+** e **npm**

## 🚀 Passo a Passo

### 1. Preparação do Código

#### Backend (Node.js/Express)
```bash
# No diretório do backend
npm run build
```

#### Frontend (React/Vite)
```bash
# No diretório do frontend
npm run build
```

### 2. Configuração do RDS (Banco de Dados)

#### 2.1 Criar RDS MySQL
```bash
aws rds create-db-instance \
  --db-instance-identifier salonsync-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password SuaSenhaSegura123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --publicly-accessible \
  --backup-retention-period 0 \
  --no-multi-az \
  --storage-type gp2
```

#### 2.2 Configurar Security Group
```bash
# Permitir acesso MySQL (porta 3306)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 3306 \
  --cidr 0.0.0.0/0
```

### 3. Configuração do EC2 (Backend)

#### 3.1 Criar Instância EC2
```bash
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --count 1 \
  --instance-type t2.micro \
  --key-name sua-chave \
  --security-group-ids sg-xxxxxxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=SalonSync-Backend}]'
```

#### 3.2 Script de Configuração do Servidor
```bash
#!/bin/bash
# user-data.sh

# Atualizar sistema
sudo yum update -y

# Instalar Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo yum install -y nginx

# Configurar Nginx
sudo tee /etc/nginx/conf.d/salonsync.conf > /dev/null <<EOF
server {
    listen 80;
    server_name seu-dominio.com;

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Redirecionar root para CloudFront
    location / {
        return 301 https://seu-cloudfront-domain.cloudfront.net\$request_uri;
    }
}
EOF

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Criar diretório da aplicação
sudo mkdir -p /var/www/salonsync
sudo chown ec2-user:ec2-user /var/www/salonsync
```

#### 3.3 Deploy do Backend
```bash
# Conectar na instância
ssh -i sua-chave.pem ec2-user@ip-da-instancia

# Clonar repositório ou fazer upload
cd /var/www/salonsync
# Upload dos arquivos do backend...

# Instalar dependências
npm install --production

# Configurar variáveis de ambiente
cat > .env << EOF
NODE_ENV=production
PORT=3000
DB_HOST=seu-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=SuaSenhaSegura123!
DB_NAME=salonsync
JWT_SECRET=seu-jwt-secret-super-seguro
EOF

# Executar migrations
npm run migrate

# Iniciar com PM2
pm2 start npm --name "salonsync-api" -- start
pm2 startup
pm2 save
```

### 4. Configuração do S3 + CloudFront (Frontend)

#### 4.1 Criar Bucket S3
```bash
aws s3 mb s3://salonsync-frontend-bucket
```

#### 4.2 Configurar Bucket para Hosting
```bash
# Política do bucket
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::salonsync-frontend-bucket/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
  --bucket salonsync-frontend-bucket \
  --policy file://bucket-policy.json

# Configurar website
aws s3 website s3://salonsync-frontend-bucket \
  --index-document index.html \
  --error-document index.html
```

#### 4.3 Upload do Frontend
```bash
# Build do frontend com URL da API
echo "VITE_API_URL=http://seu-dominio.com" > .env.production

npm run build

# Upload para S3
aws s3 sync dist/ s3://salonsync-frontend-bucket --delete
```

### 5. Scripts de Automação

#### deploy.sh
```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deploy do SalonSync..."

# Build Frontend
echo "📦 Building frontend..."
cd frontend
npm run build
aws s3 sync dist/ s3://salonsync-frontend-bucket --delete

# Deploy Backend
echo "🔄 Deploying backend..."
cd ../backend
ssh -i ~/.ssh/sua-chave.pem ec2-user@seu-ip << 'EOF'
cd /var/www/salonsync
git pull origin main
npm install --production
pm2 restart salonsync-api
EOF

echo "✅ Deploy concluído!"
```

## 🔒 Segurança

### Security Groups
```bash
# Backend EC2
aws ec2 create-security-group \
  --group-name salonsync-backend \
  --description "SalonSync Backend Security Group"

# Permitir HTTP (80), HTTPS (443), SSH (22)
aws ec2 authorize-security-group-ingress \
  --group-name salonsync-backend \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

### SSL/HTTPS (Gratuito)
```bash
# Instalar Certbot
sudo yum install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com
```

## 📊 Monitoramento de Custos

### CloudWatch Alarms
```bash
# Alarme para custos > $10
aws cloudwatch put-metric-alarm \
  --alarm-name "SalonSync-Cost-Alert" \
  --alarm-description "Alert when costs exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **502 Bad Gateway**
   ```bash
   # Verificar se backend está rodando
   pm2 status
   pm2 logs salonsync-api
   ```

2. **Conexão com Banco**
   ```bash
   # Testar conexão
   mysql -h seu-rds-endpoint.amazonaws.com -u admin -p
   ```

3. **CORS Issues**
   ```javascript
   // No backend, configurar CORS
   app.use(cors({
     origin: ['https://seu-cloudfront-domain.cloudfront.net'],
     credentials: true
   }));
   ```

## 💡 Dicas para Reduzir Custos

1. **Usar Reserved Instances** após validação
2. **Configurar Auto Scaling** para EC2
3. **Monitorar métricas** regularmente
4. **Usar Spot Instances** para desenvolvimento
5. **Configurar lifecycle policies** no S3

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar logs: `pm2 logs`
- Monitorar custos: AWS Cost Explorer
- Documentação AWS: https://docs.aws.amazon.com/

---

**⚠️ Importante**: Sempre monitore os custos através do AWS Cost Explorer e configure alertes de billing para evitar surpresas na fatura.