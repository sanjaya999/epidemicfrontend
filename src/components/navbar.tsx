"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/use-user-store";
import { authService } from "@/services/auth.service";

export function Navbar() {
  const { user, setUser, clearUser } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authService.getMe() as any;
        setUser(response.data);
      } catch (error) {
        clearUser();
      }
    };

    if (!user && !isAuthPage) {
      fetchUser();
    }
  }, [user, setUser, clearUser, isAuthPage]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearUser();
      router.push("/login");
    } catch (error) {
      // Even if the API call fails, we should clear the local state
      clearUser();
      router.push("/login");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="w-full px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary">
              EpidemicSim
            </Link>
            

          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold leading-none">{user.username}</span>
                  <span className="text-[11px] text-muted-foreground">{user.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="font-medium shadow-sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
