import { Card, PageHeader } from "@/components/ui";
import { UsuariosAdmin } from "@/components/UsuariosAdmin";
import { exigirAdmin } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import { includeUsuario, serializarUsuario } from "@/lib/usuario";
import { ehPerfilUsuario } from "@/lib/types";

export default async function UsuariosPage() {
  const sessao = await exigirAdmin();
  const [usuarios, integrantes] = await Promise.all([
    prisma.usuario.findMany({
      include: includeUsuario,
      orderBy: [{ perfil: "asc" }, { email: "asc" }],
    }),
    prisma.integrante.findMany({
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        titulo="Usuários"
        descricao="O acesso ao sistema é o próprio cantor ou músico. Escolha a pessoa cadastrada, o e-mail, a senha e se ela entra como Administrador ou Membro."
      />
      <Card>
        <UsuariosAdmin
          usuarioAtualId={sessao.id}
          integrantes={integrantes.map((item) => ({
            id: item.id,
            nome: item.nome,
            perfil: item.perfil as "CANTOR" | "MUSICO" | "AMBOS",
            ativo: item.ativo,
          }))}
          usuarios={usuarios
            .map(serializarUsuario)
            .filter((usuario) => ehPerfilUsuario(usuario.perfil))}
        />
      </Card>
    </>
  );
}
