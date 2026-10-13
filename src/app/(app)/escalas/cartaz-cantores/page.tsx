import { Card, PageHeader } from "@/components/ui";
import { CartazCantores } from "@/components/CartazCantores";
import { exigirAdmin } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import { includeEscala, serializarEscala } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function CartazCantoresPage() {
  await exigirAdmin();
  const desde = new Date();
  desde.setMonth(desde.getMonth() - 6);
  const escalas = await prisma.escala.findMany({
    where: { especial: false, data: { gte: desde } },
    include: includeEscala,
    orderBy: { data: "asc" },
  });

  return (
    <>
      <PageHeader
        titulo="Cartaz de cantores"
        descricao="Exporte um PDF ou uma imagem com um quadro por domingo, só com os cantores dos dois cultos."
      />
      <Card>
        <CartazCantores escalas={escalas.map(serializarEscala)} />
      </Card>
    </>
  );
}
