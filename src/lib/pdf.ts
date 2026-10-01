import { jsPDF } from "jspdf";
import type { AlocacaoResumo, EscalaDetalhe } from "./types";
import {
  alocacoesPorSessao,
  cabecalhoEscala,
  formatarDataCurta,
  papelAlocacao,
  rotuloSessao,
} from "./escala";

function escreverLinhas(
  doc: jsPDF,
  alocacoes: AlocacaoResumo[],
  margem: number,
  largura: number,
  y: number,
) {
  let atual = y;
  alocacoes.forEach((alocacao) => {
    if (atual > 280) {
      doc.addPage();
      atual = 22;
    }
    doc.setDrawColor(220, 214, 200);
    doc.line(margem, atual + 3, margem + largura, atual + 3);
    doc.setTextColor(90, 96, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(papelAlocacao(alocacao), margem, atual);
    doc.setTextColor(20, 24, 22);
    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.text(alocacao.integrante.nome.toUpperCase(), margem + 48, atual);
    atual += 6;
    if (alocacao.musica) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(70, 76, 70);
      doc.text(alocacao.musica.titulo, margem + 48, atual);
      atual += 4;
      if (alocacao.musica.youtubeUrl) {
        const link = doc.splitTextToSize(alocacao.musica.youtubeUrl, largura - 48);
        doc.setFont("helvetica", "normal");
        doc.text(link, margem + 48, atual);
        atual += link.length * 4;
      }
    }
    atual += 5;
  });
  return atual;
}

export function gerarPdfEscala(escala: EscalaDetalhe) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margem = 18;
  const largura = 210 - margem * 2;
  let y = 22;

  doc.setFillColor(243, 239, 228);
  doc.rect(0, 0, 210, 32, "F");
  doc.setFillColor(201, 162, 39);
  doc.rect(0, 30, 210, 2, "F");
  doc.setTextColor(26, 36, 32);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(cabecalhoEscala(escala.titulo, escala.data), margem, 18);

  y = 44;
  doc.setTextColor(30, 36, 33);

  escala.blocos
    .slice()
    .sort((a, b) => a.ordem - b.ordem)
    .forEach((bloco) => {
      if (y > 260) {
        doc.addPage();
        y = 22;
      }

      doc.setFillColor(232, 196, 92);
      doc.rect(margem, y - 6, 3, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(bloco.nome.toUpperCase(), margem + 8, y);
      y += 10;
      if (bloco.direcao.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(90, 96, 90);
        doc.text("Direção", margem, y);
        doc.setFont("courier", "bold");
        doc.setFontSize(12);
        doc.setTextColor(20, 24, 22);
        doc.text(bloco.direcao.trim().toUpperCase(), margem + 48, y);
        y += 10;
      }

      const { musicos, cantores } = alocacoesPorSessao(bloco.alocacoes);

      if (musicos.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(90, 96, 90);
        doc.text(rotuloSessao("MUSICO"), margem, y);
        y += 7;
        y = escreverLinhas(doc, musicos, margem, largura, y);
        y += 4;
      }

      if (cantores.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(90, 96, 90);
        doc.text(rotuloSessao("CANTOR"), margem, y);
        y += 7;
        y = escreverLinhas(doc, cantores, margem, largura, y);
      }

      if (escala.tipo === "AUTO") {
        doc.setFontSize(8);
        doc.setTextColor(110, 116, 110);
        doc.text(
          `Afinação média ${bloco.mediaAfinacao}  ·  ${bloco.tiposVozDistintos} tipos de voz  ·  ${bloco.temAncora ? "com âncora" : "sem âncora"}  ·  ${bloco.temHomem ? "com homem" : "sem homem"}`,
          margem,
          y + 1,
        );
        y += 8;
      }

      y += 10;
    });

  if (escala.avisos.length) {
    if (y > 250) {
      doc.addPage();
      y = 22;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(150, 80, 40);
    doc.text("Avisos da geração", margem, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    escala.avisos.forEach((aviso) => {
      const linhas = doc.splitTextToSize(aviso, largura);
      doc.text(linhas, margem, y);
      y += linhas.length * 4 + 2;
    });
  }

  const nome = `escala-${formatarDataCurta(escala.data).replace("/", "-")}.pdf`;
  doc.save(nome);
}
