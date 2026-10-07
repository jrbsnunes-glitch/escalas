import { TAMANHO_MAX_ARQUIVO, TAMANHO_MAX_ARQUIVO_MB } from "./musica";

const TAMANHO_PEDACO = 3 * 1024 * 1024;

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
  return `A escala foi salva, mas os arquivos não (HTTP ${resposta.status}).`;
}

async function postFormulario(escalaId: string, form: FormData) {
  const resposta = await fetch(`/api/escalas/${escalaId}/arquivo`, {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!resposta.ok) {
    return { ok: false as const, erro: await mensagemErro(resposta), status: resposta.status };
  }
  return { ok: true as const };
}

async function enviarInteiro(escalaId: string, envio: EnvioArquivoCliente) {
  const form = new FormData();
  form.append("arquivo", envio.file);
  form.append("musicaId", envio.musicaId);
  return postFormulario(escalaId, form);
}

async function enviarEmPartes(escalaId: string, envio: EnvioArquivoCliente) {
  const total = Math.ceil(envio.file.size / TAMANHO_PEDACO);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  for (let indice = 0; indice < total; indice++) {
    const inicio = indice * TAMANHO_PEDACO;
    const pedaco = envio.file.slice(inicio, inicio + TAMANHO_PEDACO);
    const form = new FormData();
    form.append("arquivo", pedaco, envio.file.name);
    form.append("musicaId", envio.musicaId);
    form.append("uploadId", uploadId);
    form.append("chunkIndex", String(indice));
    form.append("totalChunks", String(total));
    form.append("nomeOriginal", envio.file.name);
    const resultado = await postFormulario(escalaId, form);
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
    let resultado =
      envio.file.size > TAMANHO_PEDACO
        ? await enviarEmPartes(escalaId, envio)
        : await enviarInteiro(escalaId, envio);
    if (!resultado.ok && resultado.status === 413 && envio.file.size <= TAMANHO_PEDACO) {
      resultado = await enviarEmPartes(escalaId, envio);
    }
    if (!resultado.ok) return resultado;
  }
  return { ok: true as const };
}
