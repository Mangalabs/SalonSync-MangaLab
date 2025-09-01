import { useState, useEffect } from "react";
import type { ReactNode } from "react";
// import { Navigate } from "react-router-dom";
import axios from "@/lib/axios";

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGuard({
  children,
  fallback,
}: SubscriptionGuardProps) {
  const [userHasAccess, setUserHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await axios.get("/api/payment/user-has-active-subscription");
      setUserHasAccess(res.data);
    } catch (e) {
      console.log(e);
      // TODO: Redirect to subscription page
      // localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!userHasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Assinatura não concluída</h2>
          <p className="text-gray-500 mt-2">
            Você ainda não tem permissão para acessar esta area. Faça a sua
            inscrição nas configurações
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
