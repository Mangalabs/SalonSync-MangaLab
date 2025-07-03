import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@teste.com' },
    update: {},
    create: {
      email: 'admin@teste.com',
      password: hashedPassword,
    },
  });

  // Criar profissionais
  const professional1 = await prisma.professional.upsert({
    where: { id: 'prof-1' },
    update: {},
    create: {
      id: 'prof-1',
      name: 'João Silva',
      role: 'Barbeiro',
    },
  });

  const professional2 = await prisma.professional.upsert({
    where: { id: 'prof-2' },
    update: {},
    create: {
      id: 'prof-2',
      name: 'Maria Santos',
      role: 'Cabeleireira',
    },
  });

  // Criar serviços
  const service1 = await prisma.service.upsert({
    where: { id: 'serv-1' },
    update: {},
    create: {
      id: 'serv-1',
      name: 'Corte Masculino',
      price: 25.00,
    },
  });

  const service2 = await prisma.service.upsert({
    where: { id: 'serv-2' },
    update: {},
    create: {
      id: 'serv-2',
      name: 'Barba',
      price: 15.00,
    },
  });

  const service3 = await prisma.service.upsert({
    where: { id: 'serv-3' },
    update: {},
    create: {
      id: 'serv-3',
      name: 'Corte Feminino',
      price: 35.00,
    },
  });

  // Criar clientes
  const client1 = await prisma.client.upsert({
    where: { id: 'client-1' },
    update: {},
    create: {
      id: 'client-1',
      name: 'Pedro Oliveira',
      phone: '(11) 99999-1111',
      email: 'pedro@email.com',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client-2' },
    update: {},
    create: {
      id: 'client-2',
      name: 'Ana Costa',
      phone: '(11) 99999-2222',
      email: 'ana@email.com',
    },
  });

  console.log('✅ Dados de teste criados com sucesso!');
  console.log('📧 Login: admin@teste.com');
  console.log('🔑 Senha: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });