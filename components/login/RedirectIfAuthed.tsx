"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { LoadingState } from "@/components/feedback/LoadingState";

export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      router.replace("/dashboard");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return <LoadingState variant="cards" label="Loading…" />;
  }

  if (user) {
    return <LoadingState variant="cards" label="Redirecting…" />;
  }

  return <>{children}</>;
}
