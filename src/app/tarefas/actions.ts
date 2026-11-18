"use server";

import { dataValida } from "@/lib/datas";
import { clienteAutenticado, listarEscritorios, listarResponsaveis, uuid } from "@/lib/supabase/escritorios";

export type Tarefa = {
  id: string; titulo: string; processo_id: string | null; responsavel_id: string | null;
  vencimento: string | null; situacao: "pendente" | "concluida";
};

export async function carregarTarefas(selecao: string) {
  if (typeof selecao !== "string" || (selecao && !uuid.test(selecao))) return null;
  try {
    const { supabase, user } = await clienteAutenticado();
    const escritorios = await listarEscritorios(supabase, user.id);
    const escritorioId = selecao || escritorios[0]?.id || "";
    if (!escritorioId) return { escritorios, escritorioId, tarefas: [], processos: [], responsaveis: [] };
    if (!escritorios.some(({ id }) => id === escritorioId)) return null;
    const [tarefas, processos, responsaveis] = await Promise.all([
      supabase.from("tarefas").select("id,titulo,processo_id,responsavel_id,vencimento,situacao")
        .eq("escritorio_id", escritorioId).order("situacao", { ascending: false })
        .order("vencimento", { nullsFirst: false }).order("id").returns<Tarefa[]>(),
      supabase.from("processos").select("id,numero,titulo").eq("escritorio_id", escritorioId)
        .order("numero").returns<{ id: string; numero: string; titulo: string }[]>(),
      listarResponsaveis(supabase, escritorioId),
    ]);
    if (tarefas.error || processos.error) return null;
    return { escritorios, escritorioId, tarefas: tarefas.data, processos: processos.data, responsaveis };
  } catch {
    return null;
  }
}

export async function salvarTarefa(escritorio: string, id: string, form: FormData) {
  if (typeof escritorio !== "string" || !uuid.test(escritorio) || typeof id !== "string" ||
      (id && !uuid.test(id)) || !(form instanceof FormData)) return "Dados da tarefa inválidos.";
  const titulo = form.get("titulo");
  const prazo = form.get("vencimento");
  const processo = form.get("processo");
  const responsavel = form.get("responsavel");
  const situacao = form.get("situacao");
  if (typeof titulo !== "string" || !titulo.trim() || titulo.trim().length > 200 ||
      typeof prazo !== "string" || (prazo && !dataValida(prazo)) ||
      typeof processo !== "string" || (processo && !uuid.test(processo)) ||
      typeof responsavel !== "string" || (responsavel && !uuid.test(responsavel)) ||
      (situacao !== "pendente" && situacao !== "concluida")) return "Confira os campos da tarefa.";

  try {
    const { supabase } = await clienteAutenticado();
    const campos = { titulo: titulo.trim(), vencimento: prazo || null, processo_id: processo || null,
      responsavel_id: responsavel || null, situacao };
    const tabela = supabase.from("tarefas");
    const { error } = id ? await tabela.update(campos).eq("escritorio_id", escritorio).eq("id", id).select("id").single()
      : await tabela.insert({ escritorio_id: escritorio, ...campos });
    return error ? "Não foi possível salvar a tarefa. Confira o vínculo e seu acesso." : null;
  } catch {
    return "Não foi possível salvar a tarefa.";
  }
}

export async function resumoTarefas() {
  try {
    const { supabase } = await clienteAutenticado();
    const { data, count, error } = await supabase.from("tarefas").select("id,titulo,vencimento", { count: "exact" })
      .eq("situacao", "pendente").order("vencimento", { nullsFirst: false }).order("id").limit(4)
      .returns<Pick<Tarefa, "id" | "titulo" | "vencimento">[]>();
    return error ? null : { total: count ?? 0, tarefas: data };
  } catch {
    return null;
  }
}
