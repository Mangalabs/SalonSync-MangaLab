import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface BranchContextType {
  activeBranch: Branch | null;
  branches: Branch[];
  setActiveBranch: (branch: Branch) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const queryClient = useQueryClient();

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await axios.get("/api/branches");
      return res.data;
    },
  });

  useEffect(() => {
    console.log("🔍 BranchContext useEffect:", {
      branchesLength: branches.length,
      activeBranch: activeBranch?.name,
      savedBranchId: localStorage.getItem("activeBranchId"),
    });

    if (branches.length > 0 && !activeBranch) {
      const savedBranchId = localStorage.getItem("activeBranchId");
      const savedBranch = branches.find((b: Branch) => b.id === savedBranchId);
      const selectedBranch = savedBranch || branches[0];

      console.log("✅ Setting active branch:", selectedBranch);
      setActiveBranchState(selectedBranch);

      if (!savedBranchId) {
        localStorage.setItem("activeBranchId", selectedBranch.id);
      }
    }
  }, [branches, activeBranch]);

  const setActiveBranch = (branch: Branch) => {
    console.log("🔄 Changing active branch to:", branch);
    setActiveBranchState(branch);
    localStorage.setItem("activeBranchId", branch.id);

    queryClient.invalidateQueries({ queryKey: ["professionals"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });

    console.log("✅ Branch changed and queries invalidated");
  };

  return (
    <BranchContext.Provider
      value={{
        activeBranch,
        branches,
        setActiveBranch,
        isLoading,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
