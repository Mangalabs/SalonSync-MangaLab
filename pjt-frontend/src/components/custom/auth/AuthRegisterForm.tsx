import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Scissors, ArrowRight, User, Building, Lock, Mail, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Informe um e-mail válido'),
    businessName: z
      .string()
      .min(2, 'Nome do negócio deve ter no mínimo 2 caracteres'),
    city: z.string().min(2, 'Nome do negócio deve ter no mínimo 2 caracteres'),
    country: z
      .string()
      .min(2, 'Nome do negócio deve ter no mínimo 2 caracteres'),
    line1: z.string().min(2, 'Nome do negócio deve ter no mínimo 2 caracteres'),
    postal_code: z
      .string()
      .min(2, 'Nome do negócio deve ter no mínimo 2 caracteres'),
    state: z.string().min(2, 'Nome do negócio deve ter no mínimo 2 caracteres'),
    branches: z
      .array(
        z.object({
          name: z
            .string()
            .min(2, 'Nome da filial deve ter no mínimo 2 caracteres'),
        }),
      )
      .min(1, 'Deve ter pelo menos uma filial'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

type RegisterData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const navigate = useNavigate()
  const [erro, setErro] = useState('')
  const [branches, setBranches] = useState([{ name: '' }])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      branches: [{ name: '' }],
    },
  })

  const addBranch = () => {
    const newBranches = [...branches, { name: '' }]
    setBranches(newBranches)
    setValue('branches', newBranches)
  }

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      const newBranches = branches.filter((_, i) => i !== index)
      setBranches(newBranches)
      setValue('branches', newBranches)
    }
  }

  const onSubmit = async (data: RegisterData) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/auth/create-admin',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            name: data.name,
            businessName: data.businessName,
            branches: data.branches,
          }),
        },
      )

      const result = await res.json()

      if (!res.ok) {
        setErro(result.message || 'Erro ao registrar')
        return
      }

      localStorage.setItem('token', result.token)
      navigate(`/checkout?userId=${result.id}`)
    } catch {
      setErro('Erro de conexão com o servidor')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            SalonSync
          </CardTitle>
          <h3 className="text-xl font-semibold text-gray-800 mt-2">
            Registrar Empresa
          </h3>
          <p className="text-gray-600 mt-1">Crie sua conta de administrador</p>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mt-4 max-w-2xl mx-auto">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Atenção:</strong> Este registro é apenas para proprietários de empresas. Funcionários devem ser criados pelo administrador após o login.
            </p>
          </div>
          
          <div className="mt-4">
            <a href="/login" className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline">
              Já tem conta? Faça login aqui
            </a>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Dados Pessoais
                </h3>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Seu nome completo" 
                    className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                    {...register('name')} 
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

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
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  Seu Negócio
                </h3>

                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Nome do seu negócio"
                    className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    {...register('businessName')}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="Cidade" 
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                      {...register('city')} 
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="Estado" 
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                      {...register('state')} 
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="País" 
                    className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                    {...register('country')} 
                  />
                  {errors.country && (
                    <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="Endereço" 
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                      {...register('line1')} 
                    />
                    {errors.line1 && (
                      <p className="text-sm text-red-500 mt-1">{errors.line1.message}</p>
                    )}
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      placeholder="CEP" 
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500" 
                      {...register('postal_code')} 
                    />
                    {errors.postal_code && (
                      <p className="text-sm text-red-500 mt-1">{errors.postal_code.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-gray-800 flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    Filiais
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBranch}
                    className="flex items-center gap-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {branches.map((_, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder={index === 0 ? 'Matriz' : `Filial ${index + 1}`}
                        className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        {...register(`branches.${index}.name` as const)}
                      />
                      {errors.branches?.[index]?.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.branches[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    {branches.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBranch(index)}
                        className="px-3 h-12 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-600" />
                  Segurança
                </h3>

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

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Confirmar senha"
                    type="password"
                    className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {erro && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{erro}</p>}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Criando conta...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Criar Conta
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
