/**
 * Supabase Storage 사진 URL 정규화 유틸리티
 *
 * DB에 저장된 값이 아래 두 경우 모두 처리:
 *   ① 전체 URL  "https://xyz.supabase.co/storage/v1/object/public/safety-photos/..."
 *   ② 경로만    "inspections/items/1234-abc.jpg"
 *
 * ②의 경우 NEXT_PUBLIC_SUPABASE_URL 을 이용해 전체 URL로 변환한다.
 */

const BUCKET = "safety-photos";

/** 환경변수에서 Supabase URL을 가져와 trailing slash 제거 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.replace(/\/$/, "");
}

/**
 * 저장된 값을 접근 가능한 public URL로 변환한다.
 * null / undefined / 빈 문자열은 null을 반환한다.
 */
export function resolvePhotoUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();

  // 이미 완전한 URL → 그대로 반환
  if (v.startsWith("http://") || v.startsWith("https://")) {
    return v;
  }

  // path만 저장된 경우 → Supabase public URL로 변환
  const base = getSupabaseUrl();
  if (!base) return null;

  // "safety-photos/foo/bar.jpg" 형태도 처리
  const cleanPath = v.startsWith(`${BUCKET}/`)
    ? v.slice(BUCKET.length + 1)
    : v;

  return `${base}/storage/v1/object/public/${BUCKET}/${cleanPath}`;
}

/**
 * 파일 경로(path)로 Supabase public URL을 명시적으로 조립한다.
 * getPublicUrl() SDK 메서드에 의존하지 않음.
 */
export function buildPublicUrl(filePath: string): string {
  const base = getSupabaseUrl();
  return `${base}/storage/v1/object/public/${BUCKET}/${filePath}`;
}
