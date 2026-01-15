const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultHours = [
  {
    dayOfWeek: 0, // Domingo
    startTime: '09:00',
    endTime: '18:00',
    isOpen: false,
    lunchStartTime: null,
    lunchEndTime: null,
  },
  {
    dayOfWeek: 1, // Segunda
    startTime: '09:00',
    endTime: '18:00',
    isOpen: true,
    lunchStartTime: '12:00',
    lunchEndTime: '14:00',
  },
  {
    dayOfWeek: 2, // Terça
    startTime: '09:00',
    endTime: '18:00',
    isOpen: true,
    lunchStartTime: '12:00',
    lunchEndTime: '14:00',
  },
  {
    dayOfWeek: 3, // Quarta
    startTime: '09:00',
    endTime: '18:00',
    isOpen: true,
    lunchStartTime: '12:00',
    lunchEndTime: '14:00',
  },
  {
    dayOfWeek: 4, // Quinta
    startTime: '09:00',
    endTime: '18:00',
    isOpen: true,
    lunchStartTime: '12:00',
    lunchEndTime: '14:00',
  },
  {
    dayOfWeek: 5, // Sexta
    startTime: '09:00',
    endTime: '18:00',
    isOpen: true,
    lunchStartTime: '12:00',
    lunchEndTime: '14:00',
  },
  {
    dayOfWeek: 6, // Sábado
    startTime: '09:00',
    endTime: '14:00',
    isOpen: true,
    lunchStartTime: null,
    lunchEndTime: null,
  },
];

async function seedBranchHours() {
  try {
    console.log('🕐 Iniciando seed de horários de funcionamento...');

    // Buscar todas as filiais
    const branches = await prisma.branch.findMany({
      select: { id: true, name: true },
    });

    console.log(`📍 Encontradas ${branches.length} filiais`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const branch of branches) {
      console.log(`\n📍 Processando filial: ${branch.name}`);

      // Verificar se já tem horários configurados
      const existingHours = await prisma.branchHours.findMany({
        where: { branchId: branch.id },
      });

      if (existingHours.length > 0) {
        console.log(
          `   ⏭️  Já possui ${existingHours.length} configurações de horário`,
        );
        skippedCount++;
        continue;
      }

      // Criar horários padrão
      for (const hours of defaultHours) {
        await prisma.branchHours.create({
          data: {
            branchId: branch.id,
            ...hours,
          },
        });
      }

      console.log('   ✅ Horários padrão criados (7 dias)');
      createdCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Resumo:');
    console.log(`   ✅ Filiais configuradas: ${createdCount}`);
    console.log(`   ⏭️  Filiais já configuradas: ${skippedCount}`);
    console.log(`   📍 Total de filiais: ${branches.length}`);
    console.log('='.repeat(50));

    console.log('\n✅ Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedBranchHours()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });
