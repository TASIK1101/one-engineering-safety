"use client";

/**
 * EmergencyFileUpload — 여러 장의 사진/PDF 업로드 (emergency-files 버킷)
 * - 허용: image/jpeg, image/png, image/webp, application/pdf
 * - 업로드는 /api/emergency/upload 경유 (서버에서 admin client 사용)
 * - 업로드된 public URL 배열을 onChange 콜백으로 전달
 */

import { useRef, useState } from "react";
import { resolveEmergencyFileUrl } from "@/lib/emergency";

interface Props {
  folder?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

const MAX_MB = 20;

export default function EmergencyFileUpload({ folder = "general", value, onChange, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList) {
    setError("");
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/emergency/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(`업로드 실패: ${data.detail ?? data.error ?? "오류"}`);
          continue;
        }
        if (data.url) uploaded.push(data.url);
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? `업로드 실패: ${err.message}` : "업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        disabled={disabled || uploading}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {uploading ? "업로드 중…" : "📎 사진/파일 추가"}
      </button>
      <p className="text-xs text-gray-400">JPG · PNG · WEBP · PDF / 최대 {MAX_MB}MB · 여러 장 선택 가능</p>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, idx) => {
            const resolved = resolveEmergencyFileUrl(url) ?? url;
            const isPdf = resolved.toLowerCase().endsWith(".pdf");
            return (
              <div key={idx} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {isPdf ? (
                  <a href={resolved} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-20 text-xs text-blue-600">
                    📄 PDF 보기
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolved} alt={`첨부 ${idx + 1}`} className="h-20 w-full object-cover" />
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
