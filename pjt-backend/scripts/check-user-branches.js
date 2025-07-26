const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserBranches() {
  try {
    // Listar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true
      }
    });

    console.log('=== USUÁRIOS ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Nome: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`SuperAdmin: ${user.isSuperAdmin}`);
      console.log('---');
    });

    // Listar todas as filiais
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true
      }
    });

    console.log('\n=== FILIAIS ===');
    branches.forEach(branch => {
      console.log(`ID: ${branch.id}`);
      console.log(`Nome: ${branch.name}`);
      console.log(`Owner ID: ${branch.ownerId}`);
      console.log('---');
    });

    // Verificar relação usuário-filial
    console.log('\n=== RELAÇÃO USUÁRIO-FILIAL ===');
    for (const user of users) {
      const userBranches = await prisma.branch.findMany({
        where: { ownerId: user.id }
      });
      console.log(`${user.email} (${user.id}) tem ${userBranches.length} filiais:`);
      userBranches.forEach(branch => {
        console.log(`  - ${branch.name} (${branch.id})`);
      });
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserBranches();