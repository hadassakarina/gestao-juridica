import type { Escritorio } from "@/lib/supabase/escritorios";

export type Cliente = { id: string; nome: string; email: string | null; telefone: string | null };
export type Processo = { id: string; numero: string; titulo: string; cliente_id: string | null };
export type Carteira = { escritorios: Escritorio[]; escritorioId: string; clientes: Cliente[]; processos: Processo[] };
