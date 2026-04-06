"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleLogout() {
    startTransition(async () => {
      await fetch("/api/admin/logout", {
        method: "POST"
      });
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <button className="button-secondary" onClick={handleLogout} disabled={isPending}>
      {isPending ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
