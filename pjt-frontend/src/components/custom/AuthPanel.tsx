import { Button } from "@/components/ui/button";

export function AuthPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 px-6 text-[#000000]">
      <h1 className="text-3xl font-bold">Bem-vindo</h1>
      <p className="text-[#7C7C7A] text-sm text-center">
        Acesse sua conta ou crie um novo cadastro
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button className="bg-[#FF5D73] text-white hover:bg-[#e14b64] w-full">
          Login
        </Button>
        <Button
          variant="outline"
          className="border-[#FF5D73] text-[#FF5D73] hover:bg-[#ffe4e8] w-full"
        >
          Registrar
        </Button>
      </div>
    </div>
  );
}
