import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("Informe um e-mail válido"),
    businessName: z.string().min(2, "Nome do negócio deve ter no mínimo 2 caracteres"),
    branches: z.array(z.object({
      name: z.string().min(2, "Nome da filial deve ter no mínimo 2 caracteres")
    })).min(1, "Deve ter pelo menos uma filial"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

type RegisterData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const navigate = useNavigate();
  const [erro, setErro] = useState("");
  const [branches, setBranches] = useState([{ name: "" }]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      branches: [{ name: "" }]
    }
  });

  const addBranch = () => {
    const newBranches = [...branches, { name: "" }];
    setBranches(newBranches);
    setValue('branches', newBranches);
  };

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      const newBranches = branches.filter((_, i) => i !== index);
      setBranches(newBranches);
      setValue('branches', newBranches);
    }
  };

  const onSubmit = async (data: RegisterData) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          businessName: data.businessName,
          branches: data.branches,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErro(result.message || "Erro ao registrar");
        return;
      }

      localStorage.setItem("token", result.token);
      navigate("/dashboard");
    } catch (err) {
      setErro("Erro de conexão com o servidor");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Criar Conta</h2>
        <p className="text-gray-600 mt-2">Configure seu negócio</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Dados Pessoais</h3>
          
          <div>
            <Input placeholder="Seu nome completo" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Input placeholder="E-mail" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Seu Negócio</h3>
          
          <div>
            <Input placeholder="Nome do seu negócio" {...register("businessName")} />
            {errors.businessName && (
              <p className="text-sm text-red-500 mt-1">{errors.businessName.message}</p>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Filiais</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBranch}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar Filial
              </Button>
            </div>
            
            {branches.map((_, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    placeholder={index === 0 ? "Matriz" : `Filial ${index + 1}`}
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
                    className="px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Segurança</h3>
          
          <div>
            <Input placeholder="Senha" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <div>
            <Input
              placeholder="Confirmar senha"
              type="password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
        
        {erro && <p className="text-sm text-red-600 text-center">{erro}</p>}
        
        <Button
          type="submit"
          className="w-full bg-[#FF5D73] text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Criando conta..." : "Criar Conta"}
        </Button>
      </form>
    </div>
  );
}
