import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMERGENCY_FILES_BUCKET } from "@/lib/emergency";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "general";
  if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type", detail: "JPG·PNG·WEBP·PDF 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large", detail: "20MB 이하 파일만 업로드할 수 있습니다." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const uid = crypto.randomUUID().slice(0, 8);
  const path = `${folder}/${Date.now()}-${uid}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(EMERGENCY_FILES_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
  if (error) {
    return NextResponse.json({ error: "upload_failed", detail: error.message }, { status: 500 });
  }

  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const publicUrl = `${base}/storage/v1/object/public/${EMERGENCY_FILES_BUCKET}/${path}`;
  return NextResponse.json({ path, url: publicUrl });
}
