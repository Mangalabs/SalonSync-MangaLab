import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProfessionalMovementModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    currentStock: number
    unit: string
  }
}

export function ProfessionalMovementModal({
  isOpen,
  onClose,
  product,
}: ProfessionalMovementModalProps) {
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')

  const queryClient = useQueryClient()

  const registerMovementMutation = useMutation({
    mutationFn: async (data: {
      quantity: number
      reason: string
      reference?: string
    }) => {
      console.log('Registrando movimentação e atualizando produto:', {
        productId: product.id,
        currentStock: product.currentStock,
        quantityUsed: data.quantity,
        newStock: product.currentStock - data.quantity,
      })

      const response = await axios.patch(`/api/products/${product.id}`, {
        unitWeight: product.currentStock - data.quantity,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['professional-products'] })
      queryClient.refetchQueries({ queryKey: ['professional-products'] })
      onClose()
      setQuantity('')
      setReason('')
      setReference('')
    },
    onError: () => {
      toast.error('Erro ao atualizar produto')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const quantityNum = parseFloat(quantity)
    if (!quantityNum || quantityNum <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    registerMovementMutation.mutate({
      quantity: quantityNum,
      reason: reason.trim() || 'Uso profissional',
      reference: reference.trim() || undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label className='text-sm font-medium text-gray-700'>
              Produto: {product.name}
            </Label>
            <p className='text-sm text-gray-500'>
              Estoque atual: {product.currentStock} {product.unit}
            </p>
          </div>

          <div>
            <Label htmlFor='quantity'>Quantidade Utilizada *</Label>
            <Input
              id='quantity'
              type='number'
              step='0.01'
              min='0.01'
              max={product.currentStock || 999999}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder='Ex: 2.5'
              required
            />
          </div>

          <div>
            <Label htmlFor='reason'>Motivo</Label>
            <Textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Ex: Procedimento de coloração'
            />
          </div>

          <div>
            <Label htmlFor='reference'>Referência (opcional)</Label>
            <Input
              id='reference'
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder='Ex: Cliente João Silva'
            />
          </div>

          <div className='flex gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='flex-1'>
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={registerMovementMutation.isPending}
              className='flex-1'>
              {registerMovementMutation.isPending
                ? 'Registrando...'
                : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
