"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { alterarVinculoCliente, carregarClientes, salvarCliente } from "./actions";
import type { Carteira } from "./tipos";

const campo = "w-full rounded-lg border border-campo bg-white px-3 py-2";
const cartao = "space-y-4 rounded-2xl border border-divisoria bg-white p-5 sm:p-6";
const botao = "rounded-lg bg-juridico px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const link = "text-sm font-semibold text-juridico underline disabled:opacity-50";

export default function ClientesPage() {
  const [carteira, setCarteira] = useState<Carteira>();
  const [escritorio, setEscritorio] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const cliente = carteira?.clientes.find(({ id }) => id === clienteId);
  const vinculados = carteira?.processos.filter((processo) => processo.cliente_id === cliente?.id) ?? [];
  const disponiveis = carteira?.processos.filter((processo) => processo.cliente_id === null) ?? [];

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const dados = await carregarClientes(escritorio);
        if (!ativo) return;
        if (dados) setCarteira(dados);
        else setErro("Não foi possível carregar os clientes.");
      } catch {
        if (ativo) setErro("Não foi possível carregar os clientes.");
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [escritorio, revisao]);

  function atualizar() {
    setCarteira(undefined);
    setRevisao((valor) => valor + 1);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado || !carteira) return;
    const form = new FormData(evento.currentTarget);
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const resultado = await salvarCliente(carteira.escritorioId, cliente?.id ?? "", form);
      if (!resultado.id) {
        setErro(resultado.erro ?? "Não foi possível salvar o cliente.");
        return;
      }
      setClienteId(resultado.id);
      setMensagem(cliente ? "Cliente atualizado." : "Cliente cadastrado.");
      atualizar();
    } catch {
      setErro("Não foi possível salvar o cliente.");
    } finally {
      setOcupado(false);
    }
  }

  async function mudarVinculo(processoId: string, vincular: boolean) {
    if (ocupado || !carteira || !cliente) return;
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const falha = await alterarVinculoCliente(carteira.escritorioId, cliente.id, processoId, vincular);
      if (falha) setErro(falha);
      else {
        setMensagem(vincular ? "Processo vinculado." : "Vínculo removido.");
        atualizar();
      }
    } catch {
      setErro("Não foi possível alterar o vínculo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <header className="space-y-3">
        <h1 className="font-editorial text-4xl text-juridico">Clientes</h1>
      </header>

      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{erro}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-juridico">{mensagem}</p>}
      {!carteira && (erro ? (
        <button className={botao} onClick={() => {
          setErro("");
          setEscritorio("");
          setClienteId("");
          atualizar();
        }}>Tentar novamente</button>
      ) : <p role="status">Carregando clientes…</p>)}

      {carteira && !carteira.escritorioId && (
        <p className={cartao}>Crie um escritório ou aceite um convite em <Link href="/processos" className={link}>Processos</Link> para cadastrar clientes.</p>
      )}

      {carteira?.escritorioId && (
        <>
          <label className="block max-w-sm space-y-2 text-sm font-medium">
            <span>Escritório</span>
            <select className={campo} value={carteira.escritorioId} disabled={ocupado} onChange={(evento) => {
              setEscritorio(evento.target.value);
              setClienteId("");
              setCarteira(undefined);
              setErro("");
              setMensagem("");
            }}>
              {carteira.escritorios.map(({ id, nome }) => <option key={id} value={id}>{nome}</option>)}
            </select>
          </label>

          <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <section className={cartao}>
              <h2 className="font-editorial text-2xl text-juridico">Clientes do escritório</h2>
              <button className={botao} disabled={ocupado} onClick={() => {
                setClienteId("");
                setErro("");
                setMensagem("");
              }}>Novo cliente</button>
              {carteira.clientes.length === 0 && <p className="text-sm">Nenhum cliente cadastrado.</p>}
              <ul className="divide-y divide-divisoria">
                {carteira.clientes.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="w-full break-words py-3 text-left text-sm text-juridico hover:underline aria-pressed:font-bold"
                      aria-pressed={cliente?.id === item.id} disabled={ocupado} onClick={() => {
                        setClienteId(item.id);
                        setErro("");
                        setMensagem("");
                      }}>{item.nome}{item.email && <span className="block text-xs text-texto-suave">{item.email}</span>}</button>
                  </li>
                ))}
              </ul>
            </section>

            <div className="space-y-5">
              <section className={cartao}>
                <h2 className="font-editorial text-2xl text-juridico">{cliente ? "Dados do cliente" : "Cadastrar cliente"}</h2>
                <form key={cliente?.id ?? "novo"} className="space-y-4" onSubmit={salvar}>
                  <label className="block space-y-2">
                    <span>Nome</span>
                    <input className={campo} name="nome" defaultValue={cliente?.nome} maxLength={160} required />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span>E-mail <span className="text-xs text-texto-suave">(opcional)</span></span>
                      <input className={campo} name="email" type="email" defaultValue={cliente?.email ?? ""} maxLength={254} />
                    </label>
                    <label className="space-y-2">
                      <span>Telefone <span className="text-xs text-texto-suave">(opcional)</span></span>
                      <input className={campo} name="telefone" type="tel" defaultValue={cliente?.telefone ?? ""} maxLength={40} />
                    </label>
                  </div>
                  <button className={botao} disabled={ocupado}>{cliente ? "Salvar alterações" : "Cadastrar cliente"}</button>
                </form>
              </section>

              {cliente && (
                <section className={cartao}>
                  <h2 className="font-editorial text-2xl text-juridico">Processos vinculados</h2>
                  {vinculados.length === 0 && <p className="text-sm">Nenhum processo vinculado.</p>}
                  <ul className="divide-y divide-divisoria">
                    {vinculados.map(({ id, numero, titulo }) => (
                      <li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm" key={id}>
                        <span className="break-words">{numero} · {titulo}</span>
                        <button type="button" className={link} disabled={ocupado} onClick={() => void mudarVinculo(id, false)}>Desvincular</button>
                      </li>
                    ))}
                  </ul>
                  {disponiveis.length > 0 ? (
                    <form key={cliente.id} className="flex flex-wrap items-end gap-3" onSubmit={(evento) => {
                      evento.preventDefault();
                      const processo = new FormData(evento.currentTarget).get("processo");
                      if (typeof processo === "string" && processo) void mudarVinculo(processo, true);
                    }}>
                      <label className="min-w-0 flex-1 space-y-2">
                        <span>Processo sem cliente</span>
                        <select className={campo} name="processo" defaultValue="" required>
                          <option disabled value="">Selecione um processo</option>
                          {disponiveis.map(({ id, numero, titulo }) => <option key={id} value={id}>{numero} · {titulo}</option>)}
                        </select>
                      </label>
                      <button className={botao} disabled={ocupado}>Vincular processo</button>
                    </form>
                  ) : <p className="text-sm text-texto-suave">Nenhum processo disponível para vincular.</p>}
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
