import Image from "next/image";
import CodeForm from "@/components/CodeForm";
import { loginAction } from "./actions";

export const metadata = { title: "Inloggen · FP&P Tools" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { reden } = await searchParams;
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Image src="/fpnp-logo-wit.svg" alt="FP&P" width={120} height={41} priority />
        <span className="mono accent">Tools · intern</span>
        <h1>Inloggen</h1>
        <p className="muted">Je krijgt een code in je mail. Geen wachtwoord nodig.</p>
        {reden === "geen-lid" ? (
          <p className="form-error" role="alert">Dit adres staat (nog) niet in de ledenlijst. Vraag Spar of Robin om toegang.</p>
        ) : null}
        <CodeForm action={loginAction} initial={{ step: "email" }} askEmail sendLabel="Stuur code" />
      </div>
    </main>
  );
}
