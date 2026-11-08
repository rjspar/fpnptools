import Shell, { LockIcon } from "@/components/Shell";
import { requirePartnerUnlocked } from "@/lib/auth";

export const metadata = { title: "Governance · FP&P Tools" };

export default async function GovernancePage() {
  const member = await requirePartnerUnlocked("/governance");
  return (
    <Shell member={member} active="governance">
      <main className="page narrow">
        <span className="mono accent lock-label"><LockIcon size={13} /> Governance · alleen partners</span>
        <h1>Na 10 december</h1>
        <p className="lead">
          Hier komen voorstellen, adviesrondes en besluiten volgens DACI: een Driver, een Approver per expertisegebied, Contributors en Informed. Grote besluiten gaan langs alle partners. We bouwen dit zodra de spelregels uit de vuurplaatssessie helder zijn.
        </p>
      </main>
    </Shell>
  );
}
