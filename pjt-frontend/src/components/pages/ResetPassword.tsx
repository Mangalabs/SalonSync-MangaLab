import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const requestResetSchema = z.object({
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type RequestResetData = z.infer<typeof requestResetSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [erro, setErro] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetData>({
    resolver: zodResolver(requestResetSchema),
  })

  const onSubmit = async (data: RequestResetData) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/reset/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            token,
          }),
        },
      )

      const result = await res.json()

      if (!res.ok) {
        setErro(result.message || 'Erro ao resetar de senha')
        return
      }

      // eslint-disable-next-line no-alert
      alert('Email de redefinição de senha enviado')

      window.location.href = '/dashboard'
    } catch {
      setErro('Erro de conexão com o servidor')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6 px-4 md:px-6 md:flex h-screen w-screen">
      <div className="w-full max-w-md space-y-4 md:space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="h-24 md:h-28 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/logosalon-removebg-preview.png"
                alt="SalonSync Logo"
                className="max-h-700 md:max-h-700 max-w-48 md:max-w-56 object-contain"
              />
            </div>
            <p className="text-[#737373] mt-2 text-sm md:text-base">
              Redefinir Senha
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder="Senha"
                  type="password"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Confirmar Senha"
                  type="password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Confirmar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
