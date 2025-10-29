import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
  ConnectPayments,
  ConnectAccountManagement,
  ConnectPayouts,
} from '@stripe/react-connect-js'
import {
  FileStack,
  BanknoteArrowDown,
  ChartCandlestick,
  BookUser,
  Trash2,
  Edit,
  PlusCircle,
  BanknoteArrowUp,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { FidelityForm } from '@/components/custom/fidelity/FidelityForm'
import { ReadjustmentForm } from '@/components/custom/fidelity/ReadjustmentForm'
import { Button } from '@/components/ui/button'
import { useStripeConnect } from '@/hooks/useStripeConnect'
import { useUser } from '@/contexts/UserContext'
import axios from '@/lib/axios'

export default function Fidelity() {
  const queryClient = useQueryClient()
  const { update: updateUser } = useUser()
  const [activeTab, setActiveTab] = useState('summary')
  const [connectedAccountId, setConnectedAccountId] = useState('')
  const [connectedAccount, setConnectedAccount] = useState({
    details_submitted: false,
  })
  const [creatingNew, setCreatingNew] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [prices, setPrices] = useState<any[]>([])
  const [deletingPlan, setDeletingPlan] = useState(null)
  const [readjustmentPlan, setReadjustmentPlan] = useState(null)
  const [search, setSearch] = useState('')

  const stripeConnectInstance = useStripeConnect(connectedAccountId)

  useEffect(() => {
    const createAccount = async () => {
      const response = await axios.post('/api/payment/account')
      updateUser({ accountId: response.data.id })
      setConnectedAccountId(response.data.id)
      setConnectedAccount(response.data)
    }
    createAccount()
  }, [])

  useEffect(() => {
    const getPrices = async () => {
      const response = await axios.get(
        '/api/payment/get-prices-for-connected-account',
      )
      setPrices(response.data)
    }
    getPrices()
  }, [connectedAccountId])

  const deleteProfessional = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(
        `/api/payment/archive-prices-for-connected-account/${id}`,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plano excluído com sucesso!')
      setDeletingPlan(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir plano')
      setDeletingPlan(null)
    },
  })

  const tabs = [
    { id: 'summary', label: 'Resumo', icon: BanknoteArrowDown },
    { id: 'income', label: 'Receitas', icon: BookUser },
    { id: 'plans', label: 'Planos', icon: ChartCandlestick },
    { id: 'config', label: 'Configurações', icon: FileStack },
  ]

  const filteredPrices = prices.filter((price) =>
    price.product.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl md:text-3xl font-bold text-foreground'>
          Fidelidade
        </h1>
      </div>

      {stripeConnectInstance && connectedAccountId && (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          {!connectedAccount.details_submitted && (
            <ConnectAccountOnboarding onExit={() => {}} />
          )}

          {connectedAccount.details_submitted && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='bg-card w-full grid-cols-4 rounded-2xl shadow-sm border border-border flex flex-wrap'>
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm md:text-base
                        ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer'
                    }`}>
                      <IconComponent className='w-4 h-4 md:w-5 md:h-5 flex-shrink-0' />
                      <span className='hidden sm:inline truncate'>
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent
                value='summary'
                className='space-y-4 md:space-y-6 bg-card border border-border rounded-2xl shadow-sm p-6'>
                <ConnectPayouts />
              </TabsContent>

              <TabsContent
                value='income'
                className='space-y-4 md:space-y-6 bg-card border border-border rounded-2xl shadow-sm p-6'>
                <ConnectPayments />
              </TabsContent>

              <TabsContent
                value='plans'
                className='space-y-4 md:space-y-6 bg-card border border-theme rounded-2xl shadow-sm p-6'>
                <div className='flex justify-between items-center border-b border-theme pb-4 mb-4'>
                  <Button
                    className='bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-80 transition cursor-pointer'
                    onClick={() => setCreatingNew(true)}>
                    <PlusCircle className='w-4 h-4' />
                    Novo Plano
                  </Button>
                  <Input
                    placeholder='Buscar plano...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='max-w-xs'
                  />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className='flex items-center'>
                          <div
                            className='max-w-[200px] px-4 py-2 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold truncate'
                            title={price.product.name}>
                            {price.product.name}
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className='font-medium text-foreground'>
                            R${(price.unit_amount / 100).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className='flex space-x-2'>
                          <Button
                            className='p-0.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors h-8 w-8 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingPlan(price)
                            }}>
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button
                            className='p-0.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors h-8 w-8 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingPlan(price)
                            }}>
                            <Trash2 className='w-4 h-4' />
                          </Button>
                          <Button
                            className='p-0.5 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors h-8 w-8 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              setReadjustmentPlan(price)
                            }}>
                            <BanknoteArrowUp className='w-4 h-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent
                value='config'
                className='space-y-4 md:space-y-6 bg-card border border-border rounded-2xl shadow-sm p-6'>
                <ConnectAccountManagement />
              </TabsContent>
            </Tabs>
          )}
        </ConnectComponentsProvider>
      )}

      <Dialog
        open={!!editingPlan || creatingNew}
        onOpenChange={() => {
          setEditingPlan(null)
          setCreatingNew(false)
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {creatingNew ? 'Novo Plano' : 'Editar Plano'}
            </DialogTitle>
          </DialogHeader>
          <FidelityForm
            initialData={editingPlan}
            onSuccess={() => {
              setEditingPlan(null)
              setCreatingNew(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!readjustmentPlan}
        onOpenChange={() => {
          setReadjustmentPlan(null)
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{readjustmentPlan?.product.name}</DialogTitle>
          </DialogHeader>
          <ReadjustmentForm planData={readjustmentPlan} />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingPlan}
        onOpenChange={() => setDeletingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar "{deletingPlan?.product.name}"?
              <br />
              <br />
              Esta ação não pode ser desfeita e terá os efeitos:
              <br />• Arquivar o plano permanentemente
              <br />• Não irá remover os dados relacionados
              <br />• Não irá cancelar as assinaturas relacionadas
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive hover:bg-destructive/90'
              onClick={() =>
                deletingPlan && deleteProfessional.mutate(deletingPlan.id)
              }>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
