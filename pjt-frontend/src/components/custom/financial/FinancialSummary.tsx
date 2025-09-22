import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Calendar,
  Plus,
  Target,
  Package,
  ShoppingCart,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFinancial } from '@/contexts/FinancialContext'
import axios from '@/lib/axios'

interface FinancialSummaryProps {
  onNewTransaction?: (type: 'INCOME' | 'EXPENSE' | 'INVESTMENT') => void;
  onNewRecurringExpense?: () => void;
}

function formatCurrencyBRL(value?: number | null) {
  const v = Number(value ?? 0)
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function FinancialSummary({
  onNewTransaction,
  onNewRecurringExpense,
}: FinancialSummaryProps) {
  const { branchFilter, startDate, endDate } = useFinancial()

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['financial-summary', startDate, endDate, branchFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) {params.append('startDate', startDate)}
      if (endDate) {params.append('endDate', endDate)}
      if (branchFilter !== 'all') {params.append('branchId', branchFilter)}

      const res = await axios.get(`/api/financial/summary?${params}`)
      return res.data
    },
  })

  const totalForDistribution =
    (summary?.totalIncome ?? 0) +
      (summary?.totalExpenses ?? 0) +
      (summary?.totalInvestments ?? 0) || 1

  const distributionData = [
    {
      name: 'Receitas',
      value: summary?.totalIncome ?? 0,
      color: '#D4AF37',
    },
    {
      name: 'Despesas',
      value: summary?.totalExpenses ?? 0,
      color: '#EF4444',
    },
    {
      name: 'Investimentos',
      value: summary?.totalInvestments ?? 0,
      color: '#3B82F6',
    },
  ]

  const performanceData = [
    {
      name: 'Margem de Lucro',
      value:
        summary?.totalIncome && summary?.totalIncome > 0
          ? Number(((summary.netProfit ?? 0) / summary.totalIncome) * 100).toFixed(1)
          : 0,
    },
    {
      name: 'ROI Investimentos',
      value:
        summary?.totalInvestments && summary?.totalInvestments > 0
          ? Number(((summary.netProfit ?? 0) / summary.totalInvestments) * 100).toFixed(1)
          : 0,
    },
    {
      name: 'Eficiência Operacional',
      value:
        summary?.totalIncome && summary?.totalExpenses
          ? Number((summary.totalIncome / summary.totalExpenses) * 100).toFixed(0)
          : 0,
    },
  ].map((d) => ({ ...d, value: Number(d.value) }))

  if (isLoading) {return <div className='p-4'>Carregando resumo...</div>}
  if (error) {return <div className='p-4 text-red-600'>Erro ao carregar resumo financeiro</div>}

  return (
    <div className='space-y-6 mt-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Plus className='h-4 w-4' />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-6'>
            <Button
              className='px-10 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2'
              onClick={() => onNewTransaction?.('INCOME')}>
              <TrendingUp className='h-4 w-4' />
              Nova Receita
            </Button>
            <Button
              className='px-10 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2'
              onClick={() => onNewTransaction?.('EXPENSE')}>
              <TrendingDown className='h-4 w-4' />
              Nova Despesa
            </Button>
            <Button
              className='px-10 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2'
              onClick={onNewRecurringExpense}>
              <Calendar className='h-4 w-4' />
              Nova Despesa Fixa
            </Button>
            <Button
              className='px-10 py-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2'
              onClick={() => onNewTransaction?.('INVESTMENT')}>
              <PiggyBank className='h-4 w-4' />
              Novo Investimento
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center'>
              <TrendingUp className='w-5 h-5 text-green-600' />
            </div>
            <h3 className='font-semibold text-gray-800'>Receitas</h3>
          </div>
          <div className='space-y-3'>
            <div className='text-2xl font-bold text-green-600'>
              {formatCurrencyBRL(summary?.totalIncome ?? 0)}
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Atendimentos:</span>
                <span className='font-medium'>
                  {' '}
                  {formatCurrencyBRL(summary?.appointmentRevenue ?? 0)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Vendas Estoque:</span>
                <span className='font-medium'>
                  {summary?.stockRevenue > 0 && (
                    <span>{formatCurrencyBRL(summary.stockRevenue)}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center'>
              <TrendingDown className='w-5 h-5 text-red-600' />
            </div>
            <h3 className='font-semibold text-gray-800'>Despesas</h3>
          </div>
          <div className='space-y-3'>
            <div className='text-2xl font-bold text-red-600'>
              {formatCurrencyBRL(summary?.totalExpenses ?? 0)}
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Gastos operacionais.</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Compras Estoque:</span>
                <span className='font-medium'>
                  {formatCurrencyBRL(summary.stockExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center'>
              <Target className='w-5 h-5 text-purple-600' />
            </div>
            <h3 className='font-semibold text-gray-800'>Investimentos</h3>
          </div>
          <div className='space-y-3'>
            <div className='text-2xl font-bold text-purple-600'>
              {formatCurrencyBRL(summary?.totalInvestments ?? 0)}
            </div>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Melhorias e equipamentos.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-sm'>
        <div className='flex items-center gap-3 mb-2'>
          <DollarSign className='w-6 h-6' />
          <h3 className='font-semibold'>Lucro Líquido</h3>
        </div>
        <div className='text-3xl font-bold'>
          {formatCurrencyBRL(summary?.netProfit ?? 0)}
        </div>
        <p className='text-sm opacity-90 mt-1'>
          Receitas - Despesas - Investimentos
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {(summary?.stockRevenue > 0 ||
          summary?.stockExpenses > 0 ||
          summary?.stockLosses > 0) && (
          <Card>
            <CardHeader className='mb-2'>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Movimentações de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {summary?.stockRevenue > 0 && (
                  <div className='flex justify-between items-center p-4 bg-green-50 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <Package className='w-5 h-5 text-green-600' />
                      <span className='font-medium text-gray-800'>
                        Vendas de Produtos
                      </span>
                    </div>
                    <span className='font-bold text-green-600'>
                      {formatCurrencyBRL(summary.stockRevenue)}
                    </span>
                  </div>
                )}
                {summary?.stockExpenses > 0 && (
                  <div className='flex justify-between items-center p-4 bg-red-50 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <ShoppingCart className='w-5 h-5 text-red-600' />
                      <span className='font-medium text-gray-800'>
                        Compras de Produtos
                      </span>
                    </div>
                    <span className='font-bold text-red-600'>
                      {' '}
                      {formatCurrencyBRL(summary.stockExpenses)}
                    </span>
                  </div>
                )}

                {summary?.stockLosses > 0 && (
                  <div className='flex justify-between items-center p-4 bg-red-50 rounded-xl'>
                    <div className='flex items-center gap-3'>
                      <ShoppingCart className='w-5 h-5 text-red-600' />
                      <span className='font-medium text-gray-800'>
                        Perdas de Produtos
                      </span>
                    </div>
                    <span className='font-bold text-red-600'>
                      {' '}
                      {formatCurrencyBRL(summary.stockLosses)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Distribuição Financeira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col lg:flex-row items-center gap-4'>
              <div style={{ width: 220, height: 220 }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      outerRadius={60}
                      label
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrencyBRL(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className='flex-1 space-y-2'>
                {distributionData.map((d) => {
                  const perc = totalForDistribution
                    ? ((d.value / totalForDistribution) * 100).toFixed(1)
                    : '0.0'
                  return (
                    <div
                      key={d.name}
                      className='flex items-center justify-between text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <span
                          className='w-3 h-3 rounded-full'
                          style={{ background: d.color }}
                        />
                        <span>{d.name}</span>
                      </div>
                      <div className='font-medium'>
                        {perc}% • {formatCurrencyBRL(d.value)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={performanceData}>
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Bar dataKey='value' fill='#8B5CF6' />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className='mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div className='text-sm'>
              <div className='text-xs text-gray-500'>Margem de Lucro</div>
              <div
                className={`font-medium ${
                  (summary?.netProfit ?? 0) >= 0
                    ? 'text-[#D4AF37]'
                    : 'text-red-600'
                }`}>
                {summary?.totalIncome
                  ? `${(
                    ((summary.netProfit ?? 0) / summary.totalIncome) *
                    100
                  ).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>

            <div className='text-sm'>
              <div className='text-xs text-gray-500'>ROI Investimentos</div>
              <div className='font-medium text-blue-600'>
                {summary?.totalInvestments && summary?.totalInvestments > 0
                  ? `${(
                    ((summary.netProfit ?? 0) / summary.totalInvestments) *
                    100
                  ).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>

            <div className='text-sm'>
              <div className='text-xs text-gray-500'>
                Eficiência Operacional
              </div>
              <div className='font-medium'>
                {summary?.totalIncome && summary?.totalExpenses
                  ? `${(
                    (summary.totalIncome / summary.totalExpenses) *
                    100
                  ).toFixed(0)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
