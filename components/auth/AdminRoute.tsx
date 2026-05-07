"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { LoadingState } from "@/components/feedback/LoadingState";

type AdminRouteProps = {
  children: React.ReactNode;
};

/**
 * Only ORG_ADMIN may render children; USER is redirected to /dashboard.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !user) return;
    if (user.role !== "ORG_ADMIN") {
      router.replace("/dashboard");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return <LoadingState variant="cards" label="Loading…" />;
  }

  if (user.role !== "ORG_ADMIN") {
    return <LoadingState variant="cards" label="Redirecting…" />;
  }

  return <>{children}</>;
}
