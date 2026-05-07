"use client";

import { useAuth } from "./AuthContext";
import type { UserRole } from "@/types";

type RoleGateProps = {
  allow: UserRole[];
  children: React.ReactNode;
};

/** Renders children only when the current user's role is in `allow`. */
export function RoleGate({ allow, children }: RoleGateProps) {
  const { user, hydrated } = useAuth();

  if (!hydrated || !user) {
    return null;
  }

  if (!allow.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
