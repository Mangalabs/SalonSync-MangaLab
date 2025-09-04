import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  price: z.coerce.number().positive('Preço deve ser maior que zero'),
  branchId: z.string().optional(),
})

type FormData = z.infer<typeof schema>;

export function ServiceForm({ 
  onSuccess, 
  initialData, 
}: { 
  onSuccess: () => void;
  initialData?: { id: string; name: string; price: string; branchId?: string } | null;
}) {
  const isEditing = !!initialData
  const { isAdmin } = useUser()
  const { activeBranch } = useBranch()
  
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches')
      return res.data
    },
    enabled: isAdmin,
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      price: initialData ? Number(initialData.price) : 0,
      branchId: !isAdmin ? activeBranch?.id : (initialData?.branchId || undefined),
    },
  })

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('🔧 ServiceForm: Submitting data:', data)
      
      const payload = {
        name: data.name,
        price: data.price,
      }
      
      const config = {
        headers: data.branchId ? { 'x-branch-id': data.branchId } : { 'x-skip-branch-header': 'true' },
      }
      
      console.log('🔧 ServiceForm: Config:', config)
      
      if (isEditing) {
        const res = await axios.patch(`/api/services/${initialData.id}`, payload, config)
        return res.data
      } else {
        const res = await axios.post('/api/services', payload, config)
        return res.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      reset()
      onSuccess()
    },
    onError: (error) => {
      console.log('❌ Service mutation error:', error)
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-4"
    >
      {isAdmin && (
        <div>
          <Label htmlFor="branchId">Escopo do Serviço</Label>
          <Select 
            onValueChange={(value) => setValue('branchId', value === 'global' ? undefined : value)} 
            defaultValue={initialData?.branchId ? initialData.branchId : 'global'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o escopo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global (todas as filiais)</SelectItem>
              {branches.map((branch: any) => (
                <SelectItem key={branch.id} value={branch.id}>
                  Apenas {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Serviços globais ficam disponíveis em todas as suas filiais
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="name">Nome do Serviço</Label>
        <Input id="name" placeholder="Nome do serviço" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          placeholder="0,00"
          type="number"
          step="0.01"
          min="0"
          {...register('price')}
        />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
        )}
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary text-white"
      >
        {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
      </Button>
    </form>
  )
}
