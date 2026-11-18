
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { autenticar } from "@/app/auth/actions";
import { TurnstileField } from "@/app/auth/turnstile";

export default function CadastroPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  async function criarConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setLoading(true);
    const captcha = new FormData(event.currentTarget).get("cf-turnstile-response");

    try {
      const resultado = await autenticar("cadastro", email, senha, typeof captcha === "string" ? captcha : undefined);
      if (resultado.erro) {
        setErro(resultado.erro);
        return;
      }

      if (resultado.sessao) {
        router.replace("/");
        router.refresh();
        return;
      }

      setSenha("");
      setAguardandoConfirmacao(true);
    } catch {
      setErro("Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setLoading(false);
      setTentativa((valor) => valor + 1);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-fundo px-4 py-12 text-juridico">
      <div className="w-full max-w-md">
        <div className="mb-9 text-center">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.25em] text-destaque"
          >
            Gestão Jurídica
          </Link>

          <h1 className="mt-7 font-serif text-4xl font-semibold">
            Crie sua conta
          </h1>

          <p className="mt-3 text-sm text-texto-suave">
            Cadastre seu e-mail para acessar o Gestão Jurídica.
          </p>
        </div>

        <div className="rounded-2xl border border-divisoria bg-white p-8 shadow-sm">
          {aguardandoConfirmacao ? (
            <div role="status" className="rounded-lg bg-fundo p-4 text-sm">
              Confira sua caixa de entrada e siga o link de confirmação.
              Depois de confirmar seu e-mail, você também pode entrar com a
              senha que cadastrou.
            </div>
          ) : (
            <form onSubmit={criarConta} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-lg border border-campo bg-white px-4 py-3 text-sm outline-none focus:border-juridico"
                />
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="mb-2 block text-sm font-medium"
                >
                  Senha
                </label>

                <input
                  id="senha"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Crie uma senha"
                  className="w-full rounded-lg border border-campo bg-white px-4 py-3 text-sm outline-none focus:border-juridico"
                />
                <p className="mt-2 text-xs text-texto-suave">Use pelo menos 6 caracteres.</p>
              </div>

              <TurnstileField key={tentativa} />

              {erro && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-juridico px-4 py-3 text-sm font-semibold text-white transition hover:bg-juridico-dark disabled:opacity-60"
              >
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          )}

          <div className="mt-7 border-t border-divisoria pt-6 text-center text-sm text-texto-suave">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-destaque hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-texto-suave">
          Gestão Jurídica — Organização inteligente para
          escritórios de advocacia.
        </p>
      </div>
    </main>
  );
}
