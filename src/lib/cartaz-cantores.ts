import { jsPDF } from "jspdf";
import type { EscalaDetalhe } from "./types";
import {
  alocacoesPorSessao,
  formatarDataCurta,
  papelAlocacao,
} from "./escala";

export type CantorQuadro = {
  papel: string;
  nome: string;
};

export type CultoQuadro = {
  nome: string;
  cantores: CantorQuadro[];
};

export type QuadroSemana = {
  id: string;
  dataIso: string;
  rotulo: string;
  cultos: CultoQuadro[];
};

function capitalizar(texto: string) {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloDomingo(iso: string) {
  const diaSemana = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
  return `${capitalizar(diaSemana)} ${formatarDataCurta(iso)}`;
}

function rotuloCulto(nome: string, indice: number, total: number) {
  const limpo = nome.trim();
  if (/^ESCALA(\s+\d+)?$/i.test(limpo)) {
    return total > 1 ? `${indice + 1}º culto` : "Culto";
  }
  if (/^CULTO(\s+\d+)?$/i.test(limpo) && total > 1) {
    return `${indice + 1}º culto`;
  }
  return limpo || `${indice + 1}º culto`;
}

export function montarQuadrosCantores(escalas: EscalaDetalhe[]): QuadroSemana[] {
  return escalas
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((escala) => ({
      id: escala.id,
      dataIso: escala.data,
      rotulo: rotuloDomingo(escala.data),
      cultos: escala.blocos
        .slice()
        .sort((a, b) => a.ordem - b.ordem)
        .map((bloco, indice, lista) => {
          const { cantores } = alocacoesPorSessao(bloco.alocacoes);
          return {
            nome: rotuloCulto(bloco.nome, indice, lista.length),
            cantores: cantores.map((item) => ({
              papel: papelAlocacao(item),
              nome: item.integrante.nome,
            })),
          };
        }),
    }));
}

export function tituloCartaz(quadros: QuadroSemana[]) {
  if (!quadros.length) return "Cantores";
  const primeiro = new Date(quadros[0].dataIso);
  const ultimo = new Date(quadros[quadros.length - 1].dataIso);
  const mesPrimeiro = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(primeiro);
  const mesUltimo = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(ultimo);
  if (mesPrimeiro === mesUltimo) {
    return `Cantores · ${capitalizar(mesPrimeiro)}`;
  }
  return `Cantores · ${formatarDataCurta(quadros[0].dataIso)} a ${formatarDataCurta(quadros[quadros.length - 1].dataIso)}`;
}

function nomeArquivoCartaz(quadros: QuadroSemana[], extensao: "pdf" | "png") {
  const base = quadros[0]
    ? `cantores-${formatarDataCurta(quadros[0].dataIso).replace("/", "-")}`
    : "cantores";
  return `${base}.${extensao}`;
}

const COR = {
  fundo: [243, 239, 228] as const,
  quadro: [255, 253, 248] as const,
  linha: [210, 203, 184] as const,
  ouro: [201, 162, 39] as const,
  texto: [26, 36, 32] as const,
  muted: [93, 107, 100] as const,
};

function fatiar<T>(lista: T[], tamanho: number) {
  const paginas: T[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) {
    paginas.push(lista.slice(i, i + tamanho));
  }
  return paginas.length ? paginas : [[]];
}

export function gerarPdfCartazCantores(quadros: QuadroSemana[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const paginas = fatiar(quadros, 4);
  const titulo = tituloCartaz(quadros);

  paginas.forEach((pagina, indicePagina) => {
    if (indicePagina > 0) doc.addPage();
    doc.setFillColor(...COR.fundo);
    doc.rect(0, 0, 297, 210, "F");
    doc.setFillColor(...COR.ouro);
    doc.rect(0, 0, 297, 3, "F");
    doc.setTextColor(...COR.texto);
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(titulo, 148.5, 16, { align: "center" });

    const colunas = pagina.length <= 1 ? 1 : 2;
    const linhas = pagina.length <= 2 ? 1 : 2;
    const margemX = 10;
    const margemY = 22;
    const gap = 6;
    const largura = (297 - margemX * 2 - gap * (colunas - 1)) / colunas;
    const altura = (210 - margemY - 10 - gap * (linhas - 1)) / linhas;

    pagina.forEach((quadro, indice) => {
      const coluna = indice % colunas;
      const linha = Math.floor(indice / colunas);
      const x = margemX + coluna * (largura + gap);
      const y = margemY + linha * (altura + gap);
      desenharQuadroPdf(doc, quadro, x, y, largura, altura);
    });
  });

  doc.save(nomeArquivoCartaz(quadros, "pdf"));
}

function desenharQuadroPdf(
  doc: jsPDF,
  quadro: QuadroSemana,
  x: number,
  y: number,
  largura: number,
  altura: number,
) {
  doc.setFillColor(...COR.quadro);
  doc.setDrawColor(...COR.linha);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, largura, altura, 3, 3, "FD");
  doc.setFillColor(...COR.ouro);
  doc.rect(x, y, 3, altura, "F");

  doc.setTextColor(...COR.texto);
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text(quadro.rotulo, x + 8, y + 10);

  let atual = y + 16;
  const limite = y + altura - 5;
  const colunaTexto = largura - 14;

  quadro.cultos.forEach((culto) => {
    if (atual > limite) return;
    doc.setFillColor(232, 226, 210);
    doc.roundedRect(x + 6, atual - 4, largura - 12, 7, 1.2, 1.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COR.ouro);
    doc.text(culto.nome.toUpperCase(), x + 9, atual + 1);
    atual += 8;

    if (!culto.cantores.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...COR.muted);
      doc.text("Sem cantores neste culto.", x + 9, atual);
      atual += 6;
      return;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let colunaPapel = 28;
    culto.cantores.forEach((cantor) => {
      colunaPapel = Math.max(colunaPapel, doc.getTextWidth(cantor.papel) + 3);
    });
    colunaPapel = Math.min(colunaPapel, largura * 0.42);

    culto.cantores.forEach((cantor) => {
      if (atual > limite) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COR.muted);
      doc.text(cantor.papel, x + 9, atual);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...COR.texto);
      const nome = doc.splitTextToSize(cantor.nome, colunaTexto - colunaPapel);
      doc.text(nome[0], x + 9 + colunaPapel, atual);
      atual += 7;
    });
    atual += 3;
  });
}

