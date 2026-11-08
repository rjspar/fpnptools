import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "partner" | "grasmaaier" | "fellowship";

export type Member = {
  email: string;
  name: string;
  role: Role;
  is_admin: boolean;
  userId: string;
};

const RANK: Record<Role, number> = { fellowship: 1, grasmaaier: 2, partner: 3 };

export function hasRole(member: Member, min: Role) {
  return RANK[member.role] >= RANK[min];
}

export const ROLE_LABEL: Record<Role, string> = {
  partner: "Partner",
  grasmaaier: "Grasmaaier",
  fellowship: "Fellowship",
};

/** Ingelogd lid, of redirect naar /login. Ingelogd maar geen lid: uitloggen. */
export async function requireMember(): Promise<Member> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data } = await supabase
    .from("members")
    .select("email, name, role, is_admin")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!data) redirect("/auth/signout?reden=geen-lid");
  return { ...(data as Omit<Member, "userId">), userId: user.id };
}

export async function requireRole(min: Role): Promise<Member> {
  const member = await requireMember();
  if (!hasRole(member, min)) redirect("/");
  return member;
}

/* ---------- Partnerslot: extra code per mail, 12 uur geldig ---------- */

export const PARTNER_COOKIE = "fp_partner";
const PARTNER_TTL_MS = 12 * 60 * 60 * 1000;

function secret() {
  const s = process.env.PARTNER_COOKIE_SECRET;
  if (!s || s.length < 16) throw new Error("PARTNER_COOKIE_SECRET ontbreekt of is te kort");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makePartnerToken(userId: string) {
  const payload = `${userId}.${Date.now() + PARTNER_TTL_MS}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: PARTNER_TTL_MS / 1000 };
}

export async function isPartnerUnlocked(userId: string) {
  const raw = (await cookies()).get(PARTNER_COOKIE)?.value;
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [uid, exp, sig] = parts;
  const expected = Buffer.from(sign(`${uid}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return uid === userId && Number(exp) > Date.now();
}

/** Partner én ontgrendeld met de extra code, anders naar het slot. */
export async function requirePartnerUnlocked(next: string): Promise<Member> {
  const member = await requireRole("partner");
  if (!(await isPartnerUnlocked(member.userId))) {
    redirect(`/partners/ontgrendel?next=${encodeURIComponent(next)}`);
  }
  return member;
}
