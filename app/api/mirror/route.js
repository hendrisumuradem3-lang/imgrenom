import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal fetch URL sumber");

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buf = await res.arrayBuffer();

    const nameFromUrl = (() => {
      try {
        const u = new URL(url);
        const last = u.pathname.split("/").pop() || "file";
        return last.replace(/[^a-zA-Z0-9._-]/g, "_");
      } catch { return "file"; }
    })();

    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${nameFromUrl}`;

    const { url: newUrl } = await put(uniqueName, new Blob([buf]), {
      access: "public",
      addRandomSuffix: false,
      contentType,
      cacheControlMaxAge: 31536000,
    });

    return new Response(JSON.stringify({ url: newUrl }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
