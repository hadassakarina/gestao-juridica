"use client";

import Link from "next/link";
import { formatarData } from "@/lib/datas";
import { link, useConsulta } from "../escritorio-ui";
import { resumoTarefas } from "./actions";

export function ResumoTarefas() {
  const { dados } = useConsulta(resumoTarefas);
  return (
    <section className="space-y-4 rounded-2xl border border-divisoria bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-editorial text-2xl text-juridico">Atividades da equipe</h2>
        {dados && <span className="rounded-full bg-fundo px-3 py-1.5 text-xs text-juridico">{dados.total.toLocaleString("pt-BR")} {dados.total === 1 ? "pendente" : "pendentes"}</span>}
      </div>
      {dados?.tarefas.length ? (
        <ul className="divide-y divide-divisoria">
          {dados.tarefas.map(({ id, titulo, vencimento }) => (
            <li key={id} className="flex flex-wrap justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 break-words font-medium">{titulo}</span>
              {vencimento && <time dateTime={vencimento} className="text-texto-suave">{formatarData(vencimento)}</time>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-texto-suave">
          {dados === undefined ? "Carregando…" : dados === null ? "Tarefas indisponíveis." : "Nenhuma tarefa pendente."}
        </p>
      )}
      <Link href="/tarefas" className={link}>Abrir tarefas</Link>
    </section>
  );
}
