export type Opcao = { id: string };
export type Prazo = {
  id: string;
  titulo: string;
  vencimento: string;
  processo_id: string;
  responsavel_id: string | null;
  situacao: "pendente" | "concluido";
};

export type Agenda = {
  escritorios: (Opcao & { nome: string })[];
  escritorioId: string;
  processos: (Opcao & { numero: string; titulo: string })[];
  responsaveis: (Opcao & { email: string })[];
  prazos: Prazo[];
};

