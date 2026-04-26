import AdminNav from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
