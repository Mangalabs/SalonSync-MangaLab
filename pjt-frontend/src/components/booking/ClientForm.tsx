import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal(''))
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void
  onBack: () => void
}

export function ClientForm({ onSubmit, onBack }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    mode: 'onChange'
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Seus dados</h2>
        <p className="text-gray-600">Precisamos de algumas informações para confirmar seu agendamento</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome completo *
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Digite seu nome completo"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone *
          </label>
          <Input
            {...register('phone')}
            format="phone"
            onRawChange={(rawValue) => setValue('phone', rawValue)}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="(11) 99999-9999"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (opcional)
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">Informações importantes</p>
              <p className="text-sm text-blue-700 mt-1">
                Seus dados serão utilizados apenas para confirmar o agendamento e entrar em contato se necessário.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  )
}