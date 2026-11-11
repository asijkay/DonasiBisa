"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { assertPermission, AuthzError } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import {
  brandInputSchema,
  campaignInputSchema,
  newsInputSchema,
  templateInputSchema,
} from "@/lib/validation/schemas";
import { PROVIDERS, ROLES, type CampaignStatus, type Provider, type Role } from "@/db/schema";
import { createCampaign, DomainError, setCampaignStatus, updateCampaign } from "@/services/campaigns.service";
import { deleteNews, saveNews } from "@/services/news.service";
import { saveBrand } from "@/services/brand.service";
import { resolveDataRequest } from "@/services/privacy.service";
import { grantRole, revokeRole, saveTemplate, setProviderEnabled, updateMethod } from "@/services/admin.service";

/** Runs an admin mutation: server-side permission check, domain errors → flash message, then redirect. */
async function run(permission: Permission, back: string, work: (actorId: string) => Promise<string | void>): Promise<never> {
  let target = back;
  const flash = (k: "ok" | "error", m: string) => `${back.split("?")[0]}?${k}=${encodeURIComponent(m)}`;
  try {
    const user = await assertPermission(permission);
    const next = await work(user.id);
    target = typeof next === "string" ? next : flash("ok", "Tersimpan.");
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof AuthzError) target = flash("error", e.status === 401 ? "Sesi berakhir. Silakan login." : "Anda tidak memiliki izin.");
    else if (e instanceof DomainError) target = flash("error", e.message);
    else if (e instanceof ZodError) target = flash("error", e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    else {
      console.error("[admin action]", e instanceof Error ? e.message : e);
      target = flash("error", "Terjadi kesalahan.");
    }
  }
  revalidatePath("/admin", "layout");
  redirect(target);
}

const str = (fd: FormData, k: string): string => String(fd.get(k) ?? "");
const bool = (fd: FormData, k: string): boolean => fd.get(k) === "on";
/** datetime-local values are entered in Asia/Jakarta; stored as UTC. */
const jakartaDate = (v: string): Date | null => (v ? new Date(`${v}:00+07:00`) : null);

function parseCampaign(fd: FormData) {
  const options = str(fd, "amountOptions")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [amount, ...label] = l.split("|");
      return { amount: Number(amount.replace(/\D/g, "")), label: label.join("|").trim() || undefined };
    });
  return campaignInputSchema.parse({
    title: str(fd, "title"),
    slug: str(fd, "slug"),
    summary: str(fd, "summary"),
    descriptionMd: str(fd, "descriptionMd"),
    targetAmount: Number(str(fd, "targetAmount").replace(/\D/g, "")),
    amountMode: str(fd, "amountMode"),
    category: str(fd, "category") || "LAINNYA",
    autoCloseOnTarget: bool(fd, "autoCloseOnTarget"),
    isFeatured: bool(fd, "isFeatured"),
    startsAt: jakartaDate(str(fd, "startsAt")),
    endsAt: jakartaDate(str(fd, "endsAt")),
    coverImageUrl: str(fd, "coverImageUrl"),
    coverImageAlt: str(fd, "coverImageAlt"),
    amountOptions: options,
  });
}

export async function saveCampaignAction(id: string | null, fd: FormData): Promise<never> {
  return run("campaign:write", id ? `/admin/campaigns/${id}` : "/admin/campaigns/new", async (actor) => {
    const input = parseCampaign(fd);
    const row = id ? await updateCampaign(id, input, { userId: actor }) : await createCampaign(input, { userId: actor });
    return `/admin/campaigns/${row.id}?ok=${encodeURIComponent("Campaign tersimpan.")}`;
  });
}

export async function campaignStatusAction(id: string, status: CampaignStatus): Promise<never> {
  const perm: Permission = status === "PUBLISHED" || status === "PAUSED" || status === "CLOSED" ? "campaign:publish" : "campaign:write";
  return run(perm, `/admin/campaigns/${id}`, async (actor) => {
    await setCampaignStatus(id, status, { userId: actor });
  });
}

