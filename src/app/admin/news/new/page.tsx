import { PageHeading } from "@/components/ui";
import { NewsForm } from "@/components/admin/news-form";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listAdminCampaigns } from "@/services/campaigns.service";

export default async function NewNews({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requirePermission("news:write");
  const campaigns = await listAdminCampaigns();
  return (
    <div className="max-w-3xl">
      <PageHeading title="Berita baru" />
      <Flash {...(await searchParams)} />
      <NewsForm campaigns={campaigns.map((c) => ({ id: c.id, title: c.title }))} canWrite canPublish={hasPermission(user.roles, "news:publish")} />
    </div>
  );
}
