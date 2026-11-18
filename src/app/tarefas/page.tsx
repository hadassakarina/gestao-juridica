"use client";

import { useState, type FormEvent } from "react";
import { formatarData } from "@/lib/datas";
import { botao, campo, cartao, EstadoConsulta, link, pagina, SeletorEscritorio, SemEscritorio, useConsulta } from "../escritorio-ui";
import { carregarTarefas, salvarTarefa, type Tarefa } from "./actions";

export default function TarefasPage() {
  const [escritorio, setEscritorio] = useState("");
  const { dados, atualizar } = useConsulta(carregarTarefas, escritorio);
  const [edicao, setEdicao] = useState<Tarefa>();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dados || ocupado) return;
    const form = new FormData(evento.currentTarget);
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const falha = await salvarTarefa(dados.escritorioId, edicao?.id ?? "", form);
      if (falha) setErro(falha);
      else {
        setMensagem(edicao ? "Tarefa atualizada." : "Tarefa cadastrada.");
        setEdicao(undefined);
        atualizar();
      }
    } catch {
      setErro("Não foi possível salvar a tarefa.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className={pagina}>
      <h1 className="font-editorial text-4xl text-juridico">Tarefas</h1>
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{erro}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-juridico">{mensagem}</p>}
      {!dados && <EstadoConsulta falhou={dados === null} atualizar={() => { setEscritorio(""); atualizar(); }} />}
      {dados && !dados.escritorioId && <SemEscritorio />}
      {dados?.escritorioId && (
        <>
          <SeletorEscritorio escritorios={dados.escritorios} selecionado={dados.escritorioId} ocupado={ocupado}
            alterar={(id) => { setEscritorio(id); setEdicao(undefined); setErro(""); setMensagem(""); }} />

          <section className={cartao} id="formulario-tarefa">
            <h2 className="font-editorial text-2xl text-juridico">{edicao ? "Editar tarefa" : "Nova tarefa"}</h2>
            <form key={edicao?.id ?? "nova"} className="space-y-4" onSubmit={salvar}>
              <label className="block space-y-2">
                <span>Título</span>
                <input className={campo} name="titulo" maxLength={200} defaultValue={edicao?.titulo} required />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span>Processo</span>
                  <select className={campo} name="processo" defaultValue={edicao?.processo_id ?? ""}>
                    <option value="">Sem processo</option>
                    {dados.processos.map(({ id, numero, titulo }) => <option key={id} value={id}>{numero} · {titulo}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span>Responsável</span>
                  <select className={campo} name="responsavel" defaultValue={edicao?.responsavel_id ?? ""}>
                    <option value="">Sem responsável</option>
                    {dados.responsaveis.map(({ id, email }) => <option key={id} value={id}>{email}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span>Vencimento (opcional)</span>
                  <input className={campo} type="date" name="vencimento" min="0001-01-01" max="9999-12-31" defaultValue={edicao?.vencimento ?? ""} />
                </label>
                <label className="space-y-2">
                  <span>Situação</span>
                  <select className={campo} name="situacao" defaultValue={edicao?.situacao ?? "pendente"}>
                    <option value="pendente">Pendente</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </label>
              </div>
              <div className="flex gap-4">
                <button className={botao} disabled={ocupado}>{edicao ? "Salvar alterações" : "Cadastrar tarefa"}</button>
                {edicao && <button type="button" className={link} onClick={() => setEdicao(undefined)} disabled={ocupado}>Cancelar</button>}
              </div>
            </form>
          </section>

          <section className={cartao}>
            <h2 className="font-editorial text-2xl text-juridico">Atividades da equipe</h2>
            {dados.tarefas.length === 0 && <p>Nenhuma tarefa cadastrada.</p>}
            <ul className="divide-y divide-divisoria">
              {dados.tarefas.map((tarefa) => {
                const responsavel = dados.responsaveis.find(({ id }) => id === tarefa.responsavel_id)?.email;
                const processo = dados.processos.find(({ id }) => id === tarefa.processo_id)?.numero;
                return (
                  <li key={tarefa.id} className="flex flex-wrap items-start justify-between gap-2 py-4">
                    <div className="min-w-0 space-y-1 break-words">
                      <p className="font-medium">{tarefa.titulo}</p>
                      <p className="text-sm text-texto-suave">
                        {[tarefa.situacao === "pendente" ? "Pendente" : "Concluída", responsavel ?? "Sem responsável",
                          tarefa.vencimento && formatarData(tarefa.vencimento), processo].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button type="button" className={link} disabled={ocupado} onClick={() => {
                      setEdicao(tarefa);
                      document.getElementById("formulario-tarefa")?.scrollIntoView({ block: "start" });
                    }}>Editar</button>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
