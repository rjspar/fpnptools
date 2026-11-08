import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PARTNER_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const reden = request.nextUrl.searchParams.get("reden");
  const url = new URL("/login", request.url);
  if (reden) url.searchParams.set("reden", reden);
  const res = NextResponse.redirect(url);
  res.cookies.delete(PARTNER_COOKIE);
  return res;
}
