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
                </div>

                <div className='bg-muted p-4 border border-theme rounded-lg mb-4'>
                  <div className='grid grid-cols-3 gap-4 font-semibold text-foreground'>
                    <div>Nome</div>
                    <div>Valor</div>
                    <div>Ações</div>
                  </div>
                </div>

                <div className='divide-y divide-theme'>
                  {prices.map((price) => (
                    <div key={price.id}>
                      <div className='grid grid-cols-4 gap-4 items-center px-4 py-3 hover:bg-muted transition-colors rounded-lg'>
                        <div className='flex items-center gap-3'>
                          <div className='w-20 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold'>
                            {price.product.name}
                          </div>
                          <div className='font-medium text-foreground'>
                            R${(price.unit_amount / 100).toFixed(2)}
                          </div>
                        </div>
                        <div className='flex space-x-2 col-span-2'>
                          <Button
                            className='p-0.5 sm:p-0.5 md:p-1 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingPlan(price)
                            }}>
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button
                            className='p-0.5 sm:p-0.5 md:p-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingPlan(price)
                            }}>
                            <Trash2 className='w-4 h-4' />
                          </Button>
                          <Button
                            className='p-0.5 sm:p-0.5 md:p-1 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 cursor-pointer'
                            onClick={(e) => {
                              e.stopPropagation()
                              setReadjustmentPlan(price)
                            }}>
                            <BanknoteArrowUp className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
          <FidelityForm initialData={editingPlan} />
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
