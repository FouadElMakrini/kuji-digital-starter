"use server";

import { redirect } from "next/navigation";

export async function openSessionAction(formData: FormData) {
  const rawCode = String(formData.get("code") ?? "");
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    redirect("/play?error=missing_code");
  }

  redirect(`/play/session/${encodeURIComponent(code)}`);
}