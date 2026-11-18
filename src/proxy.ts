
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions, supabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const origem = process.env.APP_ORIGIN;
  if (origem && new URL(origem).protocol === "https:" &&
      request.nextUrl.protocol !== "https:" && request.headers.get("x-forwarded-proto") !== "https") {
    const destino = new URL(origem);
    destino.pathname = request.nextUrl.pathname;
    destino.search = request.nextUrl.search;
    return NextResponse.redirect(destino, 308);
  }

  const { url, key } = supabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    url,
    key,
    {
      cookieOptions: sessionCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, ...sessionCookieOptions });
          });

          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              response.headers.set(key, value);
            });
          }
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();

  const paginasPublicas = ["/login", "/cadastro", "/auth/callback"];
  const caminho = request.nextUrl.pathname;

  if (!data?.claims && !paginasPublicas.includes(caminho)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";

    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Cache-Control", "private, no-store");

    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });

    return redirect;
  }

  if (data?.claims || request.method !== "GET") {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
