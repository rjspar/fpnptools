import Image from "next/image";
import Link from "next/link";
import { hasRole, ROLE_LABEL, type Member } from "@/lib/auth";
import Clock from "./Clock";
import SmoothScroll from "./SmoothScroll";

type Active = "home" | "ai" | "linkedin" | "governance";

export default function Shell({ member, active, children }: { member: Member; active: Active; children: React.ReactNode }) {
  const items: { key: Active; href: string; label: string; show: boolean; lock?: boolean }[] = [
    { key: "home", href: "/", label: "Home", show: true },
    { key: "ai", href: "/ai-literacy", label: "AI literacy", show: true },
    { key: "linkedin", href: "/linkedin", label: "LinkedIn", show: hasRole(member, "grasmaaier") },
    { key: "governance", href: "/governance", label: "Governance", show: hasRole(member, "partner"), lock: true },
  ];
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <SmoothScroll />
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/" className="brand" aria-label="FP&P Tools, home">
            <Image src="/fpnp-logo-wit.svg" alt="" width={71} height={24} priority />
            <span className="mono accent">Tools</span>
          </Link>
          <nav className="nav" aria-label="Hoofdmenu">
            {items
              .filter((i) => i.show)
              .map((i) => (
                <Link key={i.key} href={i.href} aria-current={i.key === active ? "page" : undefined}>
                  {i.lock ? <LockIcon /> : null}
                  {i.label}
                </Link>
              ))}
          </nav>
          <div className="who">
            <span className="avatar" aria-hidden="true">{initials}</span>
            <span className="who-text">
              <strong>{member.name.split(" ")[0]} · {ROLE_LABEL[member.role]}</strong>
              <a href="/auth/signout">Uitloggen</a>
            </span>
          </div>
        </div>
      </header>
      {children}
      <footer className="foot">
        <div className="foot-in mono">
          <span>FP&amp;P · tools.fpnp.nl · intern</span>
          <Clock />
        </div>
      </footer>
    </>
  );
}

export function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
