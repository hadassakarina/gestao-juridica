"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { botao, campo, cartao, EstadoConsulta, link, pagina, SeletorEscritorio, SemEscritorio, useConsulta } from "../escritorio-ui";
import { carregarConfiguracoes, renomearEscritorio } from "./actions";

export default function ConfiguracoesPage() {
  const [escritorio, setEscritorio] = useState("");
  const { dados, atualizar } = useConsulta(carregarConfiguracoes, escritorio);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dados?.ativo || ocupado) return;
    const nome = new FormData(evento.currentTarget).get("nome");
    if (typeof nome !== "string") return;
    setOcupado(true);
    setErro("");
    setMensagem("");
    try {
      const falha = await renomearEscritorio(dados.ativo.id, nome);
      if (falha) setErro(falha);
      else {
        setMensagem("Nome do escritório atualizado.");
        atualizar();
      }
    } catch {
      setErro("Não foi possível salvar as configurações.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className={pagina}>
      <h1 className="font-editorial text-4xl text-juridico">Configurações</h1>
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{erro}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-juridico">{mensagem}</p>}
      {!dados && <EstadoConsulta falhou={dados === null} atualizar={() => { setEscritorio(""); atualizar(); }} />}
      {dados && !dados.ativo && <SemEscritorio />}
      {dados?.ativo && (
        <>
          <SeletorEscritorio escritorios={dados.escritorios} selecionado={dados.ativo.id} ocupado={ocupado}
            alterar={(id) => { setEscritorio(id); setErro(""); setMensagem(""); }} />
          <section className={cartao}>
            <h2 className="font-editorial text-2xl text-juridico">Escritório</h2>
            <p className="text-sm text-texto-suave">Seu acesso: {dados.administrador ? "Administrador" : "Membro"}</p>
            {dados.administrador ? (
              <>
                <form key={dados.ativo.id} className="max-w-md space-y-4" onSubmit={salvar}>
                  <label className="block space-y-2">
                    <span>Nome do escritório</span>
                    <input className={campo} name="nome" defaultValue={dados.ativo.nome} maxLength={120} required />
                  </label>
                  <button className={botao} disabled={ocupado}>Salvar nome</button>
                </form>
                <Link className={link} href={{ pathname: "/processos", query: { escritorio: dados.ativo.id }, hash: "equipe" }}>
                  Gerenciar equipe em Processos
                </Link>
              </>
            ) : <p>{dados.ativo.nome}</p>}
          </section>
        </>
      )}
    </main>
  );
}
