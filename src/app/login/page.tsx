import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, Button, Card, Input, Label, PageHeading } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import { isDevelopment } from "@/lib/env";
import { signInWithGoogleAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl = "/account", error } = await searchParams;
  if (await getCurrentUser()) redirect(callbackUrl.startsWith("/") ? callbackUrl : "/account");
  const googleReady = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

  return (
    <div className="mx-auto max-w-md">
      <PageHeading title="Masuk" />
      <Card className="space-y-4">
        <p className="text-sm text-slate-600">Masuk dengan Google untuk melihat riwayat donasi dan mengunduh bukti donasi. Anda tidak perlu masuk untuk berdonasi.</p>
        {error && <Alert tone="danger">Login gagal. Pastikan email Google Anda terverifikasi.</Alert>}
        <form action={signInWithGoogleAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" className="w-full" disabled={!googleReady}>Masuk dengan Google</Button>
          {!googleReady && <p className="mt-2 text-xs text-slate-500">Google SSO belum dikonfigurasi (AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET kosong).</p>}
        </form>

        {isDevelopment() && (
          <form action="/api/dev/login" method="post" className="space-y-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">DEV ONLY — login tanpa Google (hanya APP_ENV=development)</p>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <Label htmlFor="dev-email">Email</Label>
            <Input id="dev-email" name="email" type="email" required placeholder="admin@example.com" />
            <Button type="submit" variant="secondary" className="w-full">Masuk (dev)</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
