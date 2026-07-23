"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useUserStore } from "@/store/use-user-store";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, clearUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(true);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const response = await authService.getMe();
        if (!cancelled) {
          setUser(response.data ?? null);
        }
      } catch {
        if (!cancelled) {
          clearUser();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (!user && !isAuthPage) {
      fetchUser();
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [user, isAuthPage, setUser, clearUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local state even if the API call fails
    } finally {
      clearUser();
      router.push("/login");
    }
  }, [clearUser, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
