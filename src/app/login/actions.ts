"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  step: "email" | "code";
  email?: string;
  error?: string;
  info?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(prev: LoginState, form: FormData): Promise<LoginState> {
  const intent = String(form.get("intent") ?? "send");
  const supabase = await createClient();

  if (intent === "send" || intent === "resend") {
    const email = String(form.get("email") ?? prev.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return { step: "email", error: "Vul een geldig mailadres in." };

    const { data: allowed } = await supabase.rpc("is_member", { p_email: email });
    if (allowed) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        const wait = /seconds|rate/i.test(error.message);
        return {
          step: "code",
          email,
          error: wait ? "Even geduld: je kunt over een minuut een nieuwe code vragen." : "Versturen lukte niet. Probeer het zo nog eens.",
        };
      }
    }
    // Zelfde antwoord voor onbekende adressen, zodat de pagina niet verraadt wie lid is.
    return { step: "code", email, info: "Als dit adres bekend is, staat er nu een code in je mail." };
  }

  const email = String(form.get("email") ?? prev.email ?? "").trim().toLowerCase();
  const token = String(form.get("token") ?? "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "De code bestaat uit cijfers. Kijk nog even in je mail." };

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "Die code klopt niet of is verlopen. Vraag een nieuwe aan." };

  redirect("/");
}
