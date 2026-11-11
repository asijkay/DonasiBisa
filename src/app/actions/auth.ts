"use server";

import { signIn, signOut } from "@/lib/auth/auth";

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const cb = String(formData.get("callbackUrl") ?? "/account");
  const safe = cb.startsWith("/") && !cb.startsWith("//") ? cb : "/account";
  await signIn("google", { redirectTo: safe });
}
