
import { ContadorProcessos } from "./processos/contador";
import { ResumoPrazos, TotalPrazos, Vencimentos } from "./prazos/resumo";
import { UltimasPublicacoes } from "./comunicacoes/ultimas-publicacoes";
import { ResumoTarefas } from "./tarefas/resumo";

const indicadores = [
  { nome: "Processos ativos", indicador: ContadorProcessos, detalhe: "Processos cadastrados" },
  { nome: "Prazos pendentes", indicador: TotalPrazos, detalhe: "Aguardando providência" },
];

export default function Home() {
  return (
    <ResumoPrazos>
      <main className="min-w-0">
        <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
          {/* APRESENTAÇÃO */}
          <section>
            <h1 className="font-editorial text-4xl font-medium tracking-tight text-juridico md:text-5xl">
              Visão geral
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-texto-suave">
              Uma visão clara dos processos, publicações e atividades
              que precisam da sua atenção.
            </p>
          </section>

          {/* INDICADORES */}
          <section className="grid gap-4 sm:grid-cols-2">
            {indicadores.map(({ nome, indicador: Indicador, detalhe }) => (
              <div
                key={nome}
                className="rounded-2xl border border-divisoria bg-white p-6"
              >
                <p className="text-sm font-medium text-texto-suave">
                  {nome}
                </p>

                <p className="mt-5 font-editorial text-5xl text-juridico">
                  <Indicador />
                </p>

                <p className="mt-3 text-xs text-texto-suave">
                  {detalhe}
                </p>
              </div>
            ))}
          </section>

          {/* PUBLICAÇÕES E PRAZOS */}
          <div className="grid items-start gap-6 xl:grid-cols-3">
            <section className="overflow-hidden rounded-2xl border border-divisoria bg-white xl:col-span-2">
              <div className="p-6">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-destaque">
                  MONITORAMENTO
                </p>
                <h2 className="mt-2 font-editorial text-2xl text-juridico">
                  Últimas publicações
                </h2>
              </div>
              <UltimasPublicacoes />
            </section>

            <section className="rounded-2xl border border-divisoria bg-white p-6">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-destaque">
                AGENDA JURÍDICA
              </p>
              <h2 className="mt-2 font-editorial text-2xl text-juridico">
                Prazos em aberto
              </h2>

              <Vencimentos />
            </section>
          </div>

          <ResumoTarefas />
        </div>
      </main>
    </ResumoPrazos>
  );
}
