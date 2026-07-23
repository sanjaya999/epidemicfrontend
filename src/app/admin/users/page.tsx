"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  Trash2,
  FlaskConical,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminService } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, unknown> = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (search) params.search = search;
      if (statusFilter === "active") params.is_active = true;
      if (statusFilter === "inactive") params.is_active = false;

      const res = await adminService.getUsers(params as any);
      if (res.data) setUsers(res.data);
      setTotal(res.total);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  async function handleToggleStatus(user: AdminUser) {
    try {
      const res = await adminService.toggleUserStatus(user.id, !user.is_active);
      if (res.data?.[0]) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data![0] : u)));
      }
      toast.success(`User ${user.is_active ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update user status");
    }
  }

  async function handleToggleRole(user: AdminUser) {
    try {
      const res = await adminService.toggleUserRole(user.id, !user.is_superuser);
      if (res.data?.[0]) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data![0] : u)));
      }
      toast.success(
        user.is_superuser ? "Admin role revoked" : "Admin role granted"
      );
    } catch {
      toast.error("Failed to update user role");
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete user "${user.username}" (${user.email})? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((t) => t - 1);
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  }

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all registered users
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{total}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Users</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by username or email..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 border border-border rounded-md p-1 self-start sm:self-auto">
          {(["", "active", "inactive"] as const).map((s) => (
            <button
              key={s || "all"}
              onClick={() => {
                setStatusFilter(s);
                setPage(0);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "" ? "All" : s === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : !users.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-lg bg-muted/30">
          <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground text-sm">No users found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Sims</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Interv.</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-[11px] text-muted-foreground md:hidden">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                        user.is_active
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      )}
                    >
                      {user.is_active ? <UserCheck size={11} /> : <UserX size={11} />}
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                        user.is_superuser
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-gray-50 text-gray-600 border border-gray-200"
                      )}
                    >
                      {user.is_superuser ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
                      {user.is_superuser ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <FlaskConical size={12} /> {user.simulation_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Activity size={12} /> {user.intervention_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        disabled={user.is_superuser}
                        className={cn(
                          "h-8 px-2 text-xs",
                          user.is_active
                            ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                            : "text-green-500 hover:text-green-600 hover:bg-green-50"
                        )}
                        title={user.is_active ? "Deactivate" : "Activate"}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRole(user)}
                        className="h-8 px-2 text-xs text-purple-500 hover:text-purple-600 hover:bg-purple-50"
                        title={user.is_superuser ? "Revoke admin" : "Grant admin"}
                      >
                        {user.is_superuser ? "Revoke" : "Promote"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user)}
                        disabled={user.is_superuser}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
