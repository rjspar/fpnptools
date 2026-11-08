import Link from "next/link";
import HeroAmpersand from "@/components/HeroAmpersand";
import Shell from "@/components/Shell";
import { hasRole, requireMember } from "@/lib/auth";
import { MODULES } from "@/content/modules";

export default async function Home() {
  const member = await requireMember();
  const firstName = member.name.split(" ")[0];

  return (
    <Shell member={member} active="home">
      <main>
        <HeroAmpersand />
        <section className="tools" id="tools" aria-labelledby="tools-title">
          <span className="mono accent rv">Hoi {firstName}</span>
          <h2 id="tools-title" className="glow rv d1">
            Gereedschap voor wie
            <br />
            met mensen werkt.
          </h2>
          <div className="grid">
            <Link className="card rv d1" href="/ai-literacy">
              <span className="tag mono">Alle lagen</span>
              <h3>AI literacy</h3>
              <p>Korte instructies om zelf mee te werken. Stappenplan, kopieerbare prompts en voorbeeldbestanden.</p>
              <span className="go">{MODULES.length} modules →</span>
            </Link>
            {hasRole(member, "grasmaaier") ? (
              <Link className="card rv d2" href="/linkedin">
                <span className="tag mono">Grasmaaiers</span>
                <h3>LinkedIn-versterker</h3>
                <p>Zie welke posts eraan komen, teken in en zet je reactie klaar. Op de dag zelf krijg je hem per mail.</p>
                <span className="go">In aanbouw →</span>
              </Link>
            ) : null}
            {hasRole(member, "partner") ? (
              <Link className="card rv d3" href="/governance">
                <span className="tag mono">Partners</span>
                <h3>Governance</h3>
                <p>Voorstellen, advies en besluiten volgens DACI. Asynchroon, zonder dat alles langs iedereen hoeft.</p>
                <span className="go">Na 10 december →</span>
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </Shell>
  );
}
