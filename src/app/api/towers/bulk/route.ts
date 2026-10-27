import { NextResponse } from "next/server";
import { directusFetch } from "@/lib/directus-session";
import { isSameOriginRequest } from "@/lib/portal-proxy";
import { parsePayloadSize } from "@/lib/env";
import { getServerEnv } from "@/lib/server-env";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Form unggahan tidak valid." }, { status: 400 });
  }

  const file = formData.get("file");
  if (
    !file ||
    typeof file === "string" ||
    !("arrayBuffer" in file) ||
    !file.name.toLowerCase().endsWith(".xlsx")
  ) {
    return NextResponse.json({ error: "Pilih file Excel .xlsx yang valid." }, { status: 400 });
  }

  const maxSize = parsePayloadSize(getServerEnv().maxPayloadSize);
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Ukuran file melebihi batas unggahan." }, { status: 413 });
  }

  const stagedFile = new FormData();
  stagedFile.append("file", file, file.name);
  let uploadResponse: Response;
  try {
    uploadResponse = await directusFetch("/files", { method: "POST", body: stagedFile });
  } catch {
    return NextResponse.json(
      { error: "File tidak dapat dikirim ke Directus." },
      { status: 502 },
    );
  }
  const uploadPayload = (await uploadResponse.json().catch(() => null)) as
    | { data?: { id?: string }; errors?: Array<{ message?: string }> }
    | null;
  if (!uploadResponse.ok || !uploadPayload?.data?.id) {
    return NextResponse.json(
      { error: uploadPayload?.errors?.[0]?.message || "Upload file ke Directus gagal." },
      { status: uploadResponse.status || 502 },
    );
  }

  let processResponse: Response;
  try {
    processResponse = await directusFetch("/bulk-tower-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: uploadPayload.data.id }),
    });
  } catch {
    return NextResponse.json(
      { error: "File sudah diunggah, tetapi proses impor tidak dapat dijangkau. Hubungi administrator." },
      { status: 502 },
    );
  }

  return new NextResponse(processResponse.body, {
    status: processResponse.status,
    headers: {
      "content-type":
        processResponse.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
}
