import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionForm } from '@/components/custom/TransactionForm'
import { SchedulingForm } from '@/components/custom/SchedulingForm'
import { FinancialSummaryTest } from '@/components/test/FinancialSummaryTest'
import { FinancialTabContent } from '@/components/custom/FinancialTabContent'
import { FinancialProvider } from '@/contexts/FinancialContext'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'

export function BranchTestComponent() {
  const [activeTest, setActiveTest] = useState<string | null>(null)
  const { user, isAdmin } = useUser()
  const { activeBranch, branches } = useBranch()

  const tests = [
    {
      id: 'transaction-form',
      title: 'Teste TransactionForm',
      description: 'Testa criação de transação com seleção de filial para admin',
      component: <TransactionForm type="EXPENSE" onSuccess={() => setActiveTest(null)} />,
    },
    {
      id: 'scheduling-form', 
      title: 'Teste SchedulingForm',
      description: 'Testa agendamento com seleção de filial para admin',
      component: <SchedulingForm onSuccess={() => setActiveTest(null)} />,
    },
    {
      id: 'financial-summary',
      title: 'Teste Resumo Financeiro',
      description: 'Testa filtro de filial no resumo financeiro',
      component: <FinancialSummaryTest />,
    },
    {
      id: 'financial-tab-new',
      title: 'Teste Nova Aba Financeira',
      description: 'Testa nova organização da aba de receitas/despesas',
      component: (
        <FinancialProvider>
          <FinancialTabContent type="INCOME" />
        </FinancialProvider>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Usuário:</strong> {user?.name} ({user?.role})</p>
          <p><strong>É Admin:</strong> {isAdmin ? 'Sim' : 'Não'}</p>
          <p><strong>Filial Ativa:</strong> {activeBranch?.name}</p>
          <p><strong>Total de Filiais:</strong> {branches.length}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <CardTitle className="text-lg">{test.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{test.description}</p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setActiveTest(test.id)}
                className="w-full"
              >
                Testar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeTest && (
        <Card>
          <CardHeader>
            <CardTitle>
              {tests.find(t => t.id === activeTest)?.title}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => setActiveTest(null)}
              >
                Fechar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tests.find(t => t.id === activeTest)?.component}
          </CardContent>
        </Card>
      )}
    </div>
  )
}