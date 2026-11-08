import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readContentFile } from "@/lib/files";

// Bestanden alleen voor ingelogde leden.
export async function GET(_req: Request, ctx: RouteContext<"/api/files/[name]">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Niet ingelogd", { status: 401 });

  const { name } = await ctx.params;
  const body = await readContentFile(name);
  if (body === null) return new NextResponse("Niet gevonden", { status: 404 });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
