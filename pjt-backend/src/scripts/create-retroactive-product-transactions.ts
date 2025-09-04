import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRetroactiveProductTransactions() {
  console.log(
    '🔄 Iniciando criação de transações retroativas para produtos...',
  );

  // Buscar todos os produtos que têm estoque inicial mas não têm transação financeira
  const products = await prisma.product.findMany({
    where: {
      currentStock: { gt: 0 },
      costPrice: { gt: 0 },
    },
    include: {
      branch: true,
    },
  });

  console.log(`📦 Encontrados ${products.length} produtos com estoque e custo`);

  let transactionsCreated = 0;

  for (const product of products) {
    // Verificar se já existe transação financeira para este produto
    const existingTransaction = await prisma.financialTransaction.findFirst({
      where: {
        reference: `Produto-${product.id}`,
      },
    });

    if (existingTransaction) {
      console.log(`⏭️  Produto ${product.name} já tem transação financeira`);
      continue;
    }

    const totalCost = product.currentStock * Number(product.costPrice);

    if (totalCost <= 0) {
      console.log(`⏭️  Produto ${product.name} tem custo total zero`);
      continue;
    }

    // Buscar ou criar categoria de investimento
    let category = await prisma.expenseCategory.findFirst({
      where: {
        branchId: product.branchId,
        name: 'Compra de Produtos',
        type: 'INVESTMENT',
      },
    });

    if (!category) {
      category = await prisma.expenseCategory.create({
        data: {
          name: 'Compra de Produtos',
          type: 'INVESTMENT',
          color: '#F59E0B',
          branchId: product.branchId,
        },
      });
      console.log(`📂 Categoria criada para filial ${product.branch.name}`);
    }

    // Criar transação financeira retroativa
    const transaction = await prisma.financialTransaction.create({
      data: {
        description: `Investimento inicial: ${product.name} (${product.currentStock} ${product.unit})`,
        amount: totalCost,
        type: 'INVESTMENT',
        categoryId: category.id,
        paymentMethod: 'OTHER',
        reference: `Produto-${product.id}`,
        date: product.createdAt,
        branchId: product.branchId,
      },
    });

    console.log(
      `✅ Transação criada para ${product.name}: R$ ${totalCost.toFixed(2)} (${product.branch.name})`,
    );
    transactionsCreated++;
  }

  console.log(
    `🎉 Processo concluído! ${transactionsCreated} transações criadas.`,
  );
}

createRetroactiveProductTransactions()
  .catch((error) => {
    console.error('❌ Erro:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
