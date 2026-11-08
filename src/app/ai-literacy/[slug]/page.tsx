import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import Shell from "@/components/Shell";
import { requireMember } from "@/lib/auth";
import { promptPart, readContentFile } from "@/lib/files";
import { LEVELS, MODULES } from "@/content/modules";

/** **vet** in stappen ondersteunen, verder platte tekst. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </span>
  );
}

export default async function ModulePage({ params }: PageProps<"/ai-literacy/[slug]">) {
  const member = await requireMember();
  const { slug } = await params;
  const mod = MODULES.find((m) => m.slug === slug);
  if (!mod) notFound();

  const prompts = await Promise.all(
    mod.prompts.map(async (p) => ({
      title: p.title,
      text: p.text ?? (p.fromFile ? promptPart((await readContentFile(p.fromFile)) ?? "") : ""),
    })),
  );

  return (
    <Shell member={member} active="ai">
      <main className="page">
        <div className="mod-layout">
          <nav className="mod-side" aria-label="Modules">
            <span className="mono" style={{ color: "var(--muted)", padding: "0 14px 8px" }}>Modules</span>
            {MODULES.map((m, i) => (
              <Link key={m.slug} href={`/ai-literacy/${m.slug}`} aria-current={m.slug === mod.slug ? "page" : undefined}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {m.title}
              </Link>
            ))}
            <Link href="/ai-literacy" style={{ marginTop: 12 }}>← Leerlijn</Link>
          </nav>

          <article className="mod-main">
            <header style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span className="mono accent">AI literacy · niveau {mod.level + 1} · {LEVELS[mod.level].name}</span>
              <h1>{mod.title}</h1>
              <div className="prose muted">
                {mod.intro.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </header>

            <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h2>Stappen</h2>
              <ol className="steps">
                {mod.steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}
              </ol>
            </section>

            {prompts.map((p) => (
              <section key={p.title} className="prompt">
                <div className="prompt-head">
                  <h3>{p.title}</h3>
                  <CopyButton text={p.text} />
                </div>
                <pre tabIndex={0}>{p.text}</pre>
              </section>
            ))}

            {mod.files.length ? (
              <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h2>Bestanden</h2>
                {mod.filesIntro ? <p className="muted">{mod.filesIntro}</p> : null}
                <div className="files">
                  {mod.files.map((f) => (
                    <a key={f.name} href={`/api/files/${f.name}`}>
                      <span>.md · {f.hint}</span>
                      {f.label}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {mod.note ? <p className="note">{mod.note}</p> : null}
            <p className="note">Vastgelopen of een idee voor een nieuwe module? Vraag het Spar of David.</p>
          </article>
        </div>
      </main>
    </Shell>
  );
}
