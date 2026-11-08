import Shell from "@/components/Shell";
import LinkedInBoard, { type BoardPost } from "@/components/LinkedInBoard";
import { requireRole } from "@/lib/auth";
import { dateWindow, getPosts } from "@/lib/sheet";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "LinkedIn-versterker · FP&P Tools" };

const DAYS_AHEAD = 42;

export default async function LinkedInPage() {
  const member = await requireRole("grasmaaier");
  const sheet = await getPosts();

  let posts: BoardPost[] = [];
  if (sheet.ok) {
    const { from, until } = dateWindow(DAYS_AHEAD);
    const upcoming = sheet.posts.filter((p) => p.date >= from && p.date <= until);
    const supabase = await createClient();
    const { data: signups } = await supabase
      .from("linkedin_signups")
      .select("post_key, email, name, comment")
      .in("post_key", upcoming.map((p) => p.key));
    posts = upcoming.map((p) => {
      const mine = signups?.find((s) => s.post_key === p.key && s.email === member.email);
      return {
        ...p,
        names: (signups ?? []).filter((s) => s.post_key === p.key).map((s) => s.name.split(" ")[0]),
        signedUp: Boolean(mine),
        myComment: mine?.comment ?? "",
      };
    });
  }

  return (
    <Shell member={member} active="linkedin">
      <main className="page">
        <header style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
          <span className="mono" style={{ color: "var(--cyan)" }}>LinkedIn-versterker · Grasmaaiers</span>
          <h1>Komende posts</h1>
          <p className="lead">
            Teken in op een post en zet je reactie alvast klaar. Zodra de post live staat, krijg je je tekst en de link per mail. Doel: minstens twee reacties per post.
          </p>
        </header>

        {sheet.ok ? (
          posts.length ? (
            <LinkedInBoard posts={posts} />
          ) : (
            <p className="note">Er staan de komende weken geen posts in de planning.</p>
          )
        ) : (
          <div className="note">
            {sheet.reason === "geen-sleutel" && <p>De koppeling met de contentplanning is nog niet ingesteld (GOOGLE_SERVICE_ACCOUNT_JSON ontbreekt in Vercel).</p>}
            {sheet.reason === "geen-toegang" && (
              <p>
                De app kan de contentplanning niet lezen. Deel de sheet als <strong>Lezer</strong> met <code>{sheet.detail}</code>.
              </p>
            )}
            {sheet.reason === "fout" && <p>De contentplanning kon niet worden geladen{sheet.detail ? ` (${sheet.detail})` : ""}. Probeer het zo opnieuw.</p>}
          </div>
        )}
      </main>
    </Shell>
  );
}
