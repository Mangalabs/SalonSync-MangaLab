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
  value: z.number(),
})

type FormData = z.infer<typeof schema>

export function ReadjustmentForm({
  planData,
}: {
  planData?: {
    product: {
      id: string
    }
    id: string
    unit_amount: number
  } | null
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      value: planData?.unit_amount / 100,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await axios.post(
        '/api/payment/price-readjustment-for-connected-account',
        { ...data, productId: planData.product.id, priceId: planData.id },
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast.success('Plano Reajustado!')
    },
    onError: () => {},
  })

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className='space-y-4'
    >
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
        {isSubmitting ? 'Salvando...' : 'Reajustar Valor'}
      </Button>
    </form>
  )
}
