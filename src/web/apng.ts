import { crc32 } from "./zip";

/**
 * Junta vários PNG (um por quadro, com transparência) num único PNG animado (APNG).
 * Os dados comprimidos de cada PNG são reaproveitados, então usa pouca memória.
 */
type Chunk = { type: string; data: Uint8Array };

function readChunks(buf: Uint8Array): Chunk[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out: Chunk[] = [];
  let p = 8; // pula a assinatura PNG
  while (p < buf.length) {
    const len = dv.getUint32(p);
    const type = String.fromCharCode(buf[p + 4], buf[p + 5], buf[p + 6], buf[p + 7]);
    out.push({ type, data: buf.subarray(p + 8, p + 8 + len) });
    p += 12 + len;
    if (type === "IEND") break;
  }
  return out;
}

function chunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function u32(...vals: number[]) {
  const b = new Uint8Array(vals.length * 4);
  const dv = new DataView(b.buffer);
  vals.forEach((v, i) => dv.setUint32(i * 4, v));
  return b;
}

export async function makeApng(frames: Blob[], fps: number): Promise<Blob> {
  if (!frames.length) throw new Error("Nenhum quadro para montar o PNG animado.");
  const parts: BlobPart[] = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])];
  let seq = 0;
  // atraso de cada quadro = 1/fps segundo (fração num/den de 16 bits)
  const den = Math.round(fps * 100) <= 65535 ? Math.round(fps * 100) : Math.round(fps);
  const num = den === Math.round(fps * 100) ? 100 : 1;
  for (let i = 0; i < frames.length; i++) {
    const chunks = readChunks(new Uint8Array(await frames[i].arrayBuffer()));
    const ihdr = chunks.find((c) => c.type === "IHDR")!;
    const w = new DataView(ihdr.data.buffer, ihdr.data.byteOffset).getUint32(0);
    const h = new DataView(ihdr.data.buffer, ihdr.data.byteOffset).getUint32(4);
    if (i === 0) {
      parts.push(chunk("IHDR", ihdr.data));
      parts.push(chunk("acTL", u32(frames.length, 0))); // repete para sempre
    }
    // fcTL: quadro inteiro, limpa o fundo depois de mostrar (dispose=1), sem mesclar (blend=0)
    const fc = new Uint8Array(26);
    const dv = new DataView(fc.buffer);
    dv.setUint32(0, seq++); dv.setUint32(4, w); dv.setUint32(8, h); dv.setUint32(12, 0); dv.setUint32(16, 0);
    dv.setUint16(20, num); dv.setUint16(22, den); fc[24] = 1; fc[25] = 0;
    parts.push(chunk("fcTL", fc));
    for (const c of chunks.filter((c) => c.type === "IDAT")) {
      if (i === 0) parts.push(chunk("IDAT", c.data));
      else {
        const d = new Uint8Array(4 + c.data.length);
        new DataView(d.buffer).setUint32(0, seq++);
        d.set(c.data, 4);
        parts.push(chunk("fdAT", d));
      }
    }
  }
  parts.push(chunk("IEND", new Uint8Array(0)));
  return new Blob(parts, { type: "image/png" });
}
