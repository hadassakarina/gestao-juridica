"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Convite, ConviteRecebido, Dados, Membro, Processo, Vinculo } from "./tipos";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function carregarEscritorio(escritorioId: string): Promise<Dados | null> {
  if (escritorioId !== "" && (typeof escritorioId !== "string" || !uuid.test(escritorioId))) return null;
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) throw new Error("Sessão indisponível");
  
    const [vinculos, convites] = await Promise.all([
      supabase.from("escritorio_membros")
        .select("papel, escritorio:escritorios(id, nome)")
        .eq("usuario_id", user.id)
        .order("escritorio_id")
        .returns<Vinculo[]>(),
      supabase.from("escritorio_convites")
        .select("id, escritorio:escritorios(id, nome)")
        .eq("email", user.email.toLowerCase())
        .returns<ConviteRecebido[]>(),
    ]);
    if (vinculos.error || convites.error) throw new Error("Acesso indisponível");
  
    const selecionado = vinculos.data.find(({ escritorio }) => escritorio?.id === escritorioId)
      ?? vinculos.data[0];
    const id = selecionado?.escritorio?.id;
    const atual: Dados = {
      vinculos: vinculos.data,
      convites: convites.data,
      processos: [],
      membros: [],
      convitesEnviados: [],
    };
  
    if (id) {
      const processos = await supabase.from("processos")
        .select("id, numero, titulo, situacao")
        .eq("escritorio_id", id)
        .order("numero")
        .returns<Processo[]>();
      if (processos.error) throw processos.error;
      atual.processos = processos.data;
    }
  
    if (id && selecionado.papel === "admin") {
      const [membros, pendentes] = await Promise.all([
        supabase.from("escritorio_membros").select("usuario_id, email, papel")
          .eq("escritorio_id", id).order("email").returns<Membro[]>(),
        supabase.from("escritorio_convites").select("id, email")
          .eq("escritorio_id", id).order("email").returns<Convite[]>(),
      ]);
      if (membros.error || pendentes.error) throw new Error("Equipe indisponível");
      atual.membros = membros.data;
      atual.convitesEnviados = pendentes.data;
    }
    return atual;
  } catch {
    return null;
  }
}

export async function alterarEscritorio(
  acao: "criar" | "convidar" | "aceitar" | "salvar" | "remover" | "cancelar",
  id: string,
  alvo = "",
  numero = "",
  titulo = "",
  situacao = "",
): Promise<{ data?: string; error?: { code?: string } }> {
  if (![id, alvo, numero, titulo, situacao].every((valor) => typeof valor === "string")) {
    return { error: {} };
  }
  id = id.trim();
  alvo = alvo.trim();
  numero = numero.trim();
  titulo = titulo.trim();
  if (acao === "criar" ? !id || id.length > 120 : !uuid.test(id)) return { error: {} };
  if (acao === "convidar") {
    alvo = alvo.toLowerCase();
    if (alvo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alvo)) return { error: {} };
  }
  if ((acao === "remover" || acao === "cancelar") && !uuid.test(alvo)) return { error: {} };
  if (acao === "salvar" && ((alvo && !uuid.test(alvo)) || !numero || numero.length > 50 ||
      !titulo || titulo.length > 200 || (situacao !== "ativo" && situacao !== "encerrado"))) return { error: {} };

  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: {} };
    switch (acao) {
      case "criar":
      case "aceitar": {
        const { data, error } = acao === "criar"
          ? await supabase.rpc("criar_escritorio", { p_nome: id })
          : await supabase.rpc("aceitar_convite", { p_convite: id });
        return error ? { error: { code: error.code } } : { data };
      }
      case "convidar": {
        const { error } = await supabase.from("escritorio_convites").insert({ escritorio_id: id, email: alvo });
        return error ? { error: { code: error.code } } : {};
      }
      case "remover": {
        const { error } = await supabase.from("escritorio_membros").delete()
          .eq("escritorio_id", id).eq("usuario_id", alvo).select("usuario_id").single();
        return error ? { error: { code: error.code } } : {};
      }
      case "cancelar": {
        const { error } = await supabase.from("escritorio_convites").delete()
          .eq("escritorio_id", id).eq("id", alvo).select("id").single();
        return error ? { error: { code: error.code } } : {};
      }
      case "salvar": {
        const tabela = supabase.from("processos");
        const processo = { numero, titulo, situacao };
        const { error } = alvo
          ? await tabela.update(processo).eq("escritorio_id", id).eq("id", alvo).select("id").single()
          : await tabela.insert({ escritorio_id: id, ...processo });
        return error ? { error: { code: error.code } } : {};
      }
      default:
        return { error: {} };
    }
  } catch {
    return { error: {} };
  }
}

export async function contarProcessosAtivos(): Promise<number | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { count, error } = await supabase.from("processos")
      .select("id", { head: true, count: "exact" }).eq("situacao", "ativo");
    return error ? null : count;
  } catch {
    return null;
  }
}
