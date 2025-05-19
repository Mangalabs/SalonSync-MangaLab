import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const registerSchema = z
  .object({
    email: z.string().email("Informe um e-mail válido"),
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 w-full max-w-sm mx-auto"
    >
      <div>
        <Input placeholder="E-mail" type="email" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>
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
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button
        type="submit"
        className="w-full bg-[#FF5D73] text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Registrando..." : "Registrar"}
      </Button>
    </form>
  );
}
