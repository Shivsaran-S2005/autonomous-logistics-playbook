import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { UserRole } from "@/data/types";
import type { Retailer } from "@/data/types";
import { validateRetailerLogin } from "@/data/db";

interface AuthState {
  role: UserRole;
  retailer: Retailer | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  loginAsConsumer: () => void;
  loginAsRetailer: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const defaultState: AuthState = {
  role: "consumer",
  retailer: null,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(defaultState);

  const loginAsConsumer = useCallback(() => {
    setState({
      role: "consumer",
      retailer: null,
      isAuthenticated: true,
    });
  }, []);

  const loginAsRetailer = useCallback((email: string, password: string) => {
    const retailer = validateRetailerLogin(email, password);
    if (!retailer) {
      return { success: false, error: "Invalid email or password." };
    }
    setState({
      role: "retailer",
      retailer,
      isAuthenticated: true,
    });
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setState(defaultState);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginAsConsumer,
        loginAsRetailer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
