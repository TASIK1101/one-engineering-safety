import type { WorkPermitItem } from "@/types";

export default function WorkPermitChecklist({
  checklistItems,
}: {
  checklistItems: WorkPermitItem[];
}) {
  if (checklistItems.length === 0) return null;

  const checklistByCategory = checklistItems.reduce<Record<string, WorkPermitItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        ☑️ 작업 전 체크리스트
      </h2>
      <div className="space-y-4">
        {Object.entries(checklistByCategory).map(([category, catItems]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg mb-2">
              {category}
            </p>
            <div className="space-y-1">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                >
                  <span
                    className={`text-sm flex-1 ${
                      item.apply_status === "해당없음"
                        ? "text-gray-400 line-through"
                        : "text-gray-800"
                    }`}
                  >
                    {item.item_text}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        item.apply_status === "신청"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {item.apply_status}
                    </span>
                    {item.field_confirmed && (
                      <span className="text-xs text-green-600 font-semibold">
                        ✓ 확인
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
