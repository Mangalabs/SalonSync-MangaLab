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
    <header className="w-full bg-[#1A1A1A] text-white px-4 py-3 flex justify-between items-center shadow-md">
      <h1 className="font-bold text-lg md:text-xl text-[#D4AF37]">SalonSync</h1>
      {isAuthenticated() && (
        <Button
          variant="outline"
          className="text-[#1A1A1A] bg-[#D4AF37] hover:bg-[#B8941F] border-[#D4AF37] text-sm md:text-base"
          onClick={handleLogout}
        >
          Sair
        </Button>
      )}
    </header>
  );
}
