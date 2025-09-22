import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Save, Info, Shield } from 'lucide-react'

import axios from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubscriptionManagement } from '@/components/custom/management/SubscriptionManagement'
import { BranchManagement } from '@/components/custom/branch/BranchManagement'
import { useUser } from '@/contexts/UserContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const userSchema = z.object({
  phone: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

export default function Settings() {
  const queryClient = useQueryClient()
  const { isAdmin } = useUser()
  const [resetSuccess, setResetSuccess] = useState(false)

  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await axios.get('/api/auth/profile')
      return res.data
    },
  })

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    values: {
      phone: user?.phone || '',
    },
  })

  const updateUser = useMutation({
    mutationFn: async (data: UserFormData) => {
      await axios.patch('/api/auth/profile', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/api/reset/generate', { email: user?.email })
    },
    onSuccess: () => {
      setResetSuccess(true)
    },
  })

  const onUserSubmit = (data: UserFormData) => {
    updateUser.mutate(data)
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Dados Editáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={userForm.handleSubmit(onUserSubmit)}
              className='space-y-4'>
              <div>
                <Label htmlFor='phone'>Telefone</Label>
                <Input
                  id='phone'
                  {...userForm.register('phone')}
                  placeholder='(11) 99999-9999'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Telefone de contato da empresa
                </p>
              </div>

              <Button
                type='submit'
                disabled={updateUser.isPending}
                className='flex items-center gap-2'>
                <Save className='h-4 w-4' />
                {updateUser.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>

            <div className='mt-6 pt-6 border-t'>
              <h4 className='font-medium text-gray-900 mb-3'>Dados Fixos</h4>
              <div className='space-y-2 text-sm text-gray-600'>
                <p>
                  <strong>Nome:</strong> {user?.name || 'Não informado'}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                {isAdmin ? (
                  <p>
                    <strong>Empresa:</strong>{' '}
                    {user?.businessName || 'Não informado'}
                  </p>
                ) : (
                  <p>
                    <strong>Filial:</strong>{' '}
                    {user?.branchName || 'Não informado'}
                  </p>
                )}
              </div>
              <p className='text-xs text-gray-500 mt-3'>
                Para alterar estes dados, entre em contato com o{' '}
                {isAdmin ? 'suporte' : 'administrador'}.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-800 mb-6'>
            Configurações do Sistema
          </h3>

          <div className='space-y-6'>
            <div>
              <h4 className='font-semibold text-gray-800 mb-4'>
                Backup e Segurança
              </h4>
              <div className='space-y-3'>
                <div className='p-4 border border-gray-200 rounded-xl'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-medium'>Alterar Senha</span>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size='sm'>Alterar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Enviaremos as instruções para redefinir sua senha no
                            email <strong>{user?.email}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Não</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => resetPasswordMutation.mutate()}>
                            Sim
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <p className='text-sm text-gray-500'>
                    Última alteração: 30 dias atrás
                  </p>
                  {resetSuccess && (
                    <p className='text-sm text-green-600 mt-2'>
                      Instruções enviadas para {user?.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className='font-semibold text-gray-800 mb-4'>Integrações</h4>
              <div className='space-y-3'>
                {/* {integrations.map((integration, index) => ( */}
                <div className='flex items-center justify-between p-4 border border-gray-200 rounded-xl'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                      {/* <integration.icon className={`w-5 h-5 text-${integration.color}-600`} /> */}
                    </div>
                    <div>
                      {/* <span className="font-medium">{integration.name}</span> */}
                      <p className='text-sm text-gray-500'>
                        {/* {integration.status === 'connected' ? 'Conectado' : 'Não configurado'} */}
                      </p>
                    </div>
                  </div>
                  {/* {integration.status === 'connected' ? ( */}
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  {/* ) : ( */}
                  <button className='text-sm text-purple-600 hover:text-purple-800 font-medium'>
                    Configurar
                  </button>
                  {/* )} */}
                </div>
                {/* ))} */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isAdmin && (
        <>
          <BranchManagement />
          <SubscriptionManagement />
        </>
      )}

      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <h3 className='text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2'>
          <Info className='w-5 h-5' />
          Sobre o Sistema
        </h3>

        <div className='space-y-4'>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Versão:</span>
            <span className='font-semibold'>2.1.0</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-600'>Última Atualização:</span>
            <span className='font-semibold'>15/12/2023</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-600'>Licença:</span>
            <span className='font-semibold'>Premium</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-600'>Suporte:</span>
            <span className='font-semibold text-green-600'>Ativo</span>
          </div>

          <div className='border-t pt-4 mt-6'>
            <div className='flex space-x-3'>
              <button className='flex-1 bg-purple-100 text-purple-700 py-2 px-4 rounded-xl font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-2'>
                <Info className='w-4 h-4' />
                Ajuda
              </button>
              <button className='flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-xl font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-2'>
                <Shield className='w-4 h-4' />
                Suporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
