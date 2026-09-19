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
import { UnreadAlertNotifier } from "@/components/unread-alert-notifier";

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
  const [checkedPath, setCheckedPath] = useState<string | null>(null);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const shouldCheckSession = !user && !isAuthPage && checkedPath !== pathname;
  const isLoading = shouldCheckSession;

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
          setCheckedPath(pathname);
        }
      }
    }

    if (shouldCheckSession) {
      fetchUser();
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, shouldCheckSession, setUser, clearUser]);

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
      <UnreadAlertNotifier user={user} />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
