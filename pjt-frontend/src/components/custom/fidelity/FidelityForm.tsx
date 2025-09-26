import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import axios from '@/lib/axios'

const schema = z.object({
  planName: z.string().min(2, 'Informe o nome'),
  value: z.number(),
})

type FormData = z.infer<typeof schema>

export function FidelityForm({
  initialData,
}: {
  initialData?: {
    product: {
      id: string
      name: string
    }
    id: string
    unit_amount: number
  } | null
}) {
  const queryClient = useQueryClient()
  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          planName: initialData.product.name,
          value: initialData.unit_amount / 100,
        }
      : {
          planName: '',
          value: null,
        },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        const res = await axios.post(
          '/api/payment/update-prices-for-connected-account',
          { ...data, planId: initialData.product.id, priceId: initialData.id }
        )
        return res.data
      } else {
        const res = await axios.post(
          '/api/payment/create-prices-for-connected-account',
          data
        )
        return res.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plano salvo!')
    },
    onError: () => {},
  })

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className='space-y-4'
    >
      <div>
        <Label htmlFor='planName'>Nome do Plano</Label>
        <Input placeholder='Plano Premium' {...register('planName')} />
        {errors.planName && (
          <p className='text-sm text-red-500'>{errors.planName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor='value'>Valor do Plano</Label>
        <Input
          placeholder='R$400,00'
          type='number'
          step='0.01'
          min='0'
          {...register('value', { valueAsNumber: true })}
        />
        {errors.value && (
          <p className='text-sm text-red-500'>{errors.value.message}</p>
        )}
      </div>

      <Button
        type='submit'
        disabled={isSubmitting}
        className='w-full bg-primary text-white'
      >
        {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
      </Button>
    </form>
  )
}