export function gerarPngCartazCantores(quadros: QuadroSemana[]) {
  const paginas = fatiar(quadros, 4);
  const titulo = tituloCartaz(quadros);
  const largura = 2000;
  const altura = 1414;

  paginas.forEach((pagina, indice) => {
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    desenharCartazCanvas(ctx, pagina, titulo, largura, altura);
    const ancora = document.createElement("a");
    ancora.href = canvas.toDataURL("image/png");
    ancora.download =
      paginas.length > 1
        ? nomeArquivoCartaz(quadros, "png").replace(".png", `-${indice + 1}.png`)
        : nomeArquivoCartaz(quadros, "png");
    ancora.click();
  });
}

function desenharCartazCanvas(
  ctx: CanvasRenderingContext2D,
  pagina: QuadroSemana[],
  titulo: string,
  largura: number,
  altura: number,
) {
  const escala = largura / 297;
  ctx.fillStyle = rgb(COR.fundo);
  ctx.fillRect(0, 0, largura, altura);
  ctx.fillStyle = rgb(COR.ouro);
  ctx.fillRect(0, 0, largura, 3 * escala);

  ctx.fillStyle = rgb(COR.texto);
  ctx.font = `bold ${18 * escala}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText(titulo, largura / 2, 16 * escala);
  ctx.textAlign = "left";

  const colunas = pagina.length <= 1 ? 1 : 2;
  const linhas = pagina.length <= 2 ? 1 : 2;
  const margemX = 10 * escala;
  const margemY = 22 * escala;
  const gap = 6 * escala;
  const quadroL = (largura - margemX * 2 - gap * (colunas - 1)) / colunas;
  const quadroA = (altura - margemY - 10 * escala - gap * (linhas - 1)) / linhas;

  pagina.forEach((quadro, indice) => {
    const coluna = indice % colunas;
    const linha = Math.floor(indice / colunas);
    const x = margemX + coluna * (quadroL + gap);
    const y = margemY + linha * (quadroA + gap);
    desenharQuadroCanvas(ctx, quadro, x, y, quadroL, quadroA, escala);
  });
}

function caberTexto(ctx: CanvasRenderingContext2D, texto: string, max: number) {
  if (max <= 0 || ctx.measureText(texto).width <= max) return texto;
  let atual = texto;
  while (atual.length > 1 && ctx.measureText(`${atual}…`).width > max) {
    atual = atual.slice(0, -1);
  }
  return `${atual}…`;
}

function desenharQuadroCanvas(
  ctx: CanvasRenderingContext2D,
  quadro: QuadroSemana,
  x: number,
  y: number,
  largura: number,
  altura: number,
  escala: number,
) {
  ctx.save();
  arredondar(ctx, x, y, largura, altura, 3 * escala);
  ctx.fillStyle = rgb(COR.quadro);
  ctx.fill();
  ctx.strokeStyle = rgb(COR.linha);
  ctx.lineWidth = 0.4 * escala;
  ctx.stroke();
  ctx.clip();

  ctx.fillStyle = rgb(COR.ouro);
  ctx.fillRect(x, y, 3 * escala, altura);

  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const padX = 12 * escala;
  const fonteTitulo = Math.max(28, Math.min(44, largura * 0.045));
  const fonteCulto = Math.max(16, Math.min(22, largura * 0.024));
  const fontePapel = Math.max(16, Math.min(22, largura * 0.022));
  const fonteNome = Math.max(20, Math.min(28, largura * 0.028));
  const linha = fonteNome * 1.55;
  const faixa = fonteCulto + 14;

  ctx.fillStyle = rgb(COR.texto);
  ctx.font = `bold ${fonteTitulo}px Georgia, "Times New Roman", serif`;
  ctx.fillText(
    caberTexto(ctx, quadro.rotulo, largura - padX * 2),
    x + padX,
    y + 12 * escala,
  );

  let atual = y + 12 * escala + fonteTitulo + 14;
  const limite = y + altura - 12 * escala;
  const inner = largura - padX * 2;

  quadro.cultos.forEach((culto) => {
    if (atual + faixa > limite) return;
    arredondar(ctx, x + padX - 4, atual, inner + 8, faixa, 6);
    ctx.fillStyle = "rgb(232, 226, 210)";
    ctx.fill();
    ctx.fillStyle = rgb(COR.ouro);
    ctx.font = `bold ${fonteCulto}px system-ui, sans-serif`;
    ctx.fillText(
      caberTexto(ctx, culto.nome.toUpperCase(), inner - 12),
      x + padX + 6,
      atual + (faixa - fonteCulto) / 2,
    );
    atual += faixa + 10;

    if (!culto.cantores.length) {
      ctx.fillStyle = rgb(COR.muted);
      ctx.font = `italic ${fontePapel}px system-ui, sans-serif`;
      ctx.fillText("Sem cantores neste culto.", x + padX, atual);
      atual += linha + 8;
      return;
    }

    ctx.font = `${fontePapel}px system-ui, sans-serif`;
    let colunaPapel = 0;
    culto.cantores.forEach((cantor) => {
      colunaPapel = Math.max(colunaPapel, ctx.measureText(cantor.papel).width);
    });
    colunaPapel = Math.min(colunaPapel, inner * 0.45);
    const nomeX = x + padX + colunaPapel + 16;
    const nomeMax = x + largura - padX - nomeX;

    culto.cantores.forEach((cantor) => {
      if (atual + linha > limite) return;
      ctx.fillStyle = rgb(COR.muted);
      ctx.font = `${fontePapel}px system-ui, sans-serif`;
      ctx.fillText(
        caberTexto(ctx, cantor.papel, colunaPapel),
        x + padX,
        atual,
      );
      ctx.fillStyle = rgb(COR.texto);
      ctx.font = `bold ${fonteNome}px system-ui, sans-serif`;
      ctx.fillText(caberTexto(ctx, cantor.nome, nomeMax), nomeX, atual);
      atual += linha;
    });
    atual += 12;
  });
  ctx.restore();
}

function rgb(cor: readonly [number, number, number]) {
  return `rgb(${cor[0]}, ${cor[1]}, ${cor[2]})`;
}

function arredondar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const raio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.arcTo(x + w, y, x + w, y + h, raio);
  ctx.arcTo(x + w, y + h, x, y + h, raio);
  ctx.arcTo(x, y + h, x, y, raio);
  ctx.arcTo(x, y, x + w, y, raio);
  ctx.closePath();
}
