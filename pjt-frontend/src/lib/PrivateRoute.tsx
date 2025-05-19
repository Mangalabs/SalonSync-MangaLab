import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";
import type { JSX } from "react";

interface Props {
  children: JSX.Element;
}

export function PrivateRoute({ children }: Props) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}
