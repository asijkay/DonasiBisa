import type { DefaultSession } from "next-auth";
import type { Role } from "@/db/schema/enums";

declare module "next-auth" {
  interface Session {
    user: { id: string; roles: Role[] } & DefaultSession["user"];
  }
}
