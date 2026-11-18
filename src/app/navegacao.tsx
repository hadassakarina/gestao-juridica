"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { sair } from "./auth/actions";

const ferramentas = [
  { href: "/", nome: "Visão geral" },
  { href: "/processos", nome: "Processos" },
  { href: "/clientes", nome: "Clientes" },
  { href: "/publicacoes", nome: "Publicações" },
  { href: "/intimacoes", nome: "Intimações" },
  { href: "/prazos", nome: "Prazos" },
  { href: "/tarefas", nome: "Tarefas" },
  { href: "/documentos", nome: "Documentos" },
  { href: "/configuracoes", nome: "Configurações" },
];

function Menu({ caminho, aoNavegar }: { caminho: string; aoNavegar?: () => void }) {
  return (
    <nav aria-label="Ferramentas do escritório" className="space-y-1.5">
      {ferramentas.map(({ href, nome }) => (
        <Link
          key={href}
          href={href}
          aria-current={caminho === href ? "page" : undefined}
          onClick={aoNavegar}
          className="block rounded-lg border-l-2 border-transparent px-4 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/10 aria-[current=page]:border-bronze-claro aria-[current=page]:bg-white/12 aria-[current=page]:text-white"
        >
          {nome}
        </Link>
      ))}
    </nav>
  );
}

function Sair() {
  return (
    <form action={sair} className="border-t border-white/15 pt-4">
      <button className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-stone-200 hover:bg-white/10">Sair</button>
    </form>
  );
}

export function Navegacao({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    function fecharNoDesktop() {
      if (desktop.matches) dialogo.current?.close();
    }
    desktop.addEventListener("change", fecharNoDesktop);
    return () => desktop.removeEventListener("change", fecharNoDesktop);
  }, []);

  if (!ferramentas.some(({ href }) => href === caminho)) return children;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-10 border-r border-white/10 bg-juridico-dark px-5 py-7 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3 px-1">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-bronze-claro font-editorial text-2xl text-juridico-dark">G</span>
          <span className="font-editorial text-lg leading-tight">Gestão Jurídica</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Menu caminho={caminho} />
        </div>
        <Sair />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/10 bg-juridico-dark px-5 py-3 text-white lg:hidden">
          <button type="button" aria-haspopup="dialog" onClick={() => dialogo.current?.showModal()}
            className="rounded-lg border border-white/40 px-3 py-2 text-sm font-medium hover:bg-white/10">Menu</button>
          <Link href="/" className="font-editorial text-lg">Gestão Jurídica</Link>
        </header>

        <dialog ref={dialogo} aria-labelledby="titulo-menu" className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[18rem] max-w-[85vw] bg-juridico-dark p-0 text-white backdrop:bg-juridico-dark/65 lg:hidden"
          onClick={(evento) => { if (evento.target === evento.currentTarget) dialogo.current?.close(); }}>
          <div className="flex min-h-full flex-col gap-6 px-5 py-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-menu" className="font-editorial text-lg">Gestão Jurídica</h2>
              <button type="button" onClick={() => dialogo.current?.close()}
                className="rounded-lg border border-white/40 px-2.5 py-1.5 text-sm hover:bg-white/10">Fechar</button>
            </div>
            <div className="flex-1">
              <Menu caminho={caminho} aoNavegar={() => dialogo.current?.close()} />
            </div>
            <Sair />
          </div>
        </dialog>

        {children}
      </div>
    </div>
  );
}
