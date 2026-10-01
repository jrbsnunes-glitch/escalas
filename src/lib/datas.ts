export function parseDataIso(texto: string | null | undefined) {
  const valor = String(texto ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  return new Date(`${valor}T12:00:00.000Z`);
}

export function ymdDeData(data: Date | string | null | undefined) {
  if (!data) return "";
  const iso = data instanceof Date ? data.toISOString() : String(data);
  return iso.slice(0, 10);
}

export function formatarDiaMes(data: Date | string) {
  const iso = ymdDeData(data);
  if (!iso) return "";
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export const COOKIE_FUSO = "escalas_tz";

export function fusoEhValido(fuso: string | undefined | null): fuso is string {
  if (!fuso) return false;
  try {
    Intl.DateTimeFormat("en-CA", { timeZone: fuso }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function fusoDeCookie(valor?: string) {
  return fusoEhValido(valor) ? valor : undefined;
}

function opcoesFuso(timeZone?: string): Intl.DateTimeFormatOptions {
  return fusoEhValido(timeZone) ? { timeZone } : {};
}

export function mesAtual(agora = new Date(), timeZone?: string) {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      ...opcoesFuso(timeZone),
      month: "numeric",
    }).format(agora),
  );
}

export function mesAtualSaoPaulo(agora = new Date()) {
  return mesAtual(agora, "America/Sao_Paulo");
}

export function aniversarioNoMes(data: Date, mes: number) {
  return data.getUTCMonth() + 1 === mes;
}

export function partesHoje(agora = new Date(), timeZone?: string) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    ...opcoesFuso(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  const [ano, mes, dia] = ymd.split("-").map(Number);
  return { ano, mes, dia, ymd };
}

export function partesHojeSaoPaulo(agora = new Date()) {
  return partesHoje(agora, "America/Sao_Paulo");
}

export function nomeMesAtual(agora = new Date(), timeZone?: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    ...opcoesFuso(timeZone),
    month: "long",
  }).format(agora);
}

export function diasAteAniversario(
  nascimento: Date,
  agora = new Date(),
  timeZone?: string,
) {
  const hoje = partesHoje(agora, timeZone);
  const nMes = nascimento.getUTCMonth() + 1;
  const nDia = nascimento.getUTCDate();
  const hojeUtc = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia);
  let alvo = Date.UTC(hoje.ano, nMes - 1, nDia);
  if (alvo < hojeUtc) {
    alvo = Date.UTC(hoje.ano + 1, nMes - 1, nDia);
  }
  return Math.round((alvo - hojeUtc) / 86_400_000);
}

export function juntarNomes(nomes: string[]) {
  if (nomes.length <= 1) return nomes[0] ?? "";
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
