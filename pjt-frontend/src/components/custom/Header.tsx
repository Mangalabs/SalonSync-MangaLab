import { useNavigate } from "react-router-dom";
import { isAuthenticated, logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="w-full bg-[#FF5D73] text-white px-4 py-3 flex justify-between items-center">
      <h1 className="font-bold text-lg">Minha Aplicação</h1>
      {isAuthenticated() && (
        <Button
          variant="outline"
          className="text-[#FF5D73] bg-white hover:bg-pink-100"
          onClick={handleLogout}
        >
          Sair
        </Button>
      )}
    </header>
  );
}
