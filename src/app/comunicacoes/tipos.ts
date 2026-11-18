import type { Escritorio } from "@/lib/supabase/escritorios";

export const tipos = {
  publicacao: { plural: "Publicações", singular: "publicação" },
  intimacao: { plural: "Intimações", singular: "intimação" },
} as const;

export type Tipo = keyof typeof tipos;
export type Comunicacao = {
  id: string;
  processo_id: string;
  titulo: string;
  data_comunicacao: string;
  observacoes: string | null;
};
export type Registros = {
  escritorios: Escritorio[];
  escritorioId: string;
  processos: { id: string; numero: string; titulo: string }[];
  comunicacoes: Comunicacao[];
};
