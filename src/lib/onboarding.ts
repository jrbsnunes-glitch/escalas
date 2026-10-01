import { prisma } from "./prisma";

export async function precisaCompletarCadastro(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      primeiroAcesso: true,
      integrante: { select: { nascimento: true } },
    },
  });
  if (!usuario) return false;
  return usuario.primeiroAcesso || !usuario.integrante.nascimento;
}
