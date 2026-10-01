export type TipoEscala = "AUTO" | "MANUAL";
export type TratamentoSobra = "descartar" | "distribuir" | "avisar";
export type CriterioId = "ancora" | "genero" | "diversidade" | "afinacao";
export type TipoDispositivo = "mobile" | "tablet" | "notebook" | "desktop";
export type SessaoEscala = "MUSICO" | "CANTOR";
export type PerfilIntegrante = "CANTOR" | "MUSICO" | "AMBOS";
export type PerfilUsuario = "ADMIN" | "MEMBRO";

export function ehPerfilUsuario(valor: unknown): valor is PerfilUsuario {
  return valor === "ADMIN" || valor === "MEMBRO";
}

export type Sessao = {
  id: string;
  integranteId: string;
  email: string;
  nome: string;
  perfil: PerfilUsuario;
};

export type RegraAncora = {
  leadVocal: string[];
  backingVocal: string[];
};

export type ConfigGeracao = {
  quantidadeEscalas: number;
  quantidadePorEscala: number;
  sobra: TratamentoSobra;
  criteriosAtivos: CriterioId[];
  prioridade: CriterioId[];
  ancora: RegraAncora;
};

export type IntegranteResumo = {
  id: string;
  nome: string;
  perfil: PerfilIntegrante;
  voz: string;
  afinacao: number;
  tipoVoz: string;
  leadVocal: string;
  backingVocal: string;
  nascimento: string;
  ativo: boolean;
  funcoes: { id: string; nome: string; grupo: string }[];
};

export type ArquivoMusicaResumo = {
  id: string;
  nome: string;
  path: string;
};

export type ArquivoEscalaResumo = {
  id: string;
  nome: string;
  path: string;
  musicaId: string | null;
};

export type MusicaResumo = {
  id: string;
  titulo: string;
  youtubeUrl: string;
  arquivoNome: string;
  arquivoPath: string;
  arquivos: ArquivoMusicaResumo[];
  ativo: boolean;
};

export type AlocacaoResumo = {
  id: string;
  ordem: number;
  sessao: SessaoEscala;
  integrante: IntegranteResumo;
  funcao: { id: string; nome: string; grupo: string } | null;
  musica: MusicaResumo | null;
};

export type BlocoResumo = {
  id: string;
  nome: string;
  direcao: string;
  ordem: number;
  temAncora: boolean;
  temHomem: boolean;
  somaAfinacao: number;
  mediaAfinacao: number;
  tiposVozDistintos: number;
  alocacoes: AlocacaoResumo[];
};

export type EscalaDetalhe = {
  id: string;
  titulo: string;
  data: string;
  tipo: TipoEscala;
  especial: boolean;
  quantidadeEscalas: number | null;
  quantidadePorEscala: number | null;
  sobra: string | null;
  criterios: ConfigGeracao | null;
  avisos: string[];
  createdAt: string;
  blocos: BlocoResumo[];
  arquivos: ArquivoEscalaResumo[];
};

export const CRITERIOS: { id: CriterioId; titulo: string; descricao: string }[] = [
  {
    id: "ancora",
    titulo: "Âncora obrigatória",
    descricao: "Toda escala tenta ter ao menos um integrante de nível mais alto.",
  },
  {
    id: "genero",
    titulo: "Distribuição de gênero",
    descricao: "Tenta garantir ao menos um homem por escala.",
  },
  {
    id: "diversidade",
    titulo: "Diversidade de tipos de voz",
    descricao: "Maximiza tipos de voz distintos em cada escala.",
  },
  {
    id: "afinacao",
    titulo: "Nivelamento de afinação",
    descricao: "Equilibra a soma de afinação entre as escalas.",
  },
];
