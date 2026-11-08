import CodeForm from "@/components/CodeForm";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { unlockAction } from "./actions";

export const metadata = { title: "Partnergedeelte · FP&P Tools" };

export default async function UnlockPage({ searchParams }: PageProps<"/partners/ontgrendel">) {
  const member = await requireRole("partner");
  const { next } = await searchParams;
  return (
    <Shell member={member} active="governance">
      <section className="page narrow">
        <span className="mono accent lock-label">Alleen partners</span>
        <h1>Extra slot</h1>
        <p className="muted">
          Het partnergedeelte vraagt een tweede code. Die sturen we naar {member.email}. Daarna blijft het 12 uur open op dit apparaat.
        </p>
        <CodeForm
          action={unlockAction}
          initial={{ step: "email", email: member.email }}
          askEmail={false}
          sendLabel="Stuur partnercode"
          next={typeof next === "string" ? next : "/governance"}
        />
      </section>
    </Shell>
  );
}
