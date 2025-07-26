import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function AuthPanel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 px-6 text-[#000000]">
      <h1 className="text-3xl font-bold">Bem-vindo</h1>
      <p className="text-[#7C7C7A] text-sm text-center">
        Acesse sua conta ou crie um novo cadastro
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          className="bg-[#FF5D73] text-white hover:bg-[#e14b64] w-full"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </div>
    </div>
  );
}
