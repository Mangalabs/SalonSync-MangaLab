import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function AuthPanel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 px-6 text-[#2C2C2C]">
      <h1 className="text-3xl font-bold text-primary">SalonSync</h1>
      <h2 className="text-xl font-medium text-[#D4AF37]">Bem-vindo</h2>
      <p className="text-[#737373] text-sm text-center">
        Acesse sua conta ou crie um novo cadastro
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          className="w-full"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </div>
    </div>
  );
}
