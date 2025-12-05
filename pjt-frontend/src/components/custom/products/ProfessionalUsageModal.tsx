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

interface ProfessionalUsageModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    unitWeight: number
    unit: string
    costPrice: number
    markupPercent: number
  }
}

export function ProfessionalUsageModal({
  isOpen,
  onClose,
  product,
}: ProfessionalUsageModalProps) {
  const [quantityUsed, setQuantityUsed] = useState('')
  const [reason, setReason] = useState('')
  const [clientReference, setClientReference] = useState('')

  const queryClient = useQueryClient()

  const costPerUnit = product.costPrice / product.unitWeight
  const costWithMarkup = costPerUnit * (1 + product.markupPercent / 100)
  const usageQuantity = parseFloat(quantityUsed) || 0
  const totalCost = usageQuantity * costWithMarkup

  const usageRegistration = useMutation({
    mutationFn: async (data: {
      quantityUsed: number
      reason: string
      clientReference?: string
    }) => {
      const totalCost = data.quantityUsed * costWithMarkup

      const validUnitCost =
        isFinite(costWithMarkup) && costWithMarkup > 0
          ? Number(costWithMarkup.toFixed(4))
          : undefined
      const validTotalCost =
        isFinite(totalCost) && totalCost > 0
          ? Number(totalCost.toFixed(2))
          : undefined

      const response = await axios.post(
        `/api/products/${product.id}/professional-movement`,
        {
          quantity: data.quantityUsed,
          unitCost: validUnitCost,
          totalCost: validTotalCost,
          reason: data.reason,
          reference: data.clientReference,
        }
      )
      return response.data
    },
    onSuccess: (result) => {
      const cost =
        totalCost || (result.totalCost ? Number(result.totalCost) : 0)
      toast.success(`Uso registrado! Custo: R$ ${cost.toFixed(2)}`)

      queryClient.setQueryData(
        ['professional-products', queryClient.getQueryData(['activeBranch'])],
        (oldData: any) => {
          if (!oldData) return oldData
          return oldData.map((p: any) =>
            p.id === product.id
              ? { ...p, unitWeight: product.unitWeight - usageQuantity }
              : p
          )
        }
      )

      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['professional-products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.refetchQueries({ queryKey: ['professional-products'] })
      onClose()
      setQuantityUsed('')
      setReason('')
      setClientReference('')
    },
    onError: (error: any) => {
      console.error('Erro ao registrar uso:', error)
      let errorMessage = 'Erro ao registrar uso do produto'

      try {
        if (error.response?.data?.message) {
          if (Array.isArray(error.response.data.message)) {
            errorMessage = error.response.data.message[0]
          } else if (typeof error.response.data.message === 'string') {
            errorMessage = error.response.data.message
          }
        }
      } catch (e) {
        console.error('Erro ao processar mensagem de erro:', e)
      }

      toast.error(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const quantity = parseFloat(quantityUsed)
    if (!quantity || quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    if (quantity > product.unitWeight) {
      toast.error(
        `Quantidade não pode ser maior que o disponível (${product.unitWeight} ${product.unit})`
      )
      return
    }

    usageRegistration.mutate({
      quantityUsed: quantity,
      reason: reason.trim() || 'Uso profissional',
      clientReference: clientReference.trim() || undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Registrar Uso Profissional</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='bg-purple-50 border border-purple-200 rounded-lg p-3'>
            <div className='text-sm font-medium text-purple-800'>
              {product.name}
            </div>
            <div className='text-xs text-purple-600'>
              Disponível: {product.unitWeight} {product.unit}
            </div>
            <div className='text-xs text-purple-600'>
              Custo por {product.unit}: R$ {costWithMarkup.toFixed(4)}
            </div>
          </div>

          <div>
            <Label htmlFor='quantity'>Quantidade Utilizada *</Label>
            <Input
              id='quantity'
              type='number'
              step='0.01'
              min='0.01'
              max={product.unitWeight}
              value={quantityUsed}
              onChange={(e) => setQuantityUsed(e.target.value)}
              placeholder={`Ex: 2.5 ${product.unit}`}
              required
            />
            {usageQuantity > 0 && (
              <p className='text-xs text-green-600 mt-1'>
                Custo total: R$ {totalCost.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='reason'>Procedimento/Motivo</Label>
            <Textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='Ex: Coloração, Hidratação, Corte'
            />
          </div>

          <div>
            <Label htmlFor='client'>Cliente (opcional)</Label>
            <Input
              id='client'
              value={clientReference}
              onChange={(e) => setClientReference(e.target.value)}
              placeholder='Ex: João Silva'
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
              disabled={usageRegistration.isPending}
              className='flex-1 bg-purple-600 hover:bg-purple-700'>
              {usageRegistration.isPending ? 'Registrando...' : 'Registrar Uso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
