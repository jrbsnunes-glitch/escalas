import { TAMANHO_MAX_ARQUIVO, TAMANHO_MAX_ARQUIVO_MB } from "./musica";

const PEDACOS_TENTATIVA = [256 * 1024, 64 * 1024];
const TENTATIVAS_PEDACO = 3;
const TIMEOUT_PEDACO_MS = 60_000;

export type EnvioArquivoCliente = {
  file: File;
  musicaId: string;
};

export type ProgressoEnvio = {
  arquivo: string;
  atual: number;
  total: number;
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

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const abortar = new AbortController();
  const timer = setTimeout(() => abortar.abort(), TIMEOUT_PEDACO_MS);
  try {
    const resposta = await fetch(`/api/escalas/${escalaId}/arquivo?${params}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/octet-stream" },
      body: pedaco,
      signal: abortar.signal,
    });
    if (!resposta.ok) {
      return {
        ok: false as const,
        erro: await mensagemErro(resposta),
        status: resposta.status,
      };
    }
    return { ok: true as const };
  } catch (falha) {
    const abortado =
      falha instanceof DOMException && falha.name === "AbortError";
    return {
      ok: false as const,
      erro: abortado
        ? "O envio deste pedaço demorou demais. Tente de novo."
        : "Falha de rede ao enviar o arquivo.",
      status: 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

function naoDeveRepetir(status: number) {
  return status === 401 || status === 403 || status === 404;
}

async function postPedacoComRetry(
  escalaId: string,
  envio: EnvioArquivoCliente,
  uploadId: string,
  indice: number,
  total: number,
  pedaco: Blob,
) {
  let ultimo: { ok: false; erro: string; status: number } | null = null;
  for (let tentativa = 1; tentativa <= TENTATIVAS_PEDACO; tentativa++) {
    const resultado = await postPedaco(
      escalaId,
      envio,
      uploadId,
      indice,
      total,
      pedaco,
    );
    if (resultado.ok) return resultado;
    ultimo = resultado;
    if (naoDeveRepetir(resultado.status)) return resultado;
    if (tentativa < TENTATIVAS_PEDACO) {
      await esperar(400 * tentativa);
    }
  }
  return ultimo ?? {
    ok: false as const,
    erro: "Não foi possível enviar o arquivo.",
    status: 0,
  };
}

function deveTentarMenor(resultado: { status?: number; erro: string }) {
  if (resultado.status === 413 || resultado.status === 0) return true;
  const texto = resultado.erro.toLowerCase();
  return (
    texto.includes("incompleto") ||
    texto.includes("vazio") ||
    texto.includes("tamanho") ||
    texto.includes("demorou")
  );
}

async function enviarEmPartes(
  escalaId: string,
  envio: EnvioArquivoCliente,
  tamanhoPedaco: number,
  onProgresso?: (progresso: ProgressoEnvio) => void,
) {
  const total = Math.max(1, Math.ceil(envio.file.size / tamanhoPedaco));
  const uploadId = idEnvio();
  for (let indice = 0; indice < total; indice++) {
    onProgresso?.({
      arquivo: envio.file.name,
      atual: indice + 1,
      total,
    });
    const inicio = indice * tamanhoPedaco;
    const pedaco = envio.file.slice(inicio, inicio + tamanhoPedaco);
    const resultado = await postPedacoComRetry(
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
  onProgresso?: (progresso: ProgressoEnvio) => void,
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
      const resultado = await enviarEmPartes(
        escalaId,
        envio,
        tamanho,
        onProgresso,
      );
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
