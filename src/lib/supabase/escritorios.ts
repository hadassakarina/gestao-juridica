import { createServerSupabase } from "./server";

export type Escritorio = { id: string; nome: string };
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function clienteAutenticado() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sessão indisponível");
  return { supabase, user };
}

export async function listarEscritorios(supabase: Awaited<ReturnType<typeof createServerSupabase>>, usuarioId: string) {
  const { data, error } = await supabase.from("escritorio_membros")
    .select("escritorio:escritorios!inner(id, nome)").eq("usuario_id", usuarioId)
    .order("escritorio_id").returns<{ escritorio: Escritorio }[]>();
  if (error) throw error;
  return data.map(({ escritorio }) => escritorio);
}

export async function listarResponsaveis(supabase: Awaited<ReturnType<typeof createServerSupabase>>, escritorioId: string) {
  const { data, error } = await supabase.rpc("responsaveis_do_escritorio", { p_escritorio: escritorioId });
  if (error || !Array.isArray(data)) throw new Error("Equipe indisponível");
  return data as { id: string; email: string }[];
}
