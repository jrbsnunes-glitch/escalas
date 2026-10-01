import { jsPDF } from "jspdf";
import { rotuloSessao } from "./escala";

export type ComponenteImpressao = {
  nome: string;
  funcoes: string[];
  nascimento: string | null;
  perfil: string;
  ativo: boolean;
};

function formatarNascimento(nascimento: string | null) {
  if (!nascimento) return "—";
  const [ano, mes, dia] = nascimento.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

function nomeComStatus(item: ComponenteImpressao) {
  if (item.ativo) return item.nome;
  return `${item.nome} (inativo)`;
}

function ordenarPorNome(a: ComponenteImpressao, b: ComponenteImpressao) {
  return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
}

function filtrarSecao(
  lista: ComponenteImpressao[],
  secao: "CANTOR" | "MUSICO",
) {
  return lista
    .filter((item) => {
      if (item.perfil === "AMBOS") return true;
      if (secao === "CANTOR") return item.perfil === "CANTOR";
      return item.perfil === "MUSICO";
    })
    .slice()
    .sort(ordenarPorNome);
}

function cabecalhoDocumento(doc: jsPDF, margem: number) {
  doc.setFillColor(243, 239, 228);
  doc.rect(0, 0, 210, 32, "F");
  doc.setFillColor(201, 162, 39);
  doc.rect(0, 30, 210, 2, "F");
  doc.setTextColor(26, 36, 32);
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Listagem de componentes", margem, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 96, 90);
  const emitido = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  doc.text(`Emitido em ${emitido}`, margem, 26);
}

function escreverSecao(
  doc: jsPDF,
  titulo: string,
  linhas: ComponenteImpressao[],
  yInicial: number,
  margem: number,
  largura: number,
) {
  let y = yInicial;
  const colNum = margem;
  const colNome = margem + 12;
  const colFuncao = margem + 64;
  const colNasc = margem + 148;
  const larguraFuncao = colNasc - colFuncao - 4;

  if (y > 250) {
    doc.addPage();
    y = 22;
  }

  doc.setFillColor(232, 196, 92);
  doc.rect(margem, y - 6, 3, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 24, 22);
  doc.text(titulo, margem + 8, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 96, 90);
  doc.text("Nº", colNum, y);
  doc.text("Nome", colNome, y);
  doc.text("Função", colFuncao, y);
  doc.text("Nascimento", colNasc, y);
  y += 3;
  doc.setDrawColor(200, 194, 180);
  doc.line(margem, y, margem + largura, y);
  y += 6;

  if (linhas.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(110, 116, 110);
    doc.text("Nenhum componente nesta seção.", margem, y);
    return y + 12;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  linhas.forEach((item, indice) => {
    const funcaoTexto =
      item.funcoes.length > 0 ? item.funcoes.join(", ") : "—";
    const funcaoLinhas = doc.splitTextToSize(funcaoTexto, larguraFuncao);
    const altura = Math.max(7, funcaoLinhas.length * 5 + 2);

    if (y + altura > 285) {
      doc.addPage();
      y = 22;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 96, 90);
    doc.text(String(indice + 1), colNome - 2, y, { align: "right" });

    doc.setTextColor(20, 24, 22);
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text(nomeComStatus(item), colNome, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 56, 52);
    doc.text(funcaoLinhas, colFuncao, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(formatarNascimento(item.nascimento), colNasc, y);

    y += altura;
  });

  return y + 8;
}

export function gerarPdfComponentes(
  componentes: ComponenteImpressao[],
  opcoes?: { abrirImpressao?: boolean },
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margem = 18;
  const largura = 210 - margem * 2;

  cabecalhoDocumento(doc, margem);

  let y = 44;
  y = escreverSecao(
    doc,
    rotuloSessao("CANTOR"),
    filtrarSecao(componentes, "CANTOR"),
    y,
    margem,
    largura,
  );
  escreverSecao(
    doc,
    rotuloSessao("MUSICO"),
    filtrarSecao(componentes, "MUSICO"),
    y,
    margem,
    largura,
  );

  const nome = "componentes-ministerio.pdf";
  if (opcoes?.abrirImpressao) {
    doc.autoPrint();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
    return;
  }
  doc.save(nome);
}
