"use client";

/**
 * CertificateUpload — 보호구 인증서 업로드 (이미지 또는 PDF)
 * - 허용: image/jpeg, image/png, application/pdf
 * - bucket: ppe-certificates (public)
 * - 업로드 성공 시 public URL을 onUpload 콜백으로 전달
 */

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PPE_CERT_BUCKET, resolveCertUrl } from "@/lib/ppe";

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

interface Props {
  folder?: string;
  initialUrl?: string | null;
  onUpload: (publicUrl: string) => void;
  disabled?: boolean;
}

export default function CertificateUpload({
  folder = "certificates",
  initialUrl,
  onUpload,
  disabled = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(
    resolveCertUrl(initialUrl) ?? null
  );
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function uploadFile(file: File) {
    setErrorMsg("");

    if (!ALLOWED.includes(file.type)) {
      setErrorMsg("JPG, PNG 이미지 또는 PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrorMsg(
        `파일이 너무 큽니다. ${MAX_MB}MB 이하 파일을 선택해주세요. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
      );
      return;
    }

    setUploading(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const uid = crypto.randomUUID().slice(0, 8);
    const filePath = `${folder}/${Date.now()}-${uid}.${ext}`;
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
    const publicUrl = `${base}/storage/v1/object/public/${PPE_CERT_BUCKET}/${filePath}`;

    try {
      const { error: uploadErr } = await supabase.storage
        .from(PPE_CERT_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadErr) {
        setErrorMsg(
          uploadErr.message.includes("Bucket")
            ? "스토리지 버킷(ppe-certificates)이 설정되지 않았습니다. 마이그레이션 SQL을 실행했는지 확인하세요."
            : `업로드 실패: ${uploadErr.message}`
        );
        return;
      }

      setSavedUrl(publicUrl);
      setFileName(file.name);
      onUpload(publicUrl);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? `업로드 실패: ${err.message}` : "업로드 중 오류가 발생했습니다."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? "업로드 중…" : "📎 인증서 파일 선택"}
        </button>
        {savedUrl && (
          <a
            href={savedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            {fileName ? `${fileName} · ` : ""}새 창으로 보기 →
          </a>
        )}
      </div>

      <p className="text-xs text-gray-400">JPG · PNG · PDF / 최대 {MAX_MB}MB</p>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
