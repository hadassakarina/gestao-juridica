"use server";

import { clienteAutenticado, listarEscritorios, uuid } from "@/lib/supabase/escritorios";
import { bucketDocumentos, nomeObjeto } from "./arquivo/config";

export async function carregarDocumentos(selecao: string, processo: string) {
  if (typeof selecao !== "string" || (selecao && !uuid.test(selecao)) ||
      typeof processo !== "string" || (processo && !uuid.test(processo))) return null;
  try {
    const { supabase, user } = await clienteAutenticado();
    const escritorios = await listarEscritorios(supabase, user.id);
    const escritorioId = selecao || escritorios[0]?.id || "";
    if (!escritorioId) return { escritorios, escritorioId, processos: [], processoId: "", arquivos: [] };
    if (!escritorios.some(({ id }) => id === escritorioId)) return null;
    const { data: processos, error } = await supabase.from("processos").select("id,numero,titulo")
      .eq("escritorio_id", escritorioId).order("numero").returns<{ id: string; numero: string; titulo: string }[]>();
    if (error) return null;
    const processoId = processo || processos[0]?.id || "";
    if (!processoId) return { escritorios, escritorioId, processos, processoId, arquivos: [] };
    if (!processos.some(({ id }) => id === processoId)) return null;

    const arquivos: { nome: string; objeto: string }[] = [];
    const bucket = supabase.storage.from(bucketDocumentos);
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await bucket.list(`${escritorioId}/${processoId}`, {
        limit: 100, offset, sortBy: { column: "name", order: "asc" },
      });
      if (error) return null;
      for (const { name, id } of data) {
        if (id && nomeObjeto.test(name)) arquivos.push({ objeto: name, nome: name.slice(38) });
      }
      if (data.length < 100) break;
    }
    arquivos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return { escritorios, escritorioId, processos, processoId, arquivos };
  } catch {
    return null;
  }
}
