import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "@/lib/axios";

interface User {
  id: string;
  email: string;
  name?: string;
  businessName?: string;
  phone?: string;
  avatar?: string;
  role: string;
  branchName?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isProfessional: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/api/auth/profile");
      setUser(res.data);
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeBranchId");
    setUser(null);
    window.location.href = "/login";
  };

  const isAdmin = user?.role === "ADMIN";
  const isProfessional = user?.role === "PROFESSIONAL";

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isAdmin,
      isProfessional,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}