"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { resumoPrazos } from "./actions";
import { formatarData } from "@/lib/datas";

type Resumo = Awaited<ReturnType<typeof resumoPrazos>>;
const Contexto = createContext<Resumo | undefined>(undefined);

export function ResumoPrazos({ children }: { children: ReactNode }) {
  const [resumo, setResumo] = useState<Resumo>();
  useEffect(() => {
    let ativo = true;
    void resumoPrazos().then((dados) => {
      if (ativo) setResumo(dados);
    }).catch(() => {
      if (ativo) setResumo(null);
    });
    return () => { ativo = false; };
  }, []);
  return <Contexto.Provider value={resumo}>{children}</Contexto.Provider>;
}

export function TotalPrazos() {
  return useContext(Contexto)?.total.toLocaleString("pt-BR") ?? "—";
}

export function Vencimentos() {
  const resumo = useContext(Contexto);
  return (
    <div className="mt-5 space-y-4">
      {resumo?.proximos.length ? (
        <ul className="divide-y divide-divisoria">
          {resumo.proximos.map(({ id, titulo, vencimento }) => (
            <li key={id} className="space-y-1 py-3">
              <p className="break-words text-sm font-medium text-juridico">{titulo}</p>
              <time className="text-xs text-texto-suave" dateTime={vencimento}>{formatarData(vencimento)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-texto-suave">
          {resumo === undefined ? "Carregando…" : resumo === null ? "Agenda indisponível." : "Nenhum prazo pendente."}
        </p>
      )}
      <Link href="/prazos" className="text-sm font-semibold text-juridico underline">Abrir agenda</Link>
    </div>
  );
}
