import { useState } from "react";
import { ChevronDown, Shield, UserCheck, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranch } from "@/contexts/BranchContext";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { activeBranch, branches, setActiveBranch } = useBranch();
  const { user, isAdmin, logout } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleBranchChange = async (branchId: string) => {
    setIsLoading(true);
    try {
      const branch = branches.find((b) => b.id === branchId);
      if (branch) {
        setActiveBranch(branch);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettings = () => {
    navigate("/dashboard/settings");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-2 rounded-lg transition hover:bg-white/10 bg-white/5 w-full justify-start"
          disabled={isLoading}
        >
          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20">
            {isAdmin ? (
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            ) : (
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              {user?.name || user?.email || "Usuário"}
            </p>
            <p className="text-xs text-white/60 truncate">
              {isAdmin ? "Admin" : "Prof."} • {activeBranch?.name || "Sem filial"}
            </p>
          </div>
          <ChevronDown size={14} className="text-white/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleSettings} className="flex items-center gap-2">
          <Settings size={16} />
          Configurações
        </DropdownMenuItem>
        
        {isAdmin && branches.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Trocar Filial
            </div>
            {branches.map((branch) => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => handleBranchChange(branch.id)}
                className={`flex items-center gap-2 ${
                  activeBranch?.id === branch.id ? "bg-primary/10" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium">{branch.name}</div>
                  {branch.address && (
                    <div className="text-xs text-muted-foreground">
                      {branch.address}
                    </div>
                  )}
                </div>
                {activeBranch?.id === branch.id && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-600">
          <LogOut size={16} />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}