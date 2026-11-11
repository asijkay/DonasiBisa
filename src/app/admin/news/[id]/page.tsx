import { notFound } from "next/navigation";
import { PageHeading, StatusBadge } from "@/components/ui";
import { NewsForm } from "@/components/admin/news-form";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listAdminCampaigns } from "@/services/campaigns.service";
import { getAdminNews } from "@/services/news.service";

export default async function EditNews({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requirePermission("news:read");
  const news = await getAdminNews((await params).id);
  if (!news) notFound();
  const campaigns = await listAdminCampaigns();
  return (
    <div className="max-w-3xl">
      <PageHeading title={news.title}><StatusBadge status={news.status} /></PageHeading>
      <Flash {...(await searchParams)} />
      <NewsForm news={news} campaigns={campaigns.map((c) => ({ id: c.id, title: c.title }))} canWrite={hasPermission(user.roles, "news:write")} canPublish={hasPermission(user.roles, "news:publish")} />
    </div>
  );
}
