import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncExistingProfessionalsExpenses() {
  console.log(
    '🔄 Sincronizando despesas fixas para funcionários existentes...',
  );

  // Buscar todos os profissionais com salário configurado
  const professionals = await prisma.professional.findMany({
    where: {
      active: true,
      customRole: {
        baseSalary: { not: null },
        salaryPayDay: { not: null },
      },
    },
    include: {
      customRole: true,
      branch: true,
    },
  });

  console.log(
    `👥 Encontrados ${professionals.length} funcionários com salário configurado`,
  );

  let expensesCreated = 0;

  for (const professional of professionals) {
    // Verificar se já existe despesa fixa para este funcionário
    const existingExpense = await prisma.recurringExpense.findFirst({
      where: {
        professionalId: professional.id,
        isActive: true,
      },
    });

    if (existingExpense) {
      console.log(`⏭️  Funcionário ${professional.name} já tem despesa fixa`);
      continue;
    }

    const baseSalary = professional.customRole?.baseSalary;
    const payDay = professional.customRole?.salaryPayDay;

    if (!baseSalary || !payDay) {
      console.log(
        `⏭️  Funcionário ${professional.name} sem dados salariais completos`,
      );
      continue;
    }

    // Buscar ou criar categoria de salários
    let salaryCategory = await prisma.expenseCategory.findFirst({
      where: {
        branchId: professional.branchId,
        name: 'Salários',
        type: 'EXPENSE',
      },
    });

    if (!salaryCategory) {
      salaryCategory = await prisma.expenseCategory.create({
        data: {
          name: 'Salários',
          type: 'EXPENSE',
          color: '#EC4899',
          branchId: professional.branchId,
        },
      });
      console.log(
        `📂 Categoria de salários criada para ${professional.branch.name}`,
      );
    }

    // Criar despesa fixa automática
    const recurringExpense = await prisma.recurringExpense.create({
      data: {
        name: `Salário: ${professional.name}`,
        description: `Salário automático do funcionário ${professional.name}`,
        categoryId: salaryCategory.id,
        fixedAmount: Number(baseSalary),
        receiptDay: payDay - 2 > 0 ? payDay - 2 : 1,
        dueDay: payDay,
        isActive: true,
        branchId: professional.branchId,
        professionalId: professional.id,
      },
    });

    console.log(
      `✅ Despesa fixa criada para ${professional.name}: R$ ${Number(baseSalary).toFixed(2)} (${professional.branch.name})`,
    );
    expensesCreated++;
  }

  console.log(
    `🎉 Processo concluído! ${expensesCreated} despesas fixas criadas.`,
  );
}

syncExistingProfessionalsExpenses()
  .catch((error) => {
    console.error('❌ Erro:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
