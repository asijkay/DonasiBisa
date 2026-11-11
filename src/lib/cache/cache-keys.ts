export const CacheKeys = {
  featuredCampaigns: "home:featured-campaigns:v1",
  campaignList: "campaigns:list:v1",
  campaignDetail: (slug: string) => `campaign:${slug}:detail:v1`,
  newsLatest: "news:latest:v2",
  brand: "brand:config:v1",
} as const;

export const CACHE_TTL_SECONDS = 60;
