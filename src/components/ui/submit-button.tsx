"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, Spinner } from "./index";

type Props = Omit<React.ComponentProps<typeof Button>, "type" | "disabled"> & { pendingLabel?: ReactNode; disabled?: boolean };

/**
 * Submit button for <form action={serverAction}>. While the action runs it is disabled and announces
 * "busy", so a second tap/Enter cannot submit the form twice.
 */
export function SubmitButton({ children, pendingLabel, disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (<><Spinner />{pendingLabel ?? "Memproses…"}</>) : children}
    </Button>
  );
}
