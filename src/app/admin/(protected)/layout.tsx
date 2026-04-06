import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return (
    <main className="page-shell">
      <div className="container admin-topbar card card-pad">
        <div>
          <p className="subtitle">Connecté en tant que {admin.email}</p>
          <h1 className="title">Back-office K-minari</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="container admin-shell">
        <AdminSidebar />
        <section className="stack">{children}</section>
      </div>
    </main>
  );
}