"use server";

import { clienteAutenticado, listarEscritorios, listarResponsaveis, uuid } from "@/lib/supabase/escritorios";
import { dataValida } from "@/lib/datas";
import type { Agenda } from "./tipos";

export async function carregarAgenda(selecao: string): Promise<Agenda | null> {
  if (typeof selecao !== "string" || (selecao && !uuid.test(selecao))) return null;
  try {
    const { supabase, user } = await clienteAutenticado();
    const escritorios = await listarEscritorios(supabase, user.id);
    const escritorioId = selecao || escritorios[0]?.id || "";
    if (!escritorioId) return { escritorios, escritorioId, processos: [], responsaveis: [], prazos: [] };
    if (!escritorios.some(({ id }) => id === escritorioId)) return null;

    const [processos, responsaveis, prazos] = await Promise.all([
      supabase.from("processos").select("id, numero, titulo").eq("escritorio_id", escritorioId)
        .order("numero").returns<Agenda["processos"]>(),
      listarResponsaveis(supabase, escritorioId),
      supabase.from("prazos").select("id, titulo, vencimento, processo_id, responsavel_id, situacao")
        .eq("escritorio_id", escritorioId).order("vencimento").order("id").returns<Agenda["prazos"]>(),
    ]);
    if (processos.error || prazos.error) return null;
    return { escritorios, escritorioId, processos: processos.data, responsaveis, prazos: prazos.data };
  } catch {
    return null;
  }
}

export async function salvarPrazo(escritorioId: string, prazoId: string, form: FormData): Promise<string | null> {
  if (typeof escritorioId !== "string" || !uuid.test(escritorioId) ||
      typeof prazoId !== "string" || (prazoId && !uuid.test(prazoId)) || !(form instanceof FormData)) {
    return "Dados do prazo inválidos.";
  }
  const titulo = form.get("titulo");
  const vencimento = form.get("vencimento");
  const processo = form.get("processo");
  const responsavel = form.get("responsavel");
  const situacao = form.get("situacao");
  if (typeof titulo !== "string" || !titulo.trim() || titulo.trim().length > 200 ||
      typeof vencimento !== "string" ||
      typeof processo !== "string" || !uuid.test(processo) ||
      typeof responsavel !== "string" || (responsavel && !uuid.test(responsavel)) ||
      (situacao !== "pendente" && situacao !== "concluido")) {
    return "Confira os campos do prazo.";
  }
  if (!dataValida(vencimento)) return "Informe uma data de vencimento válida.";

  try {
    const { supabase } = await clienteAutenticado();
    const campos = {
      titulo: titulo.trim(), vencimento, processo_id: processo, responsavel_id: responsavel || null, situacao,
    };
    const tabela = supabase.from("prazos");
    const { error } = prazoId
      ? await tabela.update(campos).eq("escritorio_id", escritorioId).eq("id", prazoId).select("id").single()
      : await tabela.insert({ escritorio_id: escritorioId, ...campos });
    if (error?.code === "23503") return "Selecione um processo e um responsável do mesmo escritório.";
    return error ? "Não foi possível salvar o prazo." : null;
  } catch {
    return "Não foi possível salvar o prazo.";
  }
}

export async function resumoPrazos() {
  try {
    const { supabase } = await clienteAutenticado();
    const { data, count, error } = await supabase.from("prazos")
      .select("id, titulo, vencimento", { count: "exact" }).eq("situacao", "pendente")
      .order("vencimento").order("id").limit(3)
      .returns<{ id: string; titulo: string; vencimento: string }[]>();
    return error ? null : { total: count ?? 0, proximos: data };
  } catch {
    return null;
  }
}
