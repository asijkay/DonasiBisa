import { PageHeading } from "@/components/ui";
import { CampaignForm } from "@/components/admin/campaign-form";
import { Flash } from "@/components/admin/flash";
import { requirePermission } from "@/lib/auth/session";

export default async function NewCampaign({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requirePermission("campaign:write");
  const sp = await searchParams;
  return (
    <div className="max-w-3xl">
      <PageHeading title="Campaign baru" />
      <Flash {...sp} />
      <CampaignForm canWrite />
    </div>
  );
}
