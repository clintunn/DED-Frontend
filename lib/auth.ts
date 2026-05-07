import {
  acceptInvite,
  createInvite,
  getMe,
  login,
  registerFoundation,
  type AcceptInvitePayload,
  type BackendUser,
  type CreateInvitePayload,
  type LoginPayload,
  type RegisterFoundationPayload,
} from "@/lib/api";
import type { AuthUser, Organization, UserRole } from "@/types";

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  organization: Organization | null;
};

function mapRole(role: BackendUser["role"]): UserRole {
  return role;
}

function mapUser(user: BackendUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRole(user.role),
  };
}

export async function loginUser(payload: LoginPayload): Promise<AuthSession> {
  const result = await login(payload);
  const me = await getMe(result.accessToken);
  return {
    accessToken: result.accessToken,
    user: mapUser(result.user),
    organization: me.organization ?? null,
  };
}

export async function registerFoundationUser(
  payload: RegisterFoundationPayload
): Promise<AuthSession> {
  const result = await registerFoundation(payload);
  return {
    accessToken: result.accessToken,
    user: mapUser(result.user),
    organization: result.organization ?? null,
  };
}

export async function refreshAuthSession(
  accessToken: string
): Promise<AuthSession> {
  const result = await getMe(accessToken);
  return {
    accessToken,
    user: mapUser(result.user),
    organization: result.organization ?? null,
  };
}

export async function acceptInviteSession(
  payload: AcceptInvitePayload
): Promise<AuthSession> {
  const result = await acceptInvite(payload);
  const me = await getMe(result.accessToken);
  return {
    accessToken: result.accessToken,
    user: mapUser(result.user),
    organization: me.organization ?? null,
  };
}

export function createOrganizationInvite(
  payload: CreateInvitePayload,
  accessToken: string
) {
  return createInvite(payload, accessToken);
}
