"use client";

import { useState, useTransition } from "react";
import { saveSignup, withdrawSignup } from "@/app/linkedin/actions";
import type { Post } from "@/lib/sheet";

export type BoardPost = Post & { names: string[]; signedUp: boolean; myComment: string };

const DAY = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MONTH = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function parts(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return { day: DAY[d.getDay()], nr: d.getDate(), month: MONTH[d.getMonth()] };
}

export default function LinkedInBoard({ posts }: { posts: BoardPost[] }) {
  const [selKey, setSelKey] = useState(posts[0]?.key);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(posts.map((p) => [p.key, p.myComment])));
  const [msg, setMsg] = useState<{ key: string; text: string; bad?: boolean } | null>(null);
  const [pending, start] = useTransition();

  const cur = posts.find((p) => p.key === selKey) ?? posts[0];
  const d = parts(cur.date);
  const draft = drafts[cur.key] ?? "";

  const save = () =>
    start(async () => {
      const r = await saveSignup(cur.key, draft);
      setMsg({ key: cur.key, text: r.ok ? (cur.signedUp ? "Je tekst is bijgewerkt." : "Je staat ingetekend.") : r.error ?? "Er ging iets mis.", bad: !r.ok });
    });
  const withdraw = () =>
    start(async () => {
      const r = await withdrawSignup(cur.key);
      setMsg({ key: cur.key, text: r.ok ? "Je bent uitgeschreven." : r.error ?? "Er ging iets mis.", bad: !r.ok });
    });

  return (
    <div className="board">
      <ul className="board-list">
        {posts.map((p) => {
          const pp = parts(p.date);
          const n = p.names.length;
          return (
            <li key={p.key}>
              <button type="button" className={`post-item${p.key === cur.key ? " sel" : ""}`} onClick={() => { setSelKey(p.key); setMsg(null); }} aria-pressed={p.key === cur.key}>
                <span className="post-date">
                  <span className="mono">{pp.day}</span>
                  <strong>{pp.nr}</strong>
                  <span className="mono">{pp.month}</span>
                </span>
                <span className="post-body">
                  <span className="mono" style={{ color: "var(--cyan)" }}>{p.format || p.category}</span>
                  <strong>{p.title}</strong>
                  <span className="post-hook">{p.copy.split("\n")[0] || "Copy volgt van Odiv"}</span>
                </span>
                <span className={`count${n >= 2 ? " ok" : ""}`} aria-label={`${n} van 2 reacties`}>
                  {n}/2{p.signedUp ? " · jij" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <section className="board-panel" aria-label="Gekozen post">
        <span className="mono" style={{ color: "var(--cyan)" }}>
          {d.day} {d.nr} {d.month}{cur.format ? ` · ${cur.format}` : ""}{cur.posted ? " · live" : ""}
        </span>
        <h2>{cur.title}</h2>
        {cur.copy ? <p className="post-copy">{cur.copy}</p> : <p className="post-copy muted">De tekst van deze post volgt nog van Odiv.</p>}
        {cur.link ? <a href={cur.link} target="_blank" rel="noreferrer">Bekijk de post op LinkedIn ↗</a> : null}

        <div className="signed">
          <span className="muted">Ingetekend:</span>
          {cur.names.length ? cur.names.map((n) => <span key={n} className="chip">{n}</span>) : <span className="muted">nog niemand</span>}
        </div>

        <label htmlFor="reactie" style={{ fontWeight: 800 }}>Jouw reactie</label>
        <textarea
          id="reactie"
          rows={6}
          value={draft}
          onChange={(e) => setDrafts({ ...drafts, [cur.key]: e.target.value })}
          placeholder="Wat wil jij hierover zeggen? Een ervaring, een vraag of een aanvulling. Je kunt dit later nog aanpassen."
        />
        {msg && msg.key === cur.key ? <p className={msg.bad ? "form-error" : "form-info"} role="status">{msg.text}</p> : null}
        <div className="form-row">
          <button type="button" className="btn" onClick={save} disabled={pending}>
            {pending ? "Bezig…" : cur.signedUp ? "Tekst opslaan" : "Ik reageer op deze post"}
          </button>
          {cur.signedUp ? (
            <button type="button" className="btn-ghost" onClick={withdraw} disabled={pending}>Uitschrijven</button>
          ) : null}
        </div>
        <p className="muted" style={{ fontSize: 14 }}>
          Zodra de post live staat, krijg je een mail met je tekst en de link. Dan alleen nog kopiëren, @-namen checken en plaatsen.
        </p>
      </section>
    </div>
  );
}
