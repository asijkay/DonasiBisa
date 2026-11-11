import { redirect } from "next/navigation";

/** Privacy & data now lives on /account (section #privasi). Old links keep working. */
export default function AccountPrivacyRedirect(): never {
  redirect("/account#privasi");
}
