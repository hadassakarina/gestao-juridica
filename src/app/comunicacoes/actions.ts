"use server";

import { dataValida } from "@/lib/datas";
import { clienteAutenticado, listarEscritorios, uuid } from "@/lib/supabase/escritorios";
import type { Registros, Tipo } from "./tipos";

export async function carregarComunicacoes(tipo: Tipo, selecao: string): Promise<Registros | null> {
  if ((tipo !== "publicacao" && tipo !== "intimacao") ||
      typeof selecao !== "string" || (selecao && !uuid.test(selecao))) return null;
  try {
    const { supabase, user } = await clienteAutenticado();
    const escritorios = await listarEscritorios(supabase, user.id);
    const escritorioId = selecao || escritorios[0]?.id || "";
    if (!escritorioId) return { escritorios, escritorioId, processos: [], comunicacoes: [] };
    if (!escritorios.some(({ id }) => id === escritorioId)) return null;

    const [processos, comunicacoes] = await Promise.all([
      supabase.from("processos").select("id, numero, titulo").eq("escritorio_id", escritorioId)
        .order("numero").returns<Registros["processos"]>(),
      supabase.from("comunicacoes").select("id, processo_id, titulo, data_comunicacao, observacoes")
        .eq("escritorio_id", escritorioId).eq("tipo", tipo).order("data_comunicacao", { ascending: false })
        .order("id", { ascending: false }).returns<Registros["comunicacoes"]>(),
    ]);
    if (processos.error || comunicacoes.error) return null;
    return { escritorios, escritorioId, processos: processos.data, comunicacoes: comunicacoes.data };
  } catch {
    return null;
  }
}

export async function salvarComunicacao(tipo: Tipo, escritorioId: string, registroId: string, form: FormData) {
  if ((tipo !== "publicacao" && tipo !== "intimacao") ||
      typeof escritorioId !== "string" || !uuid.test(escritorioId) ||
      typeof registroId !== "string" || (registroId && !uuid.test(registroId)) || !(form instanceof FormData)) {
    return "Dados do registro inválidos.";
  }
  const titulo = form.get("titulo");
  const processo = form.get("processo");
  const data = form.get("data");
  const observacoes = form.get("observacoes");
  if (typeof titulo !== "string" || !titulo.trim() || titulo.trim().length > 200 ||
      typeof processo !== "string" || !uuid.test(processo) ||
      typeof data !== "string" || !dataValida(data) ||
      typeof observacoes !== "string" || observacoes.trim().length > 4000) {
    return "Confira o título, o processo, a data e as observações.";
  }

  try {
    const { supabase } = await clienteAutenticado();
    const campos = { titulo: titulo.trim(), processo_id: processo, data_comunicacao: data, observacoes: observacoes.trim() || null };
    const tabela = supabase.from("comunicacoes");
    const { error } = registroId
      ? await tabela.update(campos).eq("id", registroId).eq("escritorio_id", escritorioId)
        .eq("tipo", tipo).select("id").single()
      : await tabela.insert({ escritorio_id: escritorioId, tipo, ...campos });
    if (error?.code === "23503") return "Selecione um processo do mesmo escritório.";
    return error ? "Não foi possível salvar o registro." : null;
  } catch {
    return "Não foi possível salvar o registro.";
  }
}

export async function ultimasPublicacoes() {
  try {
    const { supabase } = await clienteAutenticado();
    const { data, error } = await supabase.from("comunicacoes")
      .select("id, titulo, data_comunicacao, processo:processos(numero)")
      .eq("tipo", "publicacao").order("data_comunicacao", { ascending: false })
      .order("id", { ascending: false }).limit(5)
      .returns<{ id: string; titulo: string; data_comunicacao: string; processo: { numero: string } | null }[]>();
    return error ? null : data;
  } catch {
    return null;
  }
}
