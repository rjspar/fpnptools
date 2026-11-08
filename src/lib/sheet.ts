import "server-only";
import { createSign } from "node:crypto";

/** Contentplanning van Odiv. */
const SHEET_ID = process.env.LINKEDIN_SHEET_ID ?? "1lnX0wlF-W2vuDOQfBt81eQJ_rpOSKV36lcRMB2C6u78";
const RANGE = "Weekoverzicht!A1:Z400";

export type Post = {
  key: string; // 2026-11-10 (+ "-2" bij een tweede post op dezelfde dag)
  date: string; // ISO yyyy-mm-dd
  weekday: string;
  format: string; // Video, Still / carrousel
  category: string;
  title: string;
  copy: string;
  posted: boolean;
  link: string; // link naar de live post, zodra Odiv die invult
};

const MONTHS: Record<string, number> = {
  januari: 1, februari: 2, maart: 3, april: 4, mei: 5, juni: 6,
  juli: 7, augustus: 8, september: 9, oktober: 10, november: 11, december: 12,
};

/* ---------- Google-toegang via serviceaccount ---------- */

type ServiceAccount = { client_email: string; private_key: string };

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    return { ...sa, private_key: sa.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

let tokenCache: { token: string; exp: number } | null = null;

async function accessToken(sa: ServiceAccount) {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google-token mislukt (${res.status})`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

/* ---------- Inlezen en omzetten ---------- */

function isoDate(day: string, monthName: string, ref: Date) {
  const d = Number(day), m = MONTHS[monthName.toLowerCase()];
  if (!d || !m) return null;
  // Geen jaartal in de sheet: kies het jaar waarin de datum het dichtst bij vandaag ligt.
  const y = ref.getFullYear();
  const candidates = [y - 1, y, y + 1].map((yr) => new Date(Date.UTC(yr, m - 1, d)));
  candidates.sort((a, b) => Math.abs(a.getTime() - ref.getTime()) - Math.abs(b.getTime() - ref.getTime()));
  return candidates[0].toISOString().slice(0, 10);
}

export function parseRows(rows: string[][], ref = new Date()): Post[] {
  const headerIdx = rows.findIndex((r) => r.some((c) => c?.trim() === "Datum") && r.some((c) => c?.trim() === "Copy"));
  if (headerIdx < 0) return [];
  const head = rows[headerIdx].map((c) => (c ?? "").trim().toLowerCase());
  const col = (name: string) => head.indexOf(name);
  const cDate = col("datum"), cDay = col("dag"), cTitle = col("onderwerp"), cCopy = col("copy"), cPosted = col("gepost");
  const cLink = head.findIndex((h) => h === "link" || h.startsWith("link "));
  // De twee kolommen zonder kop vóór "Onderwerp" zijn vorm en categorie.
  const cFormat = cTitle - 2, cCategory = cTitle - 1;

  const posts: Post[] = [];
  const seen = new Map<string, number>();
  for (const r of rows.slice(headerIdx + 1)) {
    const m = (r[cDate] ?? "").trim().match(/^(\d{1,2})\s+([a-z]+)/i);
    const title = (r[cTitle] ?? "").trim();
    if (!m || !title) continue;
    const date = isoDate(m[1], m[2], ref);
    if (!date) continue;
    const n = (seen.get(date) ?? 0) + 1;
    seen.set(date, n);
    posts.push({
      key: n === 1 ? date : `${date}-${n}`,
      date,
      weekday: (r[cDay] ?? "").trim(),
      format: (r[cFormat] ?? "").trim(),
      category: (r[cCategory] ?? "").trim(),
      title,
      copy: (r[cCopy] ?? "").trim(),
      posted: (r[cPosted] ?? "").trim().toUpperCase() === "TRUE",
      link: cLink >= 0 ? (r[cLink] ?? "").trim() : "",
    });
  }
  return posts;
}

let postsCache: { at: number; posts: Post[] } | null = null;

export type SheetResult = { ok: true; posts: Post[] } | { ok: false; reason: "geen-sleutel" | "geen-toegang" | "fout"; detail?: string };

/** Alle posts uit de planning (5 minuten gecachet). */
export async function getPosts(): Promise<SheetResult> {
  if (postsCache && Date.now() - postsCache.at < 5 * 60_000) return { ok: true, posts: postsCache.posts };
  const sa = serviceAccount();
  if (!sa) return { ok: false, reason: "geen-sleutel" };
  try {
    const token = await accessToken(sa);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (res.status === 403 || res.status === 404) return { ok: false, reason: "geen-toegang", detail: sa.client_email };
    if (!res.ok) return { ok: false, reason: "fout", detail: String(res.status) };
    const json = (await res.json()) as { values?: string[][] };
    const posts = parseRows(json.values ?? []);
    postsCache = { at: Date.now(), posts };
    return { ok: true, posts };
  } catch (e) {
    return { ok: false, reason: "fout", detail: e instanceof Error ? e.message : undefined };
  }
}

/** Datumvenster vanaf vandaag (Amsterdamse tijd), als yyyy-mm-dd. */
export function dateWindow(daysAhead: number) {
  const fmt = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
  const now = new Date();
  return { from: fmt(now), until: fmt(new Date(now.getTime() + daysAhead * 86_400_000)) };
}
