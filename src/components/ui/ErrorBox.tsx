"use client";

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function ErrorBox({ title = "오류가 발생했습니다", message, onRetry }: Props) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
      <p className="font-medium text-red-800">{title}</p>
      <p className="mt-1 text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-red-700 underline hover:text-red-900"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
