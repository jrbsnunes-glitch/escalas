import { Card, Empty, PageHeader } from "@/components/ui";
import { PedidosTrocaAdmin } from "@/components/PedidosTrocaAdmin";
import { exigirAdmin } from "@/lib/acesso";
import { prisma } from "@/lib/prisma";
import { includePedidoTroca, opcoesPedidoTroca, serializarPedidoTroca } from "@/lib/troca";

export default async function TrocasPage() {
  await exigirAdmin();
  const [pedidos, opcoes] = await Promise.all([
    prisma.pedidoTroca.findMany({
      where: { status: "PENDENTE" },
      include: includePedidoTroca,
      orderBy: { createdAt: "desc" },
    }),
    opcoesPedidoTroca(),
  ]);

  return (
    <>
      <PageHeader
        titulo="Pedidos de troca"
        descricao="Aprove a sugestão, ajuste o substituto (e a música, se for cantor) e salve na escala. Ou recuse o pedido."
      />
      <Card>
        <PedidosTrocaAdmin
          pedidos={pedidos.map(serializarPedidoTroca)}
          musicas={opcoes.musicas}
          integrantes={opcoes.integrantes}
        />
      </Card>
    </>
  );
}
