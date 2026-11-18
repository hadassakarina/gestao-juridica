"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { botao, campo, cartao, EstadoConsulta, link, pagina, SeletorEscritorio, SemEscritorio, useConsulta } from "../escritorio-ui";
import { carregarDocumentos } from "./actions";
import { limitePdf } from "./arquivo/config";

export default function DocumentosPage() {
  const [escritorio, setEscritorio] = useState("");
  const [processo, setProcesso] = useState("");
  const { dados, atualizar } = useConsulta(carregarDocumentos, escritorio, processo);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!dados?.processoId || ocupado) return;
    const form = evento.currentTarget;
    const arquivo = new FormData(form).get("arquivo");
    setErro("");
    setMensagem("");
    if (!(arquivo instanceof File) || !arquivo.size || arquivo.size > limitePdf ||
        arquivo.name.length > 200 || !/\.pdf$/i.test(arquivo.name)) {
      setErro("Selecione um arquivo PDF de até 4 MB.");
      return;
    }
    setOcupado(true);
    try {
      const params = new URLSearchParams({ escritorio: dados.escritorioId, processo: dados.processoId });
      const nome = arquivo.name.slice(0, -4).normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 80) || "documento";
      const resposta = await fetch(`/documentos/arquivo?${params}`, {
        method: "POST", headers: { "Content-Type": "application/pdf", "X-Nome-Documento": `${nome}.pdf` }, body: arquivo,
      });
      if (resposta.status !== 201) {
        setErro(resposta.status === 422 ? "O arquivo não tem um cabeçalho PDF válido ou ultrapassa 4 MB." : "Não foi possível enviar o documento.");
        return;
      }
      form.reset();
      setMensagem("Documento enviado.");
      atualizar();
    } catch {
      setErro("Não foi possível enviar o documento.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className={pagina}>
      <h1 className="font-editorial text-4xl text-juridico">Documentos</h1>
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{erro}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-white p-3 text-juridico">{mensagem}</p>}
      {!dados && <EstadoConsulta falhou={dados === null} atualizar={() => { setEscritorio(""); setProcesso(""); atualizar(); }} />}
      {dados && !dados.escritorioId && <SemEscritorio />}
      {dados?.escritorioId && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <SeletorEscritorio escritorios={dados.escritorios} selecionado={dados.escritorioId} ocupado={ocupado}
              alterar={(id) => { setEscritorio(id); setProcesso(""); setMensagem(""); setErro(""); }} />
            {dados.processos.length > 0 && (
              <label className="block space-y-2 text-sm font-medium">
                <span>Processo</span>
                <select className={campo} value={dados.processoId} disabled={ocupado} onChange={(evento) => {
                  setProcesso(evento.target.value);
                  setMensagem("");
                  setErro("");
                }}>
                  {dados.processos.map(({ id, numero, titulo }) => <option key={id} value={id}>{numero} · {titulo}</option>)}
                </select>
              </label>
            )}
          </div>
          {!dados.processoId ? (
            <p className={cartao}>Cadastre um processo antes de enviar documentos. <Link href="/processos" className={link}>Abrir Processos</Link></p>
          ) : (
            <>
              <section className={cartao}>
                <h2 className="font-editorial text-2xl text-juridico">Enviar documento</h2>
                <form key={dados.processoId} className="space-y-4" onSubmit={enviar}>
                  <label className="block space-y-2">
                    <span>Arquivo PDF de até 4 MB</span>
                    <input className={campo} type="file" name="arquivo" accept="application/pdf,.pdf" disabled={ocupado} required />
                  </label>
                  <button className={botao} disabled={ocupado}>{ocupado ? "Enviando…" : "Enviar PDF"}</button>
                </form>
              </section>
              <section className={cartao}>
                <h2 className="font-editorial text-2xl text-juridico">Arquivos do processo</h2>
                {dados.arquivos.length === 0 && <p>Nenhum documento enviado.</p>}
                <ul className="divide-y divide-divisoria">
                  {dados.arquivos.map(({ objeto, nome }) => (
                    <li key={objeto} className="flex flex-wrap items-start justify-between gap-3 py-4 text-sm">
                      <span className="min-w-0 break-words">{nome}</span>
                      <a className={link} aria-label={`Baixar ${nome}`}
                        href={`/documentos/arquivo?${new URLSearchParams({ escritorio: dados.escritorioId, processo: dados.processoId, objeto })}`}>Baixar</a>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
