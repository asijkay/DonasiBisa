import { Alert } from "@/components/ui";

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div className="mb-4">
      {error ? <Alert tone="danger">{error}</Alert> : <Alert tone="success">{ok}</Alert>}
    </div>
  );
}
