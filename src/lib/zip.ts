import { deflateRawSync } from "node:zlib";

function crc32(dados: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < dados.length; i++) {
    crc ^= dados[i];
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(valor: number) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(valor);
  return buf;
}

function u32(valor: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(valor);
  return buf;
}

export function criarZip(entradas: { nome: string; dados: Buffer }[]) {
  const locais: Buffer[] = [];
  const centrais: Buffer[] = [];
  let offset = 0;

  for (const entrada of entradas) {
    const nome = Buffer.from(entrada.nome, "utf8");
    const original = entrada.dados;
    const compactado = deflateRawSync(original, { level: 9 });
    const crc = crc32(original);
    const local = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      u16(20),
      u16(0),
      u16(8),
      u16(0),
      u16(0),
      u32(crc),
      u32(compactado.length),
      u32(original.length),
      u16(nome.length),
      u16(0),
      nome,
      compactado,
    ]);
    locais.push(local);
    centrais.push(
      Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x01, 0x02]),
        u16(20),
        u16(20),
        u16(0),
        u16(8),
        u16(0),
        u16(0),
        u32(crc),
        u32(compactado.length),
        u32(original.length),
        u16(nome.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nome,
      ]),
    );
    offset += local.length;
  }

  const central = Buffer.concat(centrais);
  const fim = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x05, 0x06]),
    u16(0),
    u16(0),
    u16(entradas.length),
    u16(entradas.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);
  return Buffer.concat([...locais, central, fim]);
}
