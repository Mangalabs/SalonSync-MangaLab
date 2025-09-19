import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowRight, Scissors, ArrowLeft } from 'lucide-react'

const requestResetSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
})

type RequestResetData = z.infer<typeof requestResetSchema>;

export default function ResetRequest() {
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
        import.meta.env.VITE_API_URL + '/api/reset/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      )

      const result = await res.json()

      if (!res.ok) {
        setErro(result.message || 'Erro ao solicitar reset de senha')
        return
      }

      window.location.href = '/dashboard'
    } catch {
      setErro('Erro de conexão com o servidor')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Scissors className="text-white w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              SalonSync
            </CardTitle>
            <p className="text-gray-600 mt-2 font-medium">
              Esqueci Minha Senha
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Digite seu e-mail para receber as instruções de recuperação
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              
              {erro && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{erro}</p>}
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Enviar Instruções
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
              
              <div className="text-center">
                <a href="/login" className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Login
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
