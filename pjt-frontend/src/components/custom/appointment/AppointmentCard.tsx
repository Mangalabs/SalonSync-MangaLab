import { useState } from 'react'
import { Calendar, User, DollarSign, X, Check, Edit, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import axios from '@/lib/axios'
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

import { AppointmentForm } from './AppointmentForm'

interface Appointment {
  id: string;
  scheduledAt: string;
  status?: string;
  professional: { name: string } | null;
  client: { name: string };
  appointmentServices: {
    service: { name: string; price: string };
  }[];
  total: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  mode?: 'scheduled' | 'completed';
  compact?: boolean;
}

export function AppointmentCard({
  appointment,
  mode,
  compact = false,
}: AppointmentCardProps) {
  const queryClient = useQueryClient()

  const [openConfirmationModal, setOpenConfirmationModal] = useState<boolean | null>(
    null,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const aptDate = new Date(appointment.scheduledAt)
  const now = new Date()
  const isPast = aptDate <= now
  const isCompleted = appointment.status === 'COMPLETED'

  const cancelAppointment = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/cancel`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  const deleteAppointment = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/appointments/${appointment.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setIsDeleting(false)
    },
  })

  const confirmAppointment = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/appointments/${appointment.id}/confirm`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  if (compact) {
    return (
      <>
        <div className="border rounded p-2 bg-white text-sm">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium text-xs">
                {aptDate.toLocaleDateString('pt-BR')} às{' '}
                {aptDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span className="font-semibold text-xs">
                R$ {Number(appointment.total).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <User className="h-3 w-3" />
            <span className="text-xs">{appointment.client.name}</span>
          </div>
          <div className="text-xs text-[#737373] mb-1">
            {appointment.professional?.name || 'Profissional removido'}
          </div>
          <div className="text-xs text-[#737373] mb-2">
            {appointment.appointmentServices
              .map((as) => as.service.name)
              .join(', ')}
          </div>
          
          {mode === 'completed' && (
            <div className="flex gap-1 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-6 px-2 text-xs"
              >
                <Edit size={10} className="mr-1" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleting(true)}
                className="h-6 px-2 text-xs"
              >
                <Trash2 size={10} className="mr-1" />
                Excluir
              </Button>
            </div>
          )}
        </div>
        
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Atendimento</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              mode="immediate"
              initialData={appointment}
              onSuccess={() => setIsEditing(false)}
            />
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAppointment.mutate()}
                disabled={deleteAppointment.isPending}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <div
      className={`border rounded-lg p-3 md:p-4 ${
        isCompleted
          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20'
          : isPast
            ? 'bg-[#F0F0EB] border-muted-foreground/20'
            : 'bg-white'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium text-sm sm:text-base">
            {aptDate.toLocaleDateString('pt-BR')} às{' '}
            {aptDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          <span className="font-semibold text-sm sm:text-base">
            R$ {Number(appointment.total).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4" />
        <span className="font-medium text-sm sm:text-base">
          {appointment.client.name}
        </span>
      </div>

      <div className="text-xs sm:text-sm text-[#737373] mb-2">
        <strong>Profissional:</strong> {appointment.professional?.name || 'Profissional removido'}
      </div>

      <div className="text-xs sm:text-sm text-[#737373] mb-3">
        <strong>Serviços:</strong>{' '}
        {appointment.appointmentServices
          .map((as) => as.service.name)
          .join(', ')}
      </div>

      {mode === 'scheduled' && !isCompleted && (
        <div className="flex flex-col sm:flex-row gap-2">
          {isPast ? (
            <>
              <Button
                size="sm"
                onClick={() => confirmAppointment.mutate()}
                disabled={confirmAppointment.isPending}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-[#1A1A1A]"
              >
                <Check size={14} className="mr-1" />
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => cancelAppointment.mutate()}
                disabled={cancelAppointment.isPending}
              >
                <X size={14} className="mr-1" />
                Não Compareceu
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpenConfirmationModal(true)}
              disabled={cancelAppointment.isPending}
              className="w-full text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEF2F2]"
            >
              <X size={14} className="mr-1" />
              Cancelar Agendamento
            </Button>
          )}
        </div>
      )}

      <AlertDialog
        open={!!openConfirmationModal}
        onOpenChange={() => setOpenConfirmationModal(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelAppointment.mutate()
              }
            >
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
