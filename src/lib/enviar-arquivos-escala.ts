import { TAMANHO_MAX_ARQUIVO, TAMANHO_MAX_ARQUIVO_MB } from "./musica";

const PEDACOS_TENTATIVA = [256 * 1024, 64 * 1024];

export type EnvioArquivoCliente = {
  file: File;
  musicaId: string;
};

async function mensagemErro(resposta: Response) {
  const tipo = resposta.headers.get("content-type") ?? "";
  if (tipo.includes("application/json")) {
    const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
    if (corpo?.erro) return corpo.erro;
  }
  if (resposta.status === 413) {
    return "O servidor recusou o tamanho deste envio.";
  }
  if (resposta.status === 401 || resposta.status === 403) {
    return "Sessão expirada. Entre de novo e envie o arquivo.";
  }
  return `A escala foi salva, mas os arquivos não (HTTP ${resposta.status}).`;
}

function idEnvio() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

async function postPedaco(
  escalaId: string,
  envio: EnvioArquivoCliente,
  uploadId: string,
  indice: number,
  total: number,
  pedaco: Blob,
) {
  const params = new URLSearchParams({
    uploadId,
    chunkIndex: String(indice),
    totalChunks: String(total),
    nome: envio.file.name,
    musicaId: envio.musicaId,
  });
  const resposta = await fetch(`/api/escalas/${escalaId}/arquivo?${params}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/octet-stream" },
    body: pedaco,
  });
  if (!resposta.ok) {
    return {
      ok: false as const,
      erro: await mensagemErro(resposta),
      status: resposta.status,
    };
  }
  return { ok: true as const };
}

function deveTentarMenor(resultado: { status?: number; erro: string }) {
  if (resultado.status === 413) return true;
  const texto = resultado.erro.toLowerCase();
  return (
    texto.includes("incompleto") ||
    texto.includes("vazio") ||
    texto.includes("tamanho")
  );
}

async function enviarEmPartes(
  escalaId: string,
  envio: EnvioArquivoCliente,
  tamanhoPedaco: number,
) {
  const total = Math.max(1, Math.ceil(envio.file.size / tamanhoPedaco));
  const uploadId = idEnvio();
  for (let indice = 0; indice < total; indice++) {
    const inicio = indice * tamanhoPedaco;
    const pedaco = envio.file.slice(inicio, inicio + tamanhoPedaco);
    const resultado = await postPedaco(
      escalaId,
      envio,
      uploadId,
      indice,
      total,
      pedaco,
    );
    if (!resultado.ok) return resultado;
  }
  return { ok: true as const };
}

export async function enviarArquivosEscala(
  escalaId: string,
  envios: EnvioArquivoCliente[],
) {
  for (const envio of envios) {
    if (envio.file.size > TAMANHO_MAX_ARQUIVO) {
      return {
        ok: false as const,
        erro: `O arquivo ${envio.file.name} deve ter no máximo ${TAMANHO_MAX_ARQUIVO_MB} MB.`,
      };
    }
    let ultimo: { ok: false; erro: string; status?: number } | null = null;
    for (const tamanho of PEDACOS_TENTATIVA) {
      const resultado = await enviarEmPartes(escalaId, envio, tamanho);
      if (resultado.ok) {
        ultimo = null;
        break;
      }
      ultimo = resultado;
      if (!deveTentarMenor(resultado)) return resultado;
    }
    if (ultimo) return ultimo;
  }
  return { ok: true as const };
}