export async function saveNewsAction(id: string | null, fd: FormData): Promise<never> {
  const wantsPublish = str(fd, "status") === "PUBLISHED";
  return run(wantsPublish ? "news:publish" : "news:write", id ? `/admin/news/${id}` : "/admin/news/new", async (actor) => {
    const input = newsInputSchema.parse({
      title: str(fd, "title"),
      slug: str(fd, "slug"),
      excerpt: str(fd, "excerpt"),
      bodyMd: str(fd, "bodyMd"),
      coverImageUrl: str(fd, "coverImageUrl"),
      coverImageAlt: str(fd, "coverImageAlt"),
      campaignId: str(fd, "campaignId") || null,
      status: str(fd, "status"),
    });
    const row = await saveNews(id, input, actor);
    return `/admin/news/${row.id}?ok=${encodeURIComponent("Berita tersimpan.")}`;
  });
}

export async function deleteNewsAction(id: string): Promise<never> {
  return run("news:write", "/admin/news", async (actor) => {
    await deleteNews(id, actor);
  });
}

export async function toggleProviderAction(provider: Provider, enabled: boolean): Promise<never> {
  if (!PROVIDERS.includes(provider)) throw new Error("Invalid provider");
  return run("payment:configure", "/admin/payment-methods", (actor) => setProviderEnabled(provider, enabled, actor));
}

export async function updateMethodAction(id: string, fd: FormData): Promise<never> {
  return run("payment:configure", "/admin/payment-methods", (actor) =>
    updateMethod(
      id,
      { isEnabled: bool(fd, "isEnabled"), displayName: str(fd, "displayName").slice(0, 80) || "Metode", description: str(fd, "description").slice(0, 200) || null, sortOrder: Number(str(fd, "sortOrder")) || 0 },
      actor,
    ),
  );
}

export async function saveTemplateAction(id: string, fd: FormData): Promise<never> {
  return run("notification:configure", "/admin/notification-templates", (actor) =>
    saveTemplate(
      id,
      templateInputSchema.parse({ subject: str(fd, "subject") || undefined, bodyText: str(fd, "bodyText"), bodyHtml: str(fd, "bodyHtml") || undefined, isActive: bool(fd, "isActive") }),
      actor,
    ),
  );
}

export async function saveBrandAction(fd: FormData): Promise<never> {
  return run("brand:configure", "/admin/brand", (actor) => {
    const social: Record<string, string> = {};
    for (const k of ["instagram", "facebook", "x", "youtube", "tiktok"]) if (str(fd, `social_${k}`)) social[k] = str(fd, `social_${k}`);
    return saveBrand(
      brandInputSchema.parse({
        brandName: str(fd, "brandName"),
        tagline: str(fd, "tagline") || undefined,
        logoUrl: str(fd, "logoUrl"),
        faviconUrl: str(fd, "faviconUrl"),
        primaryColor: str(fd, "primaryColor"),
        secondaryColor: str(fd, "secondaryColor"),
        accentColor: str(fd, "accentColor"),
        backgroundColor: str(fd, "backgroundColor"),
        contactEmail: str(fd, "contactEmail") || undefined,
        contactWhatsapp: str(fd, "contactWhatsapp") || undefined,
        address: str(fd, "address") || undefined,
        legalName: str(fd, "legalName") || undefined,
        legalForm: str(fd, "legalForm") || undefined,
        registrationNumber: str(fd, "registrationNumber") || undefined,
        taxId: str(fd, "taxId") || undefined,
        privacyContactEmail: str(fd, "privacyContactEmail") || undefined,
        website: str(fd, "website"),
        ctaLabel: str(fd, "ctaLabel"),
        footerText: str(fd, "footerText") || undefined,
        socialLinks: social,
      }),
      actor,
    );
  });
}

export async function grantRoleAction(fd: FormData): Promise<never> {
  return run("admin:manage", "/admin/users", (actor) => {
    const role = str(fd, "role") as Role;
    if (!ROLES.includes(role)) throw new DomainError("Role tidak valid.", "INVALID_ROLE");
    return grantRole(str(fd, "email"), role, actor);
  });
}

export async function revokeRoleAction(userId: string, role: Role): Promise<never> {
  return run("admin:manage", "/admin/users", (actor) => revokeRole(userId, role, actor));
}

/** Close a guest data request. `anonymize` performs the erasure (only for DELETE requests, after verifying the e-mail owner). */
export async function resolveDataRequestAction(id: string, outcome: "DONE" | "REJECTED", anonymize: boolean): Promise<never> {
  return run("admin:manage", "/admin/data-requests", async (actor) => {
    await resolveDataRequest(id, outcome, actor, { anonymize });
  });
}
