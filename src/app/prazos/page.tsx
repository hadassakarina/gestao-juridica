"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { formatarData } from "@/lib/datas";
import { carregarAgenda, salvarPrazo } from "./actions";
import type { Agenda, Prazo } from "./tipos";

const campo = "block w-full rounded-lg border border-campo bg-white px-3 py-2";
const cartao = "space-y-4 rounded-2xl border border-divisoria bg-white p-5 sm:p-6";
const botao = "rounded-lg bg-juridico px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const link = "text-sm font-semibold text-juridico underline disabled:opacity-50";

export default function PrazosPage() {
  return (
    <Suspense fallback={<main className="px-5 py-8 sm:px-8" aria-busy="true">Carregando agenda…</main>}>
      <AgendaComSelecao />
    </Suspense>
  );
}

function AgendaComSelecao() {
  const params = useSearchParams();
  const escritorio = params.get("escritorio") ?? "";
  const processo = params.get("processo") ?? "";
  return <AgendaPrazos key={`${escritorio}:${processo}`} escritorio={escritorio} processo={processo} />;
}

function AgendaPrazos({ escritorio, processo }: { escritorio: string; processo: string }) {
  const [agenda, setAgenda] = useState<Agenda>();
  const [selecao, setSelecao] = useState(escritorio);
  const [processoInicial, setProcessoInicial] = useState(processo);
  const [revisao, setRevisao] = useState(0);
  const [edicao, setEdicao] = useState<Prazo>();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const dados = await carregarAgenda(selecao);
        if (ativo && dados) setAgenda(dados);
        else if (ativo) setErro("Não foi possível carregar a agenda.");
      } catch {
        if (ativo) setErro("Não foi possível carregar a agenda.");
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [selecao, revisao]);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!agenda || salvando) return;
    const formulario = new FormData(evento.currentTarget);
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const falha = await salvarPrazo(agenda.escritorioId, edicao?.id ?? "", formulario);
      if (falha) {
        setErro(falha);
        return;
      }
      setMensagem(edicao ? "Prazo atualizado." : "Prazo cadastrado.");
      setProcessoInicial("");
      setEdicao(undefined);
      setAgenda(undefined);
      setRevisao((valor) => valor + 1);
    } catch {
      setErro("Não foi possível salvar o prazo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <header className="space-y-3">
        <h1 className="font-editorial text-4xl text-juridico">Prazos</h1>
      </header>

      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{erro}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-juridico">{mensagem}</p>}
      {!agenda && (erro ? (
        <button className={botao} onClick={() => {
          setErro("");
          setSelecao("");
          setProcessoInicial("");
          setRevisao((valor) => valor + 1);
        }}>Tentar novamente</button>
      ) : <p role="status">Carregando agenda…</p>)}

      {agenda && !agenda.escritorioId && (
        <p className={cartao}>
          Crie um escritório ou aceite um convite em <Link href="/processos" className={link}>Processos</Link> para cadastrar prazos.
        </p>
      )}

      {agenda?.escritorioId && (
        <>
          <label className="block max-w-sm space-y-2 text-sm font-medium">
            <span>Escritório</span>
            <select className={campo} value={agenda.escritorioId} disabled={salvando} onChange={(evento) => {
              setSelecao(evento.target.value);
              setProcessoInicial("");
              setAgenda(undefined);
              setEdicao(undefined);
              setErro("");
              setMensagem("");
            }}>
              {agenda.escritorios.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
            </select>
          </label>

          <section className={cartao} id="formulario-prazo">
            <h2 className="font-editorial text-2xl text-juridico">{edicao ? "Editar prazo" : "Novo prazo"}</h2>
            {agenda.processos.length === 0 ? (
              <p>Cadastre um processo para adicionar o primeiro prazo.</p>
            ) : (
              <form key={edicao?.id ?? "novo"} onSubmit={salvar} className="space-y-4">
                <label className="block space-y-2">
                  <span>Título</span>
                  <input className={campo} name="titulo" maxLength={200} defaultValue={edicao?.titulo} required />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span>Processo</span>
                    <select className={campo} name="processo"
                      defaultValue={edicao?.processo_id ?? (agenda.processos.some(({ id }) => id === processoInicial) ? processoInicial : "")} required>
                      <option value="" disabled>Selecione um processo</option>
                      {agenda.processos.map(({ id, numero, titulo }) => (
                        <option key={id} value={id}>{numero} · {titulo}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span>Vencimento</span>
                    <input className={campo} name="vencimento" type="date" min="0001-01-01" max="9999-12-31" defaultValue={edicao?.vencimento} required />
                  </label>
                  <label className="space-y-2">
                    <span>Responsável</span>
                    <select className={campo} name="responsavel" defaultValue={edicao?.responsavel_id ?? ""}>
                      <option value="">Sem responsável</option>
                      {agenda.responsaveis.map(({ id, email }) => <option key={id} value={id}>{email}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span>Situação</span>
                    <select className={campo} name="situacao" defaultValue={edicao?.situacao ?? "pendente"}>
                      <option value="pendente">Pendente</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </label>
                </div>
                <div className="flex gap-4">
                  <button className={botao} disabled={salvando}>{edicao ? "Salvar alterações" : "Cadastrar prazo"}</button>
                  {edicao && <button type="button" className={link} disabled={salvando} onClick={() => setEdicao(undefined)}>Cancelar</button>}
                </div>
              </form>
            )}
          </section>

          <section className={cartao}>
            <h2 className="font-editorial text-2xl text-juridico">Agenda do escritório</h2>
            {agenda.prazos.length === 0 && <p>Nenhum prazo cadastrado.</p>}
            <ul className="divide-y divide-divisoria">
              {agenda.prazos.map((prazo) => {
                const processo = agenda.processos.find(({ id }) => id === prazo.processo_id);
                const responsavel = agenda.responsaveis.find(({ id }) => id === prazo.responsavel_id);
                return (
                  <li key={prazo.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 break-words">
                      <p className="font-medium">{prazo.titulo}</p>
                      <p className="text-sm text-texto-suave">
                        <time dateTime={prazo.vencimento}>{formatarData(prazo.vencimento)}</time>
                        {" · "}{prazo.situacao === "pendente" ? "Pendente" : "Concluído"}
                      </p>
                      <p className="text-sm text-texto-suave">
                        {processo?.numero ?? "Processo vinculado"}{" · "}{responsavel?.email ?? "Sem responsável"}
                      </p>
                    </div>
                    <button type="button" className={link} disabled={salvando} onClick={() => {
                      setEdicao(prazo);
                      document.getElementById("formulario-prazo")?.scrollIntoView({ block: "start" });
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
