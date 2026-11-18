import type { NextRequest } from "next/server";
import { clienteAutenticado, uuid } from "@/lib/supabase/escritorios";
import { bucketDocumentos, limitePdf, nomeObjeto } from "./config";

function identificadores(request: NextRequest) {
  const escritorio = request.nextUrl.searchParams.get("escritorio") ?? "";
  const processo = request.nextUrl.searchParams.get("processo") ?? "";
  return uuid.test(escritorio) && uuid.test(processo) ? { escritorio, processo } : null;
}

async function lerPdf(request: Request) {
  const leitor = request.body?.getReader();
  if (!leitor) return null;
  const bytes = new Uint8Array(limitePdf);
  let tamanho = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      if (tamanho + value.length > limitePdf) {
        await leitor.cancel();
        return null;
      }
      bytes.set(value, tamanho);
      tamanho += value.length;
    }
  } finally {
    leitor.releaseLock();
  }
  if (tamanho < 5 || new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") return null;
  return bytes.subarray(0, tamanho);
}

export async function POST(request: NextRequest) {
  const origem = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).origin : request.nextUrl.origin;
  if (request.headers.get("origin") !== origem) return new Response(null, { status: 403 });
  const ids = identificadores(request);
  const nome = request.headers.get("x-nome-documento") ?? "";
  const tamanho = Number(request.headers.get("content-length") ?? 0);
  if (!ids || !/^[A-Za-z0-9_-]{1,80}\.pdf$/.test(nome) ||
      request.headers.get("content-type") !== "application/pdf") return new Response(null, { status: 400 });
  if (tamanho > limitePdf) return new Response(null, { status: 413 });

  try {
    const { supabase } = await clienteAutenticado();
    const { data: processo, error } = await supabase.from("processos").select("id")
      .eq("escritorio_id", ids.escritorio).eq("id", ids.processo).maybeSingle();
    if (error || !processo) return new Response(null, { status: 404 });
    const pdf = await lerPdf(request);
    if (!pdf) return new Response(null, { status: 422 });
    const objeto = `${ids.escritorio}/${ids.processo}/${crypto.randomUUID()}__${nome}`;
    const { error: falha } = await supabase.storage.from(bucketDocumentos)
      .upload(objeto, pdf, { contentType: "application/pdf", upsert: false });
    return new Response(null, { status: falha ? 502 : 201 });
  } catch {
    return new Response(null, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const ids = identificadores(request);
  const objeto = request.nextUrl.searchParams.get("objeto") ?? "";
  if (!ids || !nomeObjeto.test(objeto)) return new Response(null, { status: 404 });
  try {
    const { supabase } = await clienteAutenticado();
    const { data, error } = await supabase.storage.from(bucketDocumentos)
      .download(`${ids.escritorio}/${ids.processo}/${objeto}`, {}, { cache: "no-store" });
    if (error) return new Response(null, { status: 404 });
    return new Response(data, { headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${objeto.slice(38)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
