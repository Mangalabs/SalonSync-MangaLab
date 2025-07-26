const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log('Uso: node scripts/create-admin.js <email> <password> <name> <businessName> [branchName]');
    console.log('Exemplo: node scripts/create-admin.js admin@empresa.com senha123 "João Silva" "Barbearia do João" "Matriz"');
    process.exit(1);
  }

  const [email, password, name, businessName, branchName = 'Matriz'] = args;

  try {
    // Verificar se já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ Usuário já existe com este email');
      process.exit(1);
    }

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        businessName,
        role: 'ADMIN',
        isSuperAdmin: true
      }
    });

    // Criar filial padrão
    const branch = await prisma.branch.create({
      data: {
        name: branchName,
        ownerId: user.id
      }
    });

    console.log('✅ SuperAdmin criado com sucesso!');
    console.log('📧 Email:', email);
    console.log('👤 Nome:', name);
    console.log('🏢 Empresa:', businessName);
    console.log('🏪 Filial:', branchName);
    console.log('🆔 ID:', user.id);
    console.log('🔑 SuperAdmin: SIM');
    
  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();