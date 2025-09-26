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
  const [prices, setPrices] = useState([])
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
        '/api/payment/get-prices-for-connected-account'
      )

      setPrices(response.data)
    }

    getPrices()
  }, [connectedAccountId])

  const deleteProfessional = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(
        `/api/payment/archive-prices-for-connected-account/${id}`
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
        <h1 className='text-2xl font-bold text-[#1A1A1A]'>Fidelidade</h1>
      </div>
      {stripeConnectInstance && connectedAccountId && (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
          {!connectedAccount.details_submitted && (
            <ConnectAccountOnboarding onExit={() => {}} />
          )}

          {connectedAccount.details_submitted && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='hidden bg-white w-full grid-cols-5 rounded-2xl p-2 shadow-sm border h-15 border-gray-100 flex flex-wrap gap-1'>
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <IconComponent className='w-4 h-4' />
                      {tab.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              <TabsContent value='summary' className='space-y-4 md:space-y-6'>
                <ConnectPayouts />
              </TabsContent>

              <TabsContent value='income' className='space-y-4 md:space-y-6'>
                <ConnectPayments />
              </TabsContent>

              <TabsContent value='plans' className='space-y-4 md:space-y-6'>
                <div className='p-6 border-b border-gray-100 flex justify-between items-center'>
                  <Button
                    className='bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl flex items-center gap-2'
                    onClick={() => setCreatingNew(true)}
                  >
                    <PlusCircle className='w-4 h-4' />
                    Novo Plano
                  </Button>
                </div>
                <div className='bg-gray-50 px-6 py-4 border-b border-gray-100'>
                  <div className='grid grid-cols-3 gap-4 font-semibold text-gray-700'>
                    <div>Nome</div>
                    <div>Valor</div>
                    <div>Ações</div>
                  </div>
                </div>

                <div className='divide-y divide-gray-100'>
                  {prices.map((price) => (
                    <div key={price.id}>
                      <div className='px-6 py-4 hover:bg-purple-50 transition-colors cursor-pointer grid grid-cols-4 gap-4 items-center'>
                        <div className='flex items-center gap-3'>
                          <div className='w-100 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold'>
                            {price.product.name}
                          </div>
                          <div className='font-medium text-gray-800'>
                            R${(price.unit_amount / 100).toFixed(2)}
                          </div>
                        </div>
                        <div className='font-semibold text-purple-600'></div>
                        <div className='flex space-x-2'>
                          <Button
                            className='p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors'
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingPlan(price)
                            }}
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button
                            className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingPlan(price)
                            }}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                          <Button
                            className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                            onClick={(e) => {
                              e.stopPropagation()
                              setReadjustmentPlan(price)
                            }}
                          >
                            <BanknoteArrowUp className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value='config' className='space-y-4 md:space-y-6'>
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
        }}
      >
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
        open={readjustmentPlan}
        onOpenChange={() => {
          setReadjustmentPlan(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{readjustmentPlan?.product.name}</DialogTitle>
          </DialogHeader>
          <ReadjustmentForm planData={readjustmentPlan} />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingPlan}
        onOpenChange={() => setDeletingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar "{deletingPlan?.product.name}"?
              <br />
              <br />
              Esta ação não pode ser desfeita e terá os efeitos:
              <br />• Arquivar o plano permanentement
              <br />• Não irá remover os dados relacionados
              <br />• Não irá cancelar as assinaturas relacionadas
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='bg-[#DC2626] hover:bg-[#DC2626]/90'
              onClick={() =>
                deletingPlan && deleteProfessional.mutate(deletingPlan.id)
              }
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
