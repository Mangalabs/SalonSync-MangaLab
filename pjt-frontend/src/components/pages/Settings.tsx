import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Save,
  Info,
  Shield,
  Palette,
  CheckCircle,
  Sun,
  Moon,
  Clock,
} from 'lucide-react'

import axios from '@/lib/axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubscriptionManagement } from '@/components/custom/management/SubscriptionManagement'
import { BranchManagement } from '@/components/custom/branch/BranchManagement'
import { BookingLinkGenerator } from '@/components/custom/BookingLinkGenerator'
import { BranchHoursModal } from '@/components/custom/BranchHoursModal'
import { useUser } from '@/contexts/UserContext'
import { useTheme } from '@/contexts/ThemeContext'
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

const modeOptions = [
  { value: 'light', name: 'Claro', icon: Sun },
  { value: 'dark', name: 'Escuro', icon: Moon },
]

const themeOptions = [
  {
    value: 'neutro',
    name: 'Neutro',
    description: 'Tons de preto, cinza e branco',
    icon: Palette,
    colors: ['#000000', '#666666', '#FFFFFF'],
  },
]

export default function Settings() {
  const { theme, mode, setTheme, setMode } = useTheme()
  const queryClient = useQueryClient()
  const { isAdmin } = useUser()
  const [resetSuccess, setResetSuccess] = useState(false)
  const [hoursModalOpen, setHoursModalOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-mode', mode)
  }, [theme, mode])

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
    <div className='space-y-6 mt-4'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-card-foreground'>
              <User className='h-5 w-5' />
              Dados Editáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={userForm.handleSubmit(onUserSubmit)}
              className='space-y-4'>
              <div>
                <Label htmlFor='phone' className='text-card-foreground'>
                  Telefone
                </Label>
                <Input
                  id='phone'
                  {...userForm.register('phone')}
                  format='phone'
                  className='bg-input text-foreground border-border'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Telefone de contato da empresa
                </p>
              </div>

              <Button
                type='submit'
                disabled={updateUser.isPending}
                className='flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/80 cursor-pointer'>
                <Save className='h-4 w-4' />
                {updateUser.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>

            <div className='mt-6 pt-6 border-t border-border'>
              <h4 className='font-medium text-card-foreground mb-3'>
                Dados Fixos
              </h4>
              <div className='space-y-2 text-sm text-muted-foreground'>
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
              <p className='text-xs text-muted-foreground mt-3'>
                Para alterar estes dados, entre em contato com o{' '}
                {isAdmin ? 'suporte' : 'administrador'}.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h3 className='text-lg font-semibold text-card-foreground mb-6'>
            Configurações do Sistema
          </h3>

          <div className='space-y-6'>
            <div>
              <h4 className='font-semibold text-card-foreground mb-4'>
                Backup e Segurança
              </h4>
              <div className='space-y-3'>
                <div className='p-4 border border-border rounded-xl'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-medium text-card-foreground'>
                      Alterar Senha
                    </span>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size='sm'
                          className='bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'>
                          Alterar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className='bg-card text-card-foreground border-border'>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className='text-muted-foreground'>
                            Enviaremos as instruções para redefinir sua senha no
                            email <strong>{user?.email}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className='bg-muted text-muted-foreground hover:bg-muted/80'>
                            Não
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => resetPasswordMutation.mutate()}
                            className='bg-primary text-primary-foreground hover:bg-primary/80'>
                            Sim
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Última alteração: 30 dias atrás
                  </p>
                  {resetSuccess && (
                    <p className='text-sm text-secondary mt-2'>
                      Instruções enviadas para {user?.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horários de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-card-foreground'>
            <Clock className='h-5 w-5' />
            Horários de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground mb-4'>
            Configure os horários de abertura e fechamento da filial ativa para
            cada dia da semana. Estes horários serão usados para gerar os
            horários disponíveis no calendário de agendamentos.
          </p>
          <Button
            onClick={() => setHoursModalOpen(true)}
            className='bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2'>
            <Clock className='w-4 h-4' />
            Personalizar Horários
          </Button>
        </CardContent>
      </Card>

      <BranchHoursModal
        open={hoursModalOpen}
        onOpenChange={setHoursModalOpen}
      />

      <BookingLinkGenerator />

      {isAdmin && (
        <>
          <BranchManagement />
          <SubscriptionManagement />
        </>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h3 className='mb-6 flex items-center gap-2 text-card-foreground'>
            <Palette className='w-5 h-5' />
            Aparência
          </h3>

          <div className='space-y-6'>
            <div>
              <h4 className='mb-4 text-card-foreground'>Modo do Sistema</h4>
              <div className='grid grid-cols-2 gap-3'>
                {modeOptions.map((modeOption) => {
                  const IconComponent = modeOption.icon
                  return (
                    <button
                      key={modeOption.value}
                      onClick={() =>
                        setMode(modeOption.value as 'light' | 'dark')
                      }
                      className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        mode === modeOption.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}>
                      <div
                        className={`w-16 h-12 border border-border rounded-lg mb-2 flex items-center justify-center ${
                          modeOption.value === 'light'
                            ? 'bg-background'
                            : 'bg-muted'
                        }`}>
                        <IconComponent className='w-6 h-6 text-primary' />
                      </div>
                      <span className='font-medium text-card-foreground'>
                        {modeOption.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className='mb-4 text-card-foreground'>Esquema de Cores</h4>
              <div className='space-y-4'>
                {themeOptions.map((themeOption) => {
                  const IconComponent = themeOption.icon
                  return (
                    <div
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as 'neutro')}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        theme === themeOption.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center'>
                            <IconComponent className='w-5 h-5 text-primary' />
                          </div>
                          <div>
                            <h5 className='font-semibold text-card-foreground'>
                              {themeOption.name}
                            </h5>
                            <p className='text-sm text-muted-foreground'>
                              {themeOption.description}
                            </p>
                          </div>
                        </div>
                        {theme === themeOption.value && (
                          <CheckCircle className='w-5 h-5 text-primary' />
                        )}
                      </div>

                      <div className='flex gap-2'>
                        {themeOption.colors.map((color, index) => (
                          <div
                            key={index}
                            className='w-6 h-6 rounded-full border-2 border-background'
                            style={{
                              backgroundColor: color,
                              borderColor: 'var(--color-text)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className='bg-card rounded-2xl p-6 shadow-sm border border-border'>
          <h3 className='text-lg font-semibold text-card-foreground mb-6 flex items-center gap-2'>
            <Info className='w-5 h-5' />
            Sobre o Sistema
          </h3>

          <div className='space-y-4'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Versão:</span>
              <span className='font-semibold text-card-foreground'>2.1.0</span>
            </div>

            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Última Atualização:</span>
              <span className='font-semibold text-card-foreground'>
                03/12/2025
              </span>
            </div>

            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Licença:</span>
              <span className='font-semibold text-card-foreground'>
                Premium
              </span>
            </div>

            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Suporte:</span>
              <span className='font-semibold text-secondary'>Ativo</span>
            </div>

            <div className='border-t border-border pt-4 mt-6'>
              <div className='flex space-x-3'>
                <button
                  onClick={() => (window.location.href = '/dashboard/help')}
                  className='flex-1 bg-muted text-card-foreground py-2 px-4 rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 cursor-pointer'>
                  <Info className='w-4 h-4' />
                  Ajuda
                </button>
                <button
                  onClick={() =>
                    window.open('https://w.app/suportesalonsync', '_blank')
                  }
                  className='flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-xl font-medium hover:bg-primary/80 transition-colors flex items-center justify-center gap-2 cursor-pointer'>
                  <Shield className='w-4 h-4' />
                  Suporte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
