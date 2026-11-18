
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { autenticar } from "@/app/auth/actions";
import { TurnstileField } from "@/app/auth/turnstile";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tentativa, setTentativa] = useState(0);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const captcha = new FormData(event.currentTarget).get("cf-turnstile-response");

    try {
      const resultado = await autenticar("login", email, password, typeof captcha === "string" ? captcha : undefined);
      if (resultado.erro) {
        setError(resultado.erro);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
      setTentativa((valor) => valor + 1);
    }
  }

  return (
    <main className="grid min-h-screen bg-fundo lg:grid-cols-2">
      <section className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-juridico p-8 text-white md:p-12 lg:min-h-screen lg:p-16">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-bronze-claro/40 font-editorial text-3xl text-bronze-claro">
            G
          </div>

          <div>
            <h1 className="font-editorial text-xl">
              Gestão Jurídica
            </h1>
            <p className="mt-1 text-xs text-white/60">
              Gestão para escritórios
            </p>
          </div>
        </div>

        <div className="relative z-10 my-12 max-w-lg">
          <p className="mb-5 text-xs font-semibold tracking-[0.2em] text-bronze-claro">
            CONTROLE. CLAREZA. ORGANIZAÇÃO.
          </p>

          <h2 className="font-editorial text-4xl leading-tight md:text-5xl xl:text-6xl">
            A excelência começa na organização.
          </h2>

          <p className="mt-6 max-w-md text-sm leading-7 text-white/65">
            Processos, publicações, intimações e prazos
            reunidos em um ambiente pensado para a
            rotina do seu escritório.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          Gestão Jurídica — Ambiente de desenvolvimento
        </p>

        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10" />
      </section>

      <section className="flex items-center justify-center px-6 py-14 md:px-12">
        <div className="w-full max-w-md">
          <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-destaque">
            ACESSO À PLATAFORMA
          </p>

          <h2 className="font-editorial text-4xl text-juridico md:text-5xl">
            Bem-vindo de volta.
          </h2>

          <p className="mt-4 text-sm leading-6 text-texto-suave">
            Entre com suas credenciais para acessar
            o ambiente do seu escritório.
          </p>

          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-juridico"
              >
                E-mail profissional
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@escritorio.com.br"
                className="w-full rounded-xl border border-campo bg-white px-4 py-4 text-sm text-ink outline-none transition focus:border-juridico focus:ring-2 focus:ring-juridico/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-juridico"
              >
                Senha
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full rounded-xl border border-campo bg-white px-4 py-4 text-sm text-ink outline-none transition focus:border-juridico focus:ring-2 focus:ring-juridico/10"
              />
            </div>

            <TurnstileField key={tentativa} />

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-juridico px-6 py-4 text-sm font-semibold text-white transition hover:bg-juridico-dark disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar na plataforma"}
            </button>
          </form>

          <div className="mt-8 border-t border-divisoria pt-7 text-center">
            <p className="mb-3 text-sm text-juridico">
              Ainda não tem conta?{" "}
              <Link href="/cadastro" className="font-semibold hover:underline">
                Criar conta
              </Link>
            </p>
            <p className="text-xs text-texto-suave">
              Esqueceu sua senha? Recuperação em desenvolvimento.
            </p>
            <p className="mt-3 text-xs text-texto-suave">
              Acesso destinado a usuários autorizados.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
