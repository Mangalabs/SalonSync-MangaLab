import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Shield, User, Scissors, ArrowRight, Lock, Mail } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type LoginData = z.infer<typeof loginSchema>;

export function LoginForm() {
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
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

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
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            SalonSync
          </CardTitle>
          <p className="text-gray-600 mt-2 font-medium">Bem-vindo de volta</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="E-mail" 
                  type="email" 
                  className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                  {...register('email')} 
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Senha" 
                  type="password" 
                  className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                  {...register('password')} 
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>
            
            {erro && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{erro}</p>}
            
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
            
            <div className="text-center">
              <a href="/reset-request" className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline">
                Esqueci minha senha
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card className="shadow-xl border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800">Tipos de Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Administrador</div>
              <div className="text-sm text-gray-600">Acesso completo ao sistema</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Profissional</div>
              <div className="text-sm text-gray-600">Dashboard, agendamentos e comissões</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}