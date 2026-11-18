export type Escritorio = { id: string; nome: string };
export type Vinculo = { escritorio: Escritorio | null; papel: "admin" | "membro" };
export type Convite = { id: string; email: string };
export type ConviteRecebido = { id: string; escritorio: Escritorio | null };
export type Membro = { usuario_id: string; email: string; papel: Vinculo["papel"] };
export type Situacao = "ativo" | "encerrado";
export type Processo = { id: string; numero: string; titulo: string; situacao: Situacao };
export type Dados = {
  vinculos: Vinculo[];
  convites: ConviteRecebido[];
  processos: Processo[];
  membros: Membro[];
  convitesEnviados: Convite[];
};
