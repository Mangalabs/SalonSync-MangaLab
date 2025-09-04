import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Shield, User } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type LoginData = z.infer<typeof loginSchema>;

export function AuthPanel() {
  const [erro, setErro] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      )

      const result = await res.json()

      if (!res.ok) {
        setErro(result.message || 'Erro ao fazer login')
        return
      }

      localStorage.setItem('token', result.token)
      window.location.href = '/dashboard'
    } catch {
      setErro('Erro de conexão com o servidor')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 md:space-y-6 px-4 md:px-6">
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
              Entrar no Sistema
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder="E-mail"
                  type="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
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
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          <div className="flex flex-row items-center justify-center h-full space-y-4 md:space-y-6 px-4 md:px-6">
            <a href="/request-reset" className="m-auto text-sm md:text-base">
              Esqueci minha senha
            </a>
            <a href="/register" className="m-auto text-sm md:text-base">
              Registro
            </a>
          </div>
        </Card>

        <Card className="md:block hidden">
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-[#D4AF37]" />
              <div>
                <div className="font-medium">Administrador</div>
                <div className="text-[#737373]">Acesso completo ao sistema</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-[#8B4513]" />
              <div>
                <div className="font-medium">Profissional</div>
                <div className="text-[#737373]">
                  Dashboard, agendamentos e comissões
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
