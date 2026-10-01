import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const parametros: {
    categoria: string;
    valor: string;
    rotulo: string;
    ordem: number;
    extra?: string;
  }[] = [
    { categoria: "voz", valor: "Masculino", rotulo: "Masculino", ordem: 1, extra: "homem" },
    { categoria: "voz", valor: "Feminino", rotulo: "Feminino", ordem: 2 },
    { categoria: "afinacao", valor: "1", rotulo: "1 — Pouco afinado", ordem: 1 },
    { categoria: "afinacao", valor: "2", rotulo: "2 — Afinado sem muita precisão nas notas", ordem: 2 },
    { categoria: "afinacao", valor: "3", rotulo: "3 — Afinado sem extensão vocal", ordem: 3 },
    { categoria: "afinacao", valor: "4", rotulo: "4 — Afinado com extensão vocal", ordem: 4 },
    { categoria: "tipoVoz", valor: "Contralto", rotulo: "Contralto", ordem: 1 },
    { categoria: "tipoVoz", valor: "Mezzo-soprano", rotulo: "Mezzo-soprano", ordem: 2 },
    { categoria: "tipoVoz", valor: "Soprano", rotulo: "Soprano", ordem: 3 },
    { categoria: "tipoVoz", valor: "Baixo", rotulo: "Baixo", ordem: 4 },
    { categoria: "tipoVoz", valor: "Barítono", rotulo: "Barítono", ordem: 5 },
    { categoria: "tipoVoz", valor: "Tenor", rotulo: "Tenor", ordem: 6 },
    { categoria: "leadVocal", valor: "SIM", rotulo: "SIM", ordem: 1 },
    { categoria: "leadVocal", valor: "NÃO", rotulo: "NÃO", ordem: 2 },
    { categoria: "leadVocal", valor: "SIM com ressalvas", rotulo: "SIM com ressalvas", ordem: 3 },
    { categoria: "backingVocal", valor: "Sabe cantar em vozes", rotulo: "Sabe cantar em vozes", ordem: 1 },
    { categoria: "backingVocal", valor: "Não sabe cantar em vozes", rotulo: "Não sabe cantar em vozes", ordem: 2 },
    { categoria: "backingVocal", valor: "Consegue decorar voz com treino", rotulo: "Consegue decorar voz com treino", ordem: 3 },
    {
      categoria: "backingVocal",
      valor: "Consegue decorar voz mas sem muita afinação",
      rotulo: "Consegue decorar voz mas sem muita afinação",
      ordem: 4,
    },
  ];

  for (const item of parametros) {
    await prisma.parametro.upsert({
      where: { categoria_valor: { categoria: item.categoria, valor: item.valor } },
      update: { rotulo: item.rotulo, ordem: item.ordem, extra: item.extra },
      create: item,
    });
  }

  const funcoes = [
    { nome: "Bateria", grupo: "MUSICO", ordem: 1 },
    { nome: "Baixo", grupo: "MUSICO", ordem: 2 },
    { nome: "Teclado", grupo: "MUSICO", ordem: 3 },
    { nome: "Guitarra", grupo: "MUSICO", ordem: 4 },
    { nome: "Violão", grupo: "MUSICO", ordem: 5 },
    { nome: "Lead Vocal", grupo: "CANTOR", ordem: 6 },
    { nome: "Backing Vocal", grupo: "CANTOR", ordem: 7 },
  ];

  const funcaoIds: Record<string, string> = {};
  for (const funcao of funcoes) {
    const registro = await prisma.funcao.upsert({
      where: { nome: funcao.nome },
      update: { ordem: funcao.ordem, grupo: funcao.grupo },
      create: funcao,
    });
    funcaoIds[funcao.nome] = registro.id;
  }

  const vozes = new Set(["Lead Vocal", "Backing Vocal"]);
  function perfilDe(nomesFuncoes: string[]) {
    const temMusico = nomesFuncoes.some((nome) => !vozes.has(nome));
    const temCantor = nomesFuncoes.some((nome) => vozes.has(nome));
    if (temMusico && temCantor) return "AMBOS";
    if (temMusico) return "MUSICO";
    return "CANTOR";
  }

  const integrantes = [
    {
      nome: "Neto",
      nascimento: "1992-09-12",
      voz: "Masculino",
      afinacao: 3,
      tipoVoz: "Barítono",
      leadVocal: "NÃO",
      backingVocal: "Consegue decorar voz com treino",
      funcoes: ["Bateria"],
    },
    {
      nome: "Gabriel",
      nascimento: "1994-09-28",
      voz: "Masculino",
      afinacao: 3,
      tipoVoz: "Tenor",
      leadVocal: "NÃO",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Baixo"],
    },
    {
      nome: "Max",
      nascimento: "1990-04-15",
      voz: "Masculino",
      afinacao: 4,
      tipoVoz: "Barítono",
      leadVocal: "SIM",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Teclado", "Baixo"],
    },
    {
      nome: "Alexander",
      voz: "Masculino",
      afinacao: 3,
      tipoVoz: "Baixo",
      leadVocal: "NÃO",
      backingVocal: "Não sabe cantar em vozes",
      funcoes: ["Bateria"],
    },
    {
      nome: "Jarbas",
      nascimento: "1988-09-20",
      voz: "Masculino",
      afinacao: 4,
      tipoVoz: "Tenor",
      leadVocal: "SIM",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Teclado"],
    },
    {
      nome: "Maria Clara",
      nascimento: "1998-09-03",
      voz: "Feminino",
      afinacao: 4,
      tipoVoz: "Soprano",
      leadVocal: "SIM",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Lead Vocal"],
    },
    {
      nome: "Ana Paula",
      voz: "Feminino",
      afinacao: 3,
      tipoVoz: "Mezzo-soprano",
      leadVocal: "SIM com ressalvas",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Backing Vocal"],
    },
    {
      nome: "Juliana",
      voz: "Feminino",
      afinacao: 3,
      tipoVoz: "Contralto",
      leadVocal: "NÃO",
      backingVocal: "Consegue decorar voz com treino",
      funcoes: ["Backing Vocal"],
    },
    {
      nome: "Rafael",
      voz: "Masculino",
      afinacao: 4,
      tipoVoz: "Tenor",
      leadVocal: "SIM",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Lead Vocal", "Violão"],
    },
    {
      nome: "Bruno",
      voz: "Masculino",
      afinacao: 2,
      tipoVoz: "Barítono",
      leadVocal: "NÃO",
      backingVocal: "Consegue decorar voz mas sem muita afinação",
      funcoes: ["Backing Vocal"],
    },
    {
      nome: "Camila",
      voz: "Feminino",
      afinacao: 4,
      tipoVoz: "Soprano",
      leadVocal: "SIM",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Lead Vocal"],
    },
    {
      nome: "Diego",
      voz: "Masculino",
      afinacao: 3,
      tipoVoz: "Baixo",
      leadVocal: "NÃO",
      backingVocal: "Sabe cantar em vozes",
      funcoes: ["Backing Vocal", "Guitarra"],
    },
  ];

  const ids: Record<string, string> = {};

  for (const item of integrantes) {
    const existente = await prisma.integrante.findFirst({
      where: { nome: item.nome },
    });

    const registro = existente
      ? await prisma.integrante.update({
          where: { id: existente.id },
          data: {
            perfil: perfilDe(item.funcoes),
            voz: item.voz,
            afinacao: item.afinacao,
            tipoVoz: item.tipoVoz,
            leadVocal: item.leadVocal,
            backingVocal: item.backingVocal,
            nascimento: "nascimento" in item && item.nascimento
              ? new Date(`${item.nascimento}T12:00:00.000Z`)
              : undefined,
            funcoes: {
              deleteMany: {},
              create: item.funcoes.map((nome) => ({
                funcaoId: funcaoIds[nome],
              })),
            },
          },
        })
      : await prisma.integrante.create({
          data: {
            nome: item.nome,
            perfil: perfilDe(item.funcoes),
            voz: item.voz,
            afinacao: item.afinacao,
            tipoVoz: item.tipoVoz,
            leadVocal: item.leadVocal,
            backingVocal: item.backingVocal,
            nascimento: "nascimento" in item && item.nascimento
              ? new Date(`${item.nascimento}T12:00:00.000Z`)
              : undefined,
            funcoes: {
              create: item.funcoes.map((nome) => ({
                funcaoId: funcaoIds[nome],
              })),
            },
          },
        });

    ids[item.nome] = registro.id;
  }

  await prisma.usuario.deleteMany();
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaMembro = await bcrypt.hash("membro123", 10);

  if (ids.Jarbas) {
    await prisma.usuario.create({
      data: {
        integranteId: ids.Jarbas,
        email: "admin@escalas.local",
        senha: senhaAdmin,
        perfil: "ADMIN",
      },
    });
  }

  if (ids.Neto) {
    await prisma.usuario.create({
      data: {
        integranteId: ids.Neto,
        email: "membro@escalas.local",
        senha: senhaMembro,
        perfil: "MEMBRO",
      },
    });
  }

  const dataCulto = new Date("2026-09-13T12:00:00.000Z");
  const alocacoesCulto = {
    primeiro: [
      { ordem: 0, sessao: "MUSICO", integranteId: ids.Neto, funcaoId: funcaoIds.Bateria },
      { ordem: 1, sessao: "MUSICO", integranteId: ids.Gabriel, funcaoId: funcaoIds.Baixo },
      { ordem: 2, sessao: "MUSICO", integranteId: ids.Max, funcaoId: funcaoIds.Teclado },
      { ordem: 3, sessao: "CANTOR", integranteId: ids["Maria Clara"], funcaoId: funcaoIds["Lead Vocal"] },
      { ordem: 4, sessao: "CANTOR", integranteId: ids["Ana Paula"], funcaoId: funcaoIds["Backing Vocal"] },
    ],
    segundo: [
      { ordem: 0, sessao: "MUSICO", integranteId: ids.Alexander, funcaoId: funcaoIds.Bateria },
      { ordem: 1, sessao: "MUSICO", integranteId: ids.Max, funcaoId: funcaoIds.Baixo },
      { ordem: 2, sessao: "MUSICO", integranteId: ids.Jarbas, funcaoId: funcaoIds.Teclado },
      { ordem: 3, sessao: "CANTOR", integranteId: ids.Camila, funcaoId: funcaoIds["Lead Vocal"] },
      { ordem: 4, sessao: "CANTOR", integranteId: ids.Rafael, funcaoId: funcaoIds["Backing Vocal"] },
    ],
  };

  let escalaExistente = await prisma.escala.findFirst({
    where: {
      data: dataCulto,
      OR: [{ titulo: "Cultos 13/09" }, { titulo: "Culto" }],
    },
    include: { blocos: { include: { alocacoes: true } } },
  });

  if (escalaExistente) {
    await prisma.escala.update({
      where: { id: escalaExistente.id },
      data: { titulo: "Culto" },
    });
    const vazia = escalaExistente.blocos.every((bloco) => bloco.alocacoes.length === 0);
    if (vazia) {
      await prisma.bloco.deleteMany({ where: { escalaId: escalaExistente.id } });
      await prisma.bloco.createMany({
        data: [
          { escalaId: escalaExistente.id, nome: "PRIMEIRO CULTO", ordem: 0 },
          { escalaId: escalaExistente.id, nome: "SEGUNDO CULTO", ordem: 1 },
        ],
      });
      const blocos = await prisma.bloco.findMany({
        where: { escalaId: escalaExistente.id },
        orderBy: { ordem: "asc" },
      });
      await prisma.alocacao.createMany({
        data: [
          ...alocacoesCulto.primeiro.map((linha) => ({ ...linha, blocoId: blocos[0].id })),
          ...alocacoesCulto.segundo.map((linha) => ({ ...linha, blocoId: blocos[1].id })),
        ],
      });
    }
  } else {
    await prisma.escala.create({
      data: {
        titulo: "Culto",
        data: dataCulto,
        tipo: "MANUAL",
        blocos: {
          create: [
            {
              nome: "PRIMEIRO CULTO",
              ordem: 0,
              alocacoes: { create: alocacoesCulto.primeiro },
            },
            {
              nome: "SEGUNDO CULTO",
              ordem: 1,
              alocacoes: { create: alocacoesCulto.segundo },
            },
          ],
        },
      },
    });
  }

  console.log(
    "Seed concluído. Admin: Jarbas / admin@escalas.local / admin123 · Membro: Neto / membro@escalas.local / membro123",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erro) => {
    console.error(erro);
    await prisma.$disconnect();
    process.exit(1);
  });
