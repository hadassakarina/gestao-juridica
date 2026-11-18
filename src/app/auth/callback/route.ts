import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destino = new URL("/login", process.env.APP_ORIGIN ?? request.url);
  const response = NextResponse.redirect(destino);
  response.headers.set("Cache-Control", "no-store");

  if (!code) return response;

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    destino.pathname = "/";
    response.headers.set("Location", destino.href);
  }

  return response;
}
