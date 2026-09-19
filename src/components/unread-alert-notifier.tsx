"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Siren, X } from "lucide-react";
import { toast } from "sonner";
import { alertService } from "@/services/alert.service";
import type { User } from "@/types/auth";

interface UnreadAlertNotifierProps {
  user: User | null;
}

export function UnreadAlertNotifier({ user }: UnreadAlertNotifierProps) {
  const pathname = usePathname();
  const router = useRouter();
  const shownIds = useRef(new Set<number>());
  const activeUserId = useRef<number | null>(null);

  useEffect(() => {
    if (
      !user ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/alerts")
    ) {
      return;
    }

    if (activeUserId.current !== user.id) {
      activeUserId.current = user.id;
      shownIds.current.clear();
    }

    let cancelled = false;

    async function showNewestUnread() {
      try {
        const response = await alertService.getNotifications({ unread_only: true });
        if (cancelled || response.data.length === 0) return;

        const notification = response.data[0];
        if (shownIds.current.has(notification.id)) return;
        shownIds.current.add(notification.id);

        toast.custom(
          (toastId) => (
            <div
              role="alert"
              className="w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-red-700 bg-red-600 text-white shadow-xl"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Siren className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-red-100">
                        Unread outbreak alert
                      </p>
                      <p className="mt-1 font-semibold leading-snug">
                        {notification.alert.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.dismiss(toastId)}
                      className="rounded p-1 text-red-100 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      aria-label="Dismiss alert notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-red-50">
                    {notification.alert.message}
                  </p>
                  {response.unread_count > 1 && (
                    <p className="mt-2 text-xs font-medium text-red-100">
                      {response.unread_count - 1} more unread {response.unread_count === 2 ? "alert" : "alerts"}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await alertService.markRead(notification.id);
                    window.dispatchEvent(new Event("notifications:changed"));
                  } catch {
                    // Open the inbox even if marking the item as read fails.
                  } finally {
                    toast.dismiss(toastId);
                    router.push("/alerts");
                  }
                }}
                className="flex w-full items-center justify-between border-t border-red-500 bg-red-700/40 px-4 py-3 text-sm font-semibold hover:bg-red-700/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
              >
                View alert
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ),
          { duration: Infinity }
        );
      } catch {
        // The sidebar and Alerts page remain available if this optional prompt cannot load.
      }
    }

    void showNewestUnread();
    const refresh = () => void showNewestUnread();
    window.addEventListener("alert:created", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("alert:created", refresh);
    };
  }, [pathname, router, user]);

  return null;
}
