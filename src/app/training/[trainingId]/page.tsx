export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import TrainingSession from "@/components/training/TrainingSession";
import type { Training } from "@/types";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const supabase = await createClient();

  const { data: training } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", trainingId)
    .single();

  if (!training) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="주식회사 원엔지니어링"
            width={40}
            height={40}
            className="rounded-full object-contain shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 leading-none mb-0.5">
              주식회사 원엔지니어링 · 안전교육
            </p>
            <p className="font-semibold text-gray-900 text-sm truncate">
              {training.title}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 pb-16">
        <TrainingSession training={training as Training} />
      </div>
    </div>
  );
}
