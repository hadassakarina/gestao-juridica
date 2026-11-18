"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { formatarData } from "@/lib/datas";
import { carregarComunicacoes, salvarComunicacao } from "./actions";
import { tipos, type Comunicacao, type Registros, type Tipo } from "./tipos";

const campo = "block w-full rounded-lg border border-campo bg-white px-3 py-2";
const cartao = "space-y-4 rounded-2xl border border-divisoria bg-white p-5 sm:p-6";
const botao = "rounded-lg bg-juridico px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const link = "text-sm font-semibold text-juridico underline disabled:opacity-50";

export function RegistrosComunicacoes({ tipo }: { tipo: Tipo }) {
  const { plural, singular } = tipos[tipo];
  const [dados, setDados] = useState<Registros>();
  const [escritorio, setEscritorio] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [edicao, setEdicao] = useState<Comunicacao>();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;
    void carregarComunicacoes(tipo, escritorio).then((registros) => {
      if (!ativo) return;
      if (registros) setDados(registros);
      else setErro("Não foi possível carregar os registros.");
    }).catch(() => {
      if (ativo) setErro("Não foi possível carregar os registros.");
    });
    return () => { ativo = false; };
  }, [tipo, escritorio, revisao]);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dados || salvando) return;
    const formulario = new FormData(evento.currentTarget);
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const falha = await salvarComunicacao(tipo, dados.escritorioId, edicao?.id ?? "", formulario);
      if (falha) {
        setErro(falha);
        return;
      }
      setMensagem(edicao ? "Registro atualizado." : "Registro salvo.");
      setEdicao(undefined);
      setDados(undefined);
      setRevisao((valor) => valor + 1);
    } catch {
      setErro("Não foi possível salvar o registro.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <h1 className="font-editorial text-4xl text-juridico">{plural}</h1>
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{erro}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-juridico">{mensagem}</p>}

      {!dados && (erro ? (
        <button className={botao} onClick={() => {
          setErro("");
          setEscritorio("");
          setRevisao((valor) => valor + 1);
        }}>Tentar novamente</button>
      ) : <p role="status">Carregando registros…</p>)}

      {dados && !dados.escritorioId && (
        <p className={cartao}>Crie um escritório ou aceite um convite em <Link href="/processos" className={link}>Processos</Link>.</p>
      )}

      {dados?.escritorioId && (
        <>
          <label className="block max-w-sm space-y-2 text-sm font-medium">
            <span>Escritório</span>
            <select className={campo} value={dados.escritorioId} disabled={salvando} onChange={(evento) => {
              setEscritorio(evento.target.value);
              setDados(undefined);
              setEdicao(undefined);
              setErro("");
              setMensagem("");
            }}>
              {dados.escritorios.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
            </select>
          </label>

          <section className={cartao} id="formulario-comunicacao">
            <h2 className="font-editorial text-2xl text-juridico">{edicao ? `Editar ${singular}` : `Registrar ${singular}`}</h2>
            {dados.processos.length === 0 ? (
              <p>Cadastre um processo antes de adicionar um registro. <Link href="/processos" className={link}>Abrir Processos</Link></p>
            ) : (
              <form key={edicao?.id ?? "novo"} onSubmit={salvar} className="space-y-4">
                <label className="block space-y-2">
                  <span>Título</span>
                  <input className={campo} name="titulo" maxLength={200} defaultValue={edicao?.titulo} required />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span>Processo</span>
                    <select className={campo} name="processo" defaultValue={edicao?.processo_id ?? ""} required>
                      <option value="" disabled>Selecione um processo</option>
                      {dados.processos.map(({ id, numero, titulo }) => <option key={id} value={id}>{numero} · {titulo}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span>Data da {singular}</span>
                    <input className={campo} name="data" type="date" min="0001-01-01" max="9999-12-31"
                      defaultValue={edicao?.data_comunicacao} required />
                  </label>
                </div>
                <label className="block space-y-2">
                  <span>Observações <span className="text-xs text-texto-suave">(opcional)</span></span>
                  <textarea className={campo} name="observacoes" rows={3} maxLength={4000} defaultValue={edicao?.observacoes ?? ""} />
                </label>
                <div className="flex gap-4">
                  <button className={botao} disabled={salvando}>{edicao ? "Salvar alterações" : "Registrar"}</button>
                  {edicao && <button type="button" className={link} disabled={salvando} onClick={() => setEdicao(undefined)}>Cancelar</button>}
                </div>
              </form>
            )}
          </section>

          <section className={cartao}>
            <h2 className="font-editorial text-2xl text-juridico">{plural} do escritório</h2>
            {dados.comunicacoes.length === 0 && <p>Nenhum registro encontrado.</p>}
            <ul className="divide-y divide-divisoria">
              {dados.comunicacoes.map((registro) => {
                const processo = dados.processos.find(({ id }) => id === registro.processo_id);
                const prazo = { pathname: "/prazos", query: { escritorio: dados.escritorioId, processo: registro.processo_id }, hash: "formulario-prazo" };
                return (
                  <li key={registro.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                    <div className="min-w-0 space-y-1 break-words">
                      <p className="font-medium">{registro.titulo}</p>
                      <p className="text-sm text-texto-suave">
                        <time dateTime={registro.data_comunicacao}>{formatarData(registro.data_comunicacao)}</time>
                        {processo && ` · ${processo.numero}`}
                      </p>
                      {registro.observacoes && <p className="whitespace-pre-wrap text-sm">{registro.observacoes}</p>}
                    </div>
                    <div className="flex gap-4">
                      <button type="button" className={link} disabled={salvando} onClick={() => {
                        setEdicao(registro);
                        document.getElementById("formulario-comunicacao")?.scrollIntoView({ block: "start" });
                      }}>Editar</button>
                      <Link href={prazo} className={link}>Criar prazo</Link>
                    </div>
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
