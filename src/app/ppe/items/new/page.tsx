import Link from "next/link";
import PpeItemForm from "@/components/ppe/PpeItemForm";

export default function NewPpeItemPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ppe/items" className="text-gray-400 hover:text-gray-600 text-sm">← 품목 목록</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">보호구 품목 등록</h1>
      </div>
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <PpeItemForm />
      </div>
    </div>
  );
}
