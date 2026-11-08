import Link from "next/link";
import Shell from "@/components/Shell";
import StoneStack from "@/components/StoneStack";
import { requireMember } from "@/lib/auth";
import { LEVELS, MODULES, modulesForLevel } from "@/content/modules";

export const metadata = { title: "AI literacy · FP&P Tools" };

export default async function AiLiteracy() {
  const member = await requireMember();
  const levels = LEVELS.map((L, i) => ({
    ...L,
    modules: modulesForLevel(i).map((m) => ({ slug: m.slug, title: m.title })),
  }));

  return (
    <Shell member={member} active="ai">
      <main>
        <StoneStack levels={levels} />
        <section className="tools" style={{ marginTop: 0 }} aria-labelledby="alle-modules">
          <h2 id="alle-modules" className="rv">Alle modules</h2>
          <div className="grid">
            {MODULES.map((m, i) => (
              <Link key={m.slug} href={`/ai-literacy/${m.slug}`} className={`card rv d${(i % 3) + 1}`}>
                <span className="tag mono">Niveau {m.level + 1} · {LEVELS[m.level].name}</span>
                <h3>{m.title}</h3>
                <p>{m.short}</p>
                <span className="go">Open →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Shell>
  );
}
