"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

export function Navbar() {
  const { user, logout } = useAuth();

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
                  onClick={logout}
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
