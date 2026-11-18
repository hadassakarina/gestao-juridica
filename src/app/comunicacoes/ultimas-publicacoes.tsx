"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatarData } from "@/lib/datas";
import { ultimasPublicacoes } from "./actions";

export function UltimasPublicacoes() {
  const [registros, setRegistros] = useState<Awaited<ReturnType<typeof ultimasPublicacoes>>>();
  useEffect(() => {
    let ativo = true;
    void ultimasPublicacoes().then((dados) => {
      if (ativo) setRegistros(dados);
    }).catch(() => {
      if (ativo) setRegistros(null);
    });
    return () => { ativo = false; };
  }, []);

  return (
    <div className="space-y-4 px-6 pb-6">
      {registros?.length ? (
        <ul className="divide-y divide-divisoria">
          {registros.map(({ id, titulo, data_comunicacao, processo }) => (
            <li key={id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <div className="min-w-0 break-words">
                <p className="font-medium">{titulo}</p>
                {processo && <p className="text-xs text-texto-suave">{processo.numero}</p>}
              </div>
              <time className="text-texto-suave" dateTime={data_comunicacao}>{formatarData(data_comunicacao)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-texto-suave">
          {registros === undefined ? "Carregando…" : registros === null ? "Publicações indisponíveis." : "Nenhuma publicação cadastrada."}
        </p>
      )}
      <Link href="/publicacoes" className="text-sm font-semibold text-juridico underline">Ver publicações</Link>
    </div>
  );
}
