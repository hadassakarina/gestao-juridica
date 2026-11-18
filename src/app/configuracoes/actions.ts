"use server";

import { clienteAutenticado, listarEscritorios, uuid } from "@/lib/supabase/escritorios";

export async function carregarConfiguracoes(selecao: string) {
  if (typeof selecao !== "string" || (selecao && !uuid.test(selecao))) return null;
  try {
    const { supabase, user } = await clienteAutenticado();
    const escritorios = await listarEscritorios(supabase, user.id);
    const ativo = selecao ? escritorios.find(({ id }) => id === selecao) : escritorios[0];
    if (!ativo) return selecao ? null : { escritorios, ativo: null, administrador: false };
    const { data, error } = await supabase.from("escritorio_membros").select("papel")
      .eq("escritorio_id", ativo.id).eq("usuario_id", user.id).single();
    return error ? null : { escritorios, ativo, administrador: data.papel === "admin" };
  } catch {
    return null;
  }
}

export async function renomearEscritorio(id: string, nome: string) {
  if (typeof id !== "string" || !uuid.test(id) || typeof nome !== "string" ||
      !nome.trim() || nome.trim().length > 120) return "Informe um nome válido para o escritório.";
  try {
    const { supabase } = await clienteAutenticado();
    const { error } = await supabase.from("escritorios").update({ nome: nome.trim() })
      .eq("id", id).select("id").single();
    return error ? "Não foi possível renomear o escritório. Confira suas permissões." : null;
  } catch {
    return "Não foi possível renomear o escritório.";
  }
}
