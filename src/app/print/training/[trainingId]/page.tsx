export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import TrainingPrintDocument from "@/components/print/documents/TrainingPrintDocument";
import type { Employee, Training, TrainingAssignment } from "@/types";

export default async function PrintTrainingPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: training } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", trainingId)
    .eq("admin_id", user.id)
    .single();

  if (!training) notFound();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("admin_id", user.id)
    .order("name");

  const { data: assignments } = await supabase
    .from("training_assignments")
    .select("*, employees(*)")
    .eq("training_id", trainingId);

  const allEmployees = (employees ?? []) as Employee[];
  const allAssignments = (assignments ?? []) as TrainingAssignment[];

  return (
    <>
      <PrintStyles />
      <PrintButtonBar
        backHref={`/trainings/${trainingId}`}
        backLabel="← 돌아가기"
        pageTitle="교육 이수 기록 출력"
        hasAppendix={allEmployees.length > 0}
      />
      <TrainingPrintDocument
        training={training as Training}
        employees={allEmployees}
        assignments={allAssignments}
      />
    </>
  );
}
