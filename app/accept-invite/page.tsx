import { redirect } from "next/navigation";

export default function LegacyAcceptInvitePage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const token = searchParams?.token?.trim();
  if (token) {
    redirect(`/invites/accept?token=${encodeURIComponent(token)}`);
  }
  redirect("/invites/accept");
}
