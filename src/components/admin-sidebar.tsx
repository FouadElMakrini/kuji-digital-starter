"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/kujis/new", label: "Nouveau Kuji" },
  { href: "/admin/import", label: "Import 1Kuji" },
  { href: "/admin/history", label: "Historique" }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar card card-pad">
      <div className="stack" style={{ gap: "1rem" }}>
        <BrandMark compact />

        <nav>
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "active" : ""}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}