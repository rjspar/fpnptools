import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "src", "content", "files");

/** Alleen bestanden uit deze lijst zijn op te vragen. */
export const ALLOWED_FILES = new Set([
  "interview-linkedin-stem.md",
  "interview-emailstijl.md",
  "impeccable-leadership-referentie.md",
]);

export async function readContentFile(name: string) {
  if (!ALLOWED_FILES.has(name)) return null;
  return readFile(path.join(DIR, name), "utf8");
}

/** Het deel onder de eerste regel met alleen `---` (de eigenlijke prompt). */
export function promptPart(md: string) {
  const lines = md.split("\n");
  const i = lines.findIndex((l, idx) => idx > 0 && l.trim() === "---");
  return (i >= 0 ? lines.slice(i + 1) : lines).join("\n").trim();
}
