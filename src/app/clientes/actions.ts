"use server";

import { clienteAutenticado, listarEscritorios, uuid } from "@/lib/supabase/escritorios";
import type { Carteira } from "./tipos";

export async function carregarClientes(selecao: string): Promise<Carteira | null> {
  if (typeof selecao !== "string" || (selecao && !uuid.test(selecao))) return null;
  try {
    const { supabase, user } = await clienteAutenticado();
    const escritorios = await listarEscritorios(supabase, user.id);
    const escritorioId = selecao || escritorios[0]?.id || "";
    if (!escritorioId) return { escritorios, escritorioId, clientes: [], processos: [] };
    if (!escritorios.some(({ id }) => id === escritorioId)) return null;
    const [clientes, processos] = await Promise.all([
      supabase.from("clientes").select("id, nome, email, telefone").eq("escritorio_id", escritorioId)
        .order("nome").order("id").returns<Carteira["clientes"]>(),
      supabase.from("processos").select("id, numero, titulo, cliente_id").eq("escritorio_id", escritorioId)
        .order("numero").returns<Carteira["processos"]>(),
    ]);
    if (clientes.error || processos.error) return null;
    return { escritorios, escritorioId, clientes: clientes.data, processos: processos.data };
  } catch {
    return null;
  }
}

export async function salvarCliente(escritorioId: string, clienteId: string, form: FormData) {
  if (typeof escritorioId !== "string" || !uuid.test(escritorioId) ||
      typeof clienteId !== "string" || (clienteId && !uuid.test(clienteId)) || !(form instanceof FormData)) {
    return { erro: "Dados do cliente inválidos." };
  }
  const nome = form.get("nome");
  const email = form.get("email");
  const telefone = form.get("telefone");
  if (typeof nome !== "string" || !nome.trim() || nome.trim().length > 160 ||
      typeof email !== "string" || (email.trim() && (email.trim().length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) ||
      typeof telefone !== "string" || telefone.trim().length > 40) {
    return { erro: "Confira o nome, o e-mail e o telefone." };
  }
  try {
    const { supabase } = await clienteAutenticado();
    const dados = { nome: nome.trim(), email: email.trim() || null, telefone: telefone.trim() || null };
    const tabela = supabase.from("clientes");
    const { data, error } = await (clienteId
      ? tabela.update(dados).eq("escritorio_id", escritorioId).eq("id", clienteId)
      : tabela.insert({ escritorio_id: escritorioId, ...dados })).select("id").single();
    return error ? { erro: "Não foi possível salvar o cliente." } : { id: String(data.id) };
  } catch {
    return { erro: "Não foi possível salvar o cliente." };
  }
}

export async function alterarVinculoCliente(escritorioId: string, clienteId: string, processoId: string, vincular: boolean) {
  if (![escritorioId, clienteId, processoId].every((id) => typeof id === "string" && uuid.test(id)) ||
      typeof vincular !== "boolean") return "Dados do vínculo inválidos.";
  try {
    const { supabase } = await clienteAutenticado();
    const alteracao = supabase.from("processos").update({ cliente_id: vincular ? clienteId : null })
      .eq("escritorio_id", escritorioId).eq("id", processoId);
    const { error } = await (vincular ? alteracao.is("cliente_id", null) : alteracao.eq("cliente_id", clienteId))
      .select("id").single();
    return error ? "O vínculo não pôde ser alterado. Atualize a lista e confira o processo." : null;
  } catch {
    return "Não foi possível alterar o vínculo.";
  }
}
