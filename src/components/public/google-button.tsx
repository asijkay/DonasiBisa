"use client";

import { useFormStatus } from "react-dom";
import { IconGoogle } from "./icons";

/** Google sign-in submit button; disabled while the redirect is starting so it cannot fire twice. */
export function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white px-5 py-3.5 text-base font-semibold text-[#1f2937] shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <IconGoogle /> {pending ? "Mengalihkan ke Google…" : "Lanjutkan dengan Google"}
    </button>
  );
}
