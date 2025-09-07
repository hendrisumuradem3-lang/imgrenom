import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Only image files are allowed" }), {
        status: 415,
        headers: { "content-type": "application/json" },
      });
    }
    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) {
      return new Response(JSON.stringify({ error: "Max file size is 5MB" }), {
        status: 413,
        headers: { "content-type": "application/json" },
      });
    }

    const origName = file.name || `upload-${Date.now()}`;
    const safeName = origName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

    const { url } = await put(uniqueName, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
      cacheControlMaxAge: 31536000,
    });

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Upload failed", detail: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
