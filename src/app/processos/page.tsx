"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { carregarEscritorio, alterarEscritorio } from "./actions";

import type { Dados, Processo } from "./tipos";

const campo = "w-full rounded-lg border border-campo bg-white px-3 py-2";
const botao = "rounded-lg bg-juridico px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const link = "text-sm font-semibold text-juridico underline disabled:opacity-50";
const cartao = "space-y-4 rounded-2xl border border-divisoria bg-white p-5 sm:p-6";

export default function ProcessosPage() {
  return (
    <Suspense fallback={<main className="px-5 py-8 sm:px-8" aria-busy="true">Carregando processos…</main>}>
      <ProcessosComSelecao />
    </Suspense>
  );
}

function ProcessosComSelecao() {
  const escritorio = useSearchParams().get("escritorio") ?? "";
  return <Processos key={escritorio} escritorioInicial={escritorio} />;
}

function Processos({ escritorioInicial }: { escritorioInicial: string }) {
  const [dados, setDados] = useState<Dados>();
  const [escritorioId, setEscritorioId] = useState(escritorioInicial);
  const [revisao, setRevisao] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [falha, setFalha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [edicao, setEdicao] = useState<Processo>();

  const vinculo = dados?.vinculos.find(({ escritorio }) => escritorio?.id === escritorioId)
    ?? dados?.vinculos[0];
  const escritorio = vinculo?.escritorio;

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const atual = await carregarEscritorio(escritorioId);
        if (!atual || (escritorioId && !atual.vinculos.some(({ escritorio }) => escritorio?.id === escritorioId))) {
          throw new Error("Acesso indisponível");
        }
        if (ativo) {
          setDados(atual);
          setFalha("");
        }
      } catch {
        if (ativo) setFalha("Não foi possível carregar os escritórios. Confira sua sessão e tente novamente.");
      }
    }

    void carregar();
    return () => { ativo = false; };
  }, [escritorioId, revisao]);

  useEffect(() => {
    if (dados && escritorioInicial && window.location.hash === "#equipe") {
      document.getElementById("equipe")?.scrollIntoView({ block: "start" });
    }
  }, [dados, escritorioInicial]);

  async function executar(
    acao: () => PromiseLike<{ error?: unknown }>,
    sucesso: string,
    depois?: () => void,
  ) {
    setOcupado(true);
    setMensagem("");
    setFalha("");
    try {
      const { error } = await acao();
      if (error) throw error;
      depois?.();
      setMensagem(sucesso);
      setDados(undefined);
      setRevisao((valor) => valor + 1);
    } catch (error) {
      const duplicado = typeof error === "object" && error !== null &&
        "code" in error && error.code === "23505";
      setFalha(duplicado
        ? "Já existe um registro com esse dado neste escritório."
        : "Não foi possível salvar a alteração. Confira os dados e seu acesso.");
    } finally {
      setOcupado(false);
    }
  }

  function criarEscritorio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nome = String(new FormData(evento.currentTarget).get("nome")).trim();
    void executar(async () => {
      const { data, error } = await alterarEscritorio("criar", nome);
      if (data) setEscritorioId(data);
      return { error };
    }, "Escritório criado.");
  }

  function convidar(evento: FormEvent<HTMLFormElement>, id: string) {
    evento.preventDefault();
    const email = String(new FormData(evento.currentTarget).get("email")).trim().toLowerCase();
    if (dados?.membros.some((membro) => membro.email === email)) {
      setFalha("Essa pessoa já faz parte deste escritório.");
      return;
    }
    void executar(() => alterarEscritorio("convidar", id, email), "Convite criado. Peça à pessoa para abrir a página Processos com esse e-mail.");
  }

  function salvarProcesso(evento: FormEvent<HTMLFormElement>, id: string) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const processo = {
      numero: String(form.get("numero")).trim(),
      titulo: String(form.get("titulo")).trim(),
      situacao: String(form.get("situacao")),
    };
    if (!processo.numero || !processo.titulo) {
      setFalha("Preencha o número e o título do processo.");
      return;
    }
    void executar(() => alterarEscritorio("salvar", id, edicao?.id ?? "", processo.numero, processo.titulo, processo.situacao), edicao ? "Processo atualizado." : "Processo cadastrado.", () => setEdicao(undefined));
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <header className="space-y-3">
        <h1 className="font-editorial text-4xl text-juridico">Processos</h1>
      </header>

      {falha && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{falha}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-juridico">{mensagem}</p>}
      {!dados && (falha
        ? <button className={botao} onClick={() => { setFalha(""); setEscritorioId(""); setRevisao((valor) => valor + 1); }}>Tentar novamente</button>
        : <p role="status">Carregando escritórios…</p>)}

      {dados && (
        <>
          <section className={cartao}>
            <h2 className="font-editorial text-2xl text-juridico">Escritório</h2>
            {escritorio && (
              <label className="block max-w-sm space-y-2">
                <span className="text-sm font-medium">Escritório ativo</span>
                <select className={campo} value={escritorio.id} disabled={ocupado} onChange={(evento) => {
                  setEscritorioId(evento.target.value);
                  setDados(undefined);
                  setEdicao(undefined);
                  setMensagem("");
                  setFalha("");
                }}>
                  {dados.vinculos.map(({ escritorio: item }) => item &&
                    <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </label>
            )}
            {dados.convites.map((convite) => (
              <div key={convite.id} className="flex flex-wrap items-center justify-between gap-3">
                <p>Convite para {convite.escritorio?.nome ?? "um escritório"}</p>
                <button type="button" className={botao} disabled={ocupado} onClick={() => void executar(async () => {
                  const { data, error } = await alterarEscritorio("aceitar", convite.id);
                  if (data) setEscritorioId(data);
                  return { error };
                }, "Convite aceito.", () => setEdicao(undefined))}>Aceitar convite</button>
              </div>
            ))}
            {!escritorio && (
              <form onSubmit={criarEscritorio} className="flex flex-wrap items-end gap-3">
                <label className="block flex-1 space-y-2">
                  <span className="text-sm font-medium">Nome do novo escritório</span>
                  <input className={campo} name="nome" maxLength={120} required />
                </label>
                <button className={botao} disabled={ocupado}>Criar escritório</button>
              </form>
            )}
          </section>

          {escritorio && (
            <>
              <section className={cartao}>
                <h2 className="font-editorial text-2xl text-juridico">{edicao ? "Editar processo" : "Novo processo"}</h2>
                <form id="processo-formulario" key={edicao?.id ?? "novo"} onSubmit={(evento) => salvarProcesso(evento, escritorio.id)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Número</span>
                      <input className={campo} name="numero" defaultValue={edicao?.numero} maxLength={50} required />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Título</span>
                      <input className={campo} name="titulo" defaultValue={edicao?.titulo} maxLength={200} required />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Situação</span>
                      <select className={campo} name="situacao" defaultValue={edicao?.situacao ?? "ativo"}>
                        <option value="ativo">Ativo</option>
                        <option value="encerrado">Encerrado</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <button className={botao} disabled={ocupado}>{edicao ? "Salvar alterações" : "Cadastrar processo"}</button>
                    {edicao && <button type="button" className={link} disabled={ocupado} onClick={() => setEdicao(undefined)}>Cancelar</button>}
                  </div>
                </form>
              </section>

              <section className={cartao}>
                <h2 className="font-editorial text-2xl text-juridico">Processos do escritório</h2>
                {dados.processos.length === 0 && <p className="text-sm">Nenhum processo cadastrado.</p>}
                <ul className="divide-y divide-divisoria">
                  {dados.processos.map((processo) => (
                    <li key={processo.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0 break-words">
                        <p className="font-medium">{processo.titulo}</p>
                        <p className="text-sm text-texto-suave">{processo.numero} · {processo.situacao === "ativo" ? "Ativo" : "Encerrado"}</p>
                      </div>
                      <button type="button" className={link} disabled={ocupado} onClick={() => {
                        setEdicao(processo);
                        document.getElementById("processo-formulario")?.scrollIntoView({ block: "nearest" });
                      }}>Editar</button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {escritorio && vinculo.papel === "admin" && (
            <section className={cartao} id="equipe">
              <h2 className="font-editorial text-2xl text-juridico">Equipe</h2>
              <form onSubmit={(evento) => convidar(evento, escritorio.id)} className="flex flex-wrap items-end gap-3">
                <label className="block flex-1 space-y-2">
                  <span className="text-sm font-medium">E-mail da pessoa convidada</span>
                  <input className={campo} name="email" type="email" maxLength={254} required />
                </label>
                <button className={botao} disabled={ocupado}>Criar convite</button>
              </form>
              <ul className="divide-y divide-divisoria">
                {dados.membros.map((membro) => (
                  <li key={membro.usuario_id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <span>{membro.email} · {membro.papel === "admin" ? "Administrador" : "Membro"}</span>
                    {membro.papel === "membro" && (
                      <button type="button" className={link} disabled={ocupado} onClick={() => {
                        if (window.confirm(`Remover o acesso de ${membro.email}?`)) {
                          void executar(() => alterarEscritorio("remover", escritorio.id, membro.usuario_id), "Acesso removido.");
                        }
                      }}>Remover acesso</button>
                    )}
                  </li>
                ))}
                {dados.convitesEnviados.map((convite) => (
                  <li key={convite.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <span>{convite.email} · Convite pendente</span>
                    <button type="button" className={link} disabled={ocupado} onClick={() => void executar(
                      () => alterarEscritorio("cancelar", escritorio.id, convite.id),
                      "Convite cancelado.",
                    )}>Cancelar convite</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
