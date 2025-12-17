import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PlusCircle,
  Scissors,
  Sparkles,
  Heart,
  Edit,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'

import { ServiceForm } from './ServiceForm'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration?: number
  icon?: string
  color?: string
  branchId?: string
}

const getServiceIcon = (iconType?: string) => {
  const iconClass = 'w-8 h-8 text-secondary-foreground'
  switch (iconType) {
    case 'scissors':
      return <Scissors className={iconClass} />
    case 'sparkles':
      return <Sparkles className={iconClass} />
    case 'heart':
      return <Heart className={iconClass} />
    default:
      return <Scissors className={iconClass} />
  }
}

export function ServiceTable() {
  const queryClient = useQueryClient()
  const { activeBranch } = useBranch()
  const { isAdmin } = useUser()
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)

  const {
    data: services,
    isLoading,
    error,
  } = useQuery<Service[]>({
    queryKey: ['services', activeBranch?.id],
    queryFn: async () => {
      const params = activeBranch?.id ? `?branchId=${activeBranch.id}` : ''
      const res = await axios.get(`/api/services${params}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/services/${id}`, {
        headers: {
          'X-Skip-Toast': 'true',
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['services', activeBranch?.id],
      })
      toast.success('Serviço excluído com sucesso!')
      setDeletingService(null)
    },
    onError: (error: any) => {
      const errorMessage =
        error.userMessage ||
        error.response?.data?.message ||
        error.message ||
        'Erro ao excluir serviço. Tente novamente.'

      toast.error(errorMessage)
      setDeletingService(null)
    },
  })

  if (isLoading) {
    return (
      <div className='bg-card rounded-2xl p-6 shadow-sm border border-theme'>
        <div className='flex justify-between items-center mb-6'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-10 w-32' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className='border border-theme rounded-xl overflow-hidden bg-card shadow-sm'>
              <Skeleton className='h-32 w-full' />
              <div className='p-6 space-y-3'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
                <div className='flex justify-between items-center'>
                  <Skeleton className='h-6 w-20' />
                  <Skeleton className='h-5 w-16' />
                </div>
                <div className='flex space-x-2'>
                  <Skeleton className='h-8 flex-1' />
                  <Skeleton className='h-8 flex-1' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (error) {
    return <p className='text-red-500'>Erro ao carregar serviços</p>
  }

  return (
    <div
      className='rounded-2xl p-6 shadow-sm border'
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}>
      <div className='flex justify-between items-center mb-6'>
        <h3 style={{ color: 'var(--color-card-foreground)', fontWeight: 600 }}>
          Catálogo de Serviços
        </h3>
        <Dialog
          open={!!editingService && !editingService.id}
          onOpenChange={() => setEditingService(null)}>
          <DialogContent
            style={{
              backgroundColor: 'var(--color-popover)',
              color: 'var(--color-popover-foreground)',
            }}>
            <DialogHeader>
              <DialogTitle>Novo Serviço</DialogTitle>
            </DialogHeader>
            <ServiceForm onSuccess={() => setEditingService(null)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {services && services.length > 0
          ? services.map((service) => (
              <div
                key={service.id}
                className='rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border'
                style={{
                  backgroundColor: 'var(--color-popover)',
                  borderColor: 'var(--color-border)',
                }}>
                <div
                  className='h-32 flex items-center justify-center'
                  style={{
                    background: service.color || 'var(--color-accent)',
                  }}>
                  {getServiceIcon(service.icon)}
                </div>
                <div className='p-6'>
                  <h4
                    style={{
                      color: 'var(--color-card-foreground)',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                    }}>
                    {service.name}
                  </h4>
                  {service.description && (
                    <p
                      style={{
                        color: 'var(--color-muted-foreground)',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                      }}>
                      {service.description}
                    </p>
                  )}

                  <div className='flex justify-between items-center mb-2'>
                    <span
                      style={{
                        color: 'var(--color-secondary-foreground)',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}>
                      R$ {Number(service.price).toFixed(2).replace('.', ',')}
                    </span>
                    <span
                      style={{
                        color: 'var(--color-muted-foreground)',
                        backgroundColor: 'var(--color-muted)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                      }}>
                      {service.duration || 30}min
                    </span>
                  </div>

                  {isAdmin && (
                    <p style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: service.branchId
                            ? 'var(--color-accent)'
                            : 'var(--color-secondary)',
                          color: service.branchId
                            ? 'var(--color-accent-foreground)'
                            : 'var(--color-secondary-foreground)',
                        }}>
                        {service.branchId ? 'Filial' : 'Global'}
                      </span>
                    </p>
                  )}

                  <div className='mt-4 flex space-x-2'>
                    <button
                      onClick={() => setEditingService(service)}
                      className='flex-1 bg-blue-100 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center gap-1'>
                      <Edit className='w-3 h-3' />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeletingService(service)}
                      disabled={deleteService.isPending}
                      className='flex-1 bg-red-100 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1'>
                      <Trash2 className='w-3 h-3' />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          : null}

        <div
          className='rounded-xl p-8 flex items-center justify-center border-2 border-dashed transition-all duration-300 cursor-pointer hover:opacity-90'
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-popover)',
          }}
          onClick={() => setEditingService({ id: '', name: '', price: 0 })}>
          <div className='text-center'>
            <PlusCircle className='w-12 h-12 text-muted-foreground mb-3 mx-auto' />
            <h4
              style={{
                color: 'var(--color-muted-foreground)',
                fontWeight: 500,
                marginBottom: '0.25rem',
              }}>
              Adicionar Novo Serviço
            </h4>
            <p
              style={{
                color: 'var(--color-muted-foreground)',
                fontSize: '0.875rem',
              }}>
              Expanda seu catálogo com novos serviços
            </p>
          </div>
        </div>
      </div>

      <Dialog
        open={!!editingService && !!editingService.id}
        onOpenChange={() => setEditingService(null)}>
        <DialogContent
          style={{
            backgroundColor: 'var(--color-popover)',
            color: 'var(--color-popover-foreground)',
          }}>
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          <ServiceForm
            initialData={
              editingService
                ? {
                    ...editingService,
                    price: String(editingService.price),
                    duration: editingService.duration
                      ? String(editingService.duration)
                      : '30',
                  }
                : undefined
            }
            onSuccess={() => setEditingService(null)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingService}
        onOpenChange={() => setDeletingService(null)}>
        <AlertDialogContent className='bg-card'>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              Tem certeza que deseja excluir o serviço "{deletingService?.name}
              "?
              <br />
              <br />
              Esta ação não pode ser desfeita.
              {deletingService && (
                <>
                  <br />
                  <br />
                  <strong>Nota:</strong> Serviços que possuem agendamentos
                  vinculados não podem ser excluídos.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/80'
              onClick={() =>
                deletingService && deleteService.mutate(deletingService.id)
              }>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
