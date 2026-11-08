"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PARTNER_COOKIE, makePartnerToken, requireRole } from "@/lib/auth";
import type { LoginState } from "@/app/login/actions";

function safeNext(raw: FormDataEntryValue | null) {
  const n = String(raw ?? "/governance");
  return n.startsWith("/") && !n.startsWith("//") ? n : "/governance";
}

export async function unlockAction(prev: LoginState, form: FormData): Promise<LoginState> {
  const member = await requireRole("partner");
  const supabase = await createClient();
  const intent = String(form.get("intent") ?? "send");

  if (intent === "send" || intent === "resend") {
    const { error } = await supabase.auth.signInWithOtp({
      email: member.email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      return {
        step: "code",
        email: member.email,
        error: /seconds|rate/i.test(error.message)
          ? "Even geduld: je kunt over een minuut een nieuwe code vragen."
          : "Versturen lukte niet. Probeer het zo nog eens.",
      };
    }
    return { step: "code", email: member.email, info: `Er staat een code in je mail (${member.email}).` };
  }

  const token = String(form.get("token") ?? "").replace(/\s/g, "");
  const { error } = await supabase.auth.verifyOtp({ email: member.email, token, type: "email" });
  if (error) return { step: "code", email: member.email, error: "Die code klopt niet of is verlopen." };

  const { value, maxAge } = makePartnerToken(member.userId);
  (await cookies()).set(PARTNER_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  redirect(safeNext(form.get("next")));
}
