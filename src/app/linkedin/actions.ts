"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const KEY_RE = /^\d{4}-\d{2}-\d{2}(-\d+)?$/;

export type SaveResult = { ok: boolean; error?: string };

/** Intekenen of je klaargezette tekst bijwerken. */
export async function saveSignup(postKey: string, comment: string): Promise<SaveResult> {
  const member = await requireRole("grasmaaier");
  if (!KEY_RE.test(postKey)) return { ok: false, error: "Onbekende post." };
  const supabase = await createClient();
  const { error } = await supabase.from("linkedin_signups").upsert(
    {
      post_key: postKey,
      email: member.email,
      name: member.name,
      comment: comment.slice(0, 3000),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "post_key,email" },
  );
  if (error) return { ok: false, error: "Opslaan lukte niet. Probeer het opnieuw." };
  revalidatePath("/linkedin");
  return { ok: true };
}

export async function withdrawSignup(postKey: string): Promise<SaveResult> {
  const member = await requireRole("grasmaaier");
  if (!KEY_RE.test(postKey)) return { ok: false, error: "Onbekende post." };
  const supabase = await createClient();
  const { error } = await supabase.from("linkedin_signups").delete().eq("post_key", postKey).eq("email", member.email);
  if (error) return { ok: false, error: "Uitschrijven lukte niet." };
  revalidatePath("/linkedin");
  return { ok: true };
}
