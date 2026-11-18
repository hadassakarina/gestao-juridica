"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function autenticar(
  modo: "login" | "cadastro",
  email: string,
  senha: string,
  captchaToken?: string,
): Promise<{ erro?: string; sessao?: boolean }> {
  if ((modo !== "login" && modo !== "cadastro") ||
      typeof email !== "string" || typeof senha !== "string") {
    return { erro: "Dados inválidos." };
  }

  email = email.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !senha || senha.length > 4096 || (modo === "cadastro" && senha.length < 6)) {
    return { erro: "Confira o e-mail e a senha." };
  }

  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      (typeof captchaToken !== "string" || !captchaToken || captchaToken.length > 2048)) {
    return { erro: "Conclua a verificação de segurança." };
  }
  if (typeof captchaToken !== "string" || captchaToken.length > 2048) captchaToken = undefined;

  try {
    const supabase = await createServerSupabase();
    if (modo === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email, password: senha, options: { captchaToken },
      });
      if (!error && data.session) return { sessao: true };
      if (error?.code === "email_not_confirmed") return { erro: "Confirme seu e-mail antes de entrar." };
      if (error?.status === 429) return { erro: "Muitas tentativas. Aguarde um pouco e tente novamente." };
      return { erro: "Não foi possível entrar. Confira suas credenciais e a verificação de segurança." };
    }

    const origem = process.env.APP_ORIGIN ?? (await headers()).get("origin");
    if (!origem) return { erro: "Não foi possível identificar o endereço do aplicativo." };
    const callback = new URL("/auth/callback", origem);
    if (callback.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(callback.hostname)) {
      return { erro: "Abra o aplicativo via HTTPS para criar sua conta." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: callback.href, captchaToken },
    });
    if (!error || error.code === "user_already_exists") return { sessao: Boolean(data?.session) };
    if (error.code === "weak_password") return { erro: "Escolha uma senha mais forte." };
    if (error.status === 429) return { erro: "Muitas tentativas. Aguarde um pouco e tente novamente." };
    return { erro: "Não foi possível criar a conta. Confira os dados e a verificação de segurança." };
  } catch {
    return { erro: "Não foi possível concluir a solicitação. Tente novamente." };
  }
}

export async function sair() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
