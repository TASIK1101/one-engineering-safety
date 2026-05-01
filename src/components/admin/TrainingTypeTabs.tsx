"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TRAINING_TYPE_OPTIONS } from "@/lib/training-types";

const ALL_TABS = [
  { value: "", label: "전체" },
  ...TRAINING_TYPE_OPTIONS,
];

export default function TrainingTypeTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("type") ?? "";

  function handleTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    router.push(`/trainings?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {ALL_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleTab(tab.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
            current === tab.value
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
