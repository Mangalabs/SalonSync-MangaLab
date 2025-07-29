import { PrismaClient, FinancialTransactionType } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  // Receitas
  {
    name: 'Atendimentos',
    type: FinancialTransactionType.INCOME,
    color: '#10B981',
    description: 'Receita de serviços prestados',
  },
  {
    name: 'Vendas de Produtos',
    type: FinancialTransactionType.INCOME,
    color: '#059669',
    description: 'Vendas de produtos do estoque',
  },
  {
    name: 'Outras Receitas',
    type: FinancialTransactionType.INCOME,
    color: '#047857',
    description: 'Receitas diversas',
  },

  // Despesas Operacionais
  {
    name: 'Aluguel',
    type: FinancialTransactionType.EXPENSE,
    color: '#EF4444',
    description: 'Aluguel do estabelecimento',
  },
  {
    name: 'Energia Elétrica',
    type: FinancialTransactionType.EXPENSE,
    color: '#DC2626',
    description: 'Conta de luz',
  },
  {
    name: 'Água',
    type: FinancialTransactionType.EXPENSE,
    color: '#B91C1C',
    description: 'Conta de água',
  },
  {
    name: 'Internet/Telefone',
    type: FinancialTransactionType.EXPENSE,
    color: '#991B1B',
    description: 'Telecomunicações',
  },

  // Despesas com Pessoal
  {
    name: 'Salários',
    type: FinancialTransactionType.EXPENSE,
    color: '#F97316',
    description: 'Salários dos funcionários',
  },
  {
    name: 'Comissões',
    type: FinancialTransactionType.EXPENSE,
    color: '#EA580C',
    description: 'Comissões pagas',
  },
  {
    name: 'Benefícios',
    type: FinancialTransactionType.EXPENSE,
    color: '#C2410C',
    description: 'Vale transporte, alimentação, etc.',
  },

  // Despesas com Produtos
  {
    name: 'Compra de Produtos',
    type: FinancialTransactionType.EXPENSE,
    color: '#7C2D12',
    description: 'Reposição de estoque',
  },
  {
    name: 'Fornecedores',
    type: FinancialTransactionType.EXPENSE,
    color: '#92400E',
    description: 'Pagamentos a fornecedores',
  },

  // Marketing
  {
    name: 'Publicidade',
    type: FinancialTransactionType.EXPENSE,
    color: '#A855F7',
    description: 'Anúncios e marketing',
  },
  {
    name: 'Redes Sociais',
    type: FinancialTransactionType.EXPENSE,
    color: '#9333EA',
    description: 'Gestão de redes sociais',
  },

  // Outras Despesas
  {
    name: 'Manutenção',
    type: FinancialTransactionType.EXPENSE,
    color: '#6B7280',
    description: 'Manutenção de equipamentos',
  },
  {
    name: 'Impostos',
    type: FinancialTransactionType.EXPENSE,
    color: '#4B5563',
    description: 'Impostos e taxas',
  },
  {
    name: 'Outras Despesas',
    type: FinancialTransactionType.EXPENSE,
    color: '#374151',
    description: 'Despesas diversas',
  },

  // Investimentos
  {
    name: 'Equipamentos',
    type: FinancialTransactionType.INVESTMENT,
    color: '#3B82F6',
    description: 'Compra de equipamentos',
  },
  {
    name: 'Reformas',
    type: FinancialTransactionType.INVESTMENT,
    color: '#2563EB',
    description: 'Melhorias no estabelecimento',
  },
  {
    name: 'Capacitação',
    type: FinancialTransactionType.INVESTMENT,
    color: '#1D4ED8',
    description: 'Cursos e treinamentos',
  },
  {
    name: 'Expansão',
    type: FinancialTransactionType.INVESTMENT,
    color: '#1E40AF',
    description: 'Investimentos em crescimento',
  },
  {
    name: 'Tecnologia',
    type: FinancialTransactionType.INVESTMENT,
    color: '#1E3A8A',
    description: 'Software e sistemas',
  },
];

export async function seedCategories(branchId: string) {
  console.log(`Criando categorias padrão para filial ${branchId}...`);

  for (const category of defaultCategories) {
    await prisma.expenseCategory.upsert({
      where: {
        // Usar combinação única de nome + branchId
        id: `${category.name}-${branchId}`.replace(/\s+/g, '-').toLowerCase(),
      },
      update: {},
      create: {
        ...category,
        branchId,
        id: `${category.name}-${branchId}`.replace(/\s+/g, '-').toLowerCase(),
      },
    });
  }

  console.log(`✅ ${defaultCategories.length} categorias criadas com sucesso!`);
}

// Script para executar manualmente
async function main() {
  const branches = await prisma.branch.findMany();

  for (const branch of branches) {
    await seedCategories(branch.id);
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch(console.error);
}
