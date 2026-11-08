import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";

export const metadata = { title: "LinkedIn-versterker · FP&P Tools" };

export default async function LinkedInPage() {
  const member = await requireRole("grasmaaier");
  return (
    <Shell member={member} active="linkedin">
      <main className="page narrow">
        <span className="mono" style={{ color: "var(--cyan)" }}>LinkedIn-versterker · Grasmaaiers</span>
        <h1>In aanbouw</h1>
        <p className="lead">
          Hier zie je straks de posts uit de contentplanning van Odiv. Je tekent in, zet je reactie klaar (eventueel met een concept in je eigen stem) en krijgt op de dag zelf een mail met je tekst en de link. Doel: minstens twee reacties per post.
        </p>
      </main>
    </Shell>
  );
}
