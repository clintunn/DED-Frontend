"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { LoadingState } from "@/components/feedback/LoadingState";

type RequireAuthProps = {
  children: React.ReactNode;
};

/**
 * Redirects to /login when there is no session (after hydration).
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return <LoadingState variant="cards" label="Loading…" />;
  }

  return <>{children}</>;
}
