import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState } from "react";

const requestResetSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

type RequestResetData = z.infer<typeof requestResetSchema>;

export default function ResetRequest() {
  const [erro, setErro] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetData>({
    resolver: zodResolver(requestResetSchema),
  });

  const onSubmit = async (data: RequestResetData) => {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/reset/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setErro(result.message || "Erro ao solicitar reset de senha");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setErro("Erro de conexão com o servidor");
    }
  };

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
              Esqueci Minha Senha
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder="E-mail"
                  type="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Confirmar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
