import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixHistoricalAppointments() {
  console.log('🔧 Iniciando correção de atendimentos históricos...');

  // Buscar todos os atendimentos COMPLETED que não têm transações financeiras
  const completedAppointments = await prisma.appointment.findMany({
    where: {
      status: 'COMPLETED',
    },
    include: {
      professional: {
        include: {
          customRole: true,
        },
      },
      client: true,
      appointmentServices: {
        include: {
          service: true,
        },
      },
    },
  });

  console.log(`📊 Encontrados ${completedAppointments.length} atendimentos concluídos`);

  let fixed = 0;

  for (const appointment of completedAppointments) {
    // Verificar se já existe transação financeira para este atendimento
    const existingTransaction = await prisma.financialTransaction.findFirst({
      where: {
        appointmentId: appointment.id,
      },
    });

    if (existingTransaction) {
      console.log(`✅ Atendimento ${appointment.id.substring(0, 8)} já possui transações`);
      continue;
    }

    console.log(`🔄 Corrigindo atendimento ${appointment.id.substring(0, 8)}...`);

    try {
      await prisma.$transaction(async (tx) => {
        // Criar transação de receita
        await createRevenueTransaction(appointment, tx);
        
        // Criar transação de comissão
        await createCommissionTransaction(appointment, tx);
      });

      fixed++;
      console.log(`✅ Atendimento ${appointment.id.substring(0, 8)} corrigido`);
    } catch (error) {
      console.error(`❌ Erro ao corrigir atendimento ${appointment.id.substring(0, 8)}:`, error);
    }
  }

  console.log(`🎉 Correção concluída! ${fixed} atendimentos corrigidos.`);
}

async function createRevenueTransaction(appointment: any, tx: any) {
  // Buscar ou criar categoria de serviços
  let servicesCategory = await tx.expenseCategory.findFirst({
    where: {
      branchId: appointment.branchId,
      name: 'Serviços',
      type: 'INCOME',
    },
  });

  if (!servicesCategory) {
    servicesCategory = await tx.expenseCategory.create({
      data: {
        name: 'Serviços',
        type: 'INCOME',
        color: '#10B981',
        branchId: appointment.branchId,
      },
    });
  }

  // Criar transação de receita
  await tx.financialTransaction.create({
    data: {
      description: `Atendimento: ${appointment.professional?.name || 'Profissional'} - ${appointment.client.name}`,
      amount: Number(appointment.total),
      type: 'INCOME',
      categoryId: servicesCategory.id,
      paymentMethod: 'CASH',
      reference: `Atendimento-${appointment.id}`,
      appointmentId: appointment.id,
      date: appointment.scheduledAt,
      branchId: appointment.branchId,
    },
  });
}

async function createCommissionTransaction(appointment: any, tx: any) {
  // Calcular comissão
  const commissionRate =
    appointment.professional?.customRole?.commissionRate ||
    appointment.professional?.commissionRate ||
    0;
  const commissionAmount =
    (Number(appointment.total) * Number(commissionRate)) / 100;

  if (commissionAmount <= 0) return;

  // Buscar ou criar categoria de comissão
  let commissionCategory = await tx.expenseCategory.findFirst({
    where: {
      branchId: appointment.branchId,
      name: 'Comissões',
      type: 'EXPENSE',
    },
  });

  if (!commissionCategory) {
    commissionCategory = await tx.expenseCategory.create({
      data: {
        name: 'Comissões',
        type: 'EXPENSE',
        color: '#8B5CF6',
        branchId: appointment.branchId,
      },
    });
  }

  // Criar transação de comissão
  await tx.financialTransaction.create({
    data: {
      description: `Comissão: ${appointment.professional?.name || 'Profissional'} - ${appointment.client.name}`,
      amount: commissionAmount,
      type: 'EXPENSE',
      categoryId: commissionCategory.id,
      paymentMethod: 'OTHER',
      reference: `Atendimento-${appointment.id}`,
      appointmentId: appointment.id,
      date: appointment.scheduledAt,
      branchId: appointment.branchId,
    },
  });
}

// Executar o script
fixHistoricalAppointments()
  .catch((e) => {
    console.error('❌ Erro durante a correção:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });