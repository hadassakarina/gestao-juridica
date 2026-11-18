"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Escritorio } from "@/lib/supabase/escritorios";

export const campo = "block w-full rounded-lg border border-campo bg-white px-3 py-2";
export const cartao = "space-y-4 rounded-2xl border border-divisoria bg-white p-5 sm:p-6";
export const botao = "rounded-lg bg-juridico px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
export const link = "text-sm font-semibold text-juridico underline disabled:opacity-50";
export const pagina = "mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10";

export function useConsulta<Args extends string[], Dados>(
  carregar: (...args: Args) => Promise<Dados | null>,
  ...args: Args
) {
  const [revisao, setRevisao] = useState(0);
  const chave = JSON.stringify([revisao, args]);
  const [resultado, setResultado] = useState<{ chave: string; dados: Dados | null }>();

  useEffect(() => {
    let ativo = true;
    const [, parametros] = JSON.parse(chave) as [number, Args];
    void carregar(...parametros).then((dados) => {
      if (ativo) setResultado({ chave, dados });
    }).catch(() => {
      if (ativo) setResultado({ chave, dados: null });
    });
    return () => { ativo = false; };
  }, [carregar, chave]);

  return {
    dados: resultado?.chave === chave ? resultado.dados : undefined,
    atualizar: () => setRevisao((valor) => valor + 1),
  };
}

export function SeletorEscritorio({ escritorios, selecionado, alterar, ocupado }: {
  escritorios: Escritorio[];
  selecionado: string;
  alterar: (id: string) => void;
  ocupado?: boolean;
}) {
  return (
    <label className="block max-w-sm space-y-2 text-sm font-medium">
      <span>Escritório</span>
      <select className={campo} value={selecionado} disabled={ocupado} onChange={(evento) => alterar(evento.target.value)}>
        {escritorios.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
      </select>
    </label>
  );
}

export function SemEscritorio() {
  return <p className={cartao}>Crie um escritório ou aceite um convite em <Link href="/processos" className={link}>Processos</Link>.</p>;
}

export function EstadoConsulta({ falhou, atualizar }: { falhou: boolean; atualizar: () => void }) {
  return falhou ? (
    <div role="alert" className={cartao}>
      <p>Não foi possível carregar os dados.</p>
      <button className={botao} onClick={atualizar}>Tentar novamente</button>
    </div>
  ) : <p role="status">Carregando…</p>;
}
