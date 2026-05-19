"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  Image
} from "lucide-react";



const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/teachers",
    label: "Teachers",
    icon: Users,
  },
  {
    href: "/notices",
    label: "Notice",
    icon: Bell,
  },
  {
    href: "/gallery",
    label: "Gallery",
    icon: Image,
  },
];



export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* border */}
      <span className="mt-1 border-b border-gray-800"></span>

      {/* left Navigation  buttons */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === '/' : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* left Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        © 2026 SSBS Admin
      </div>
    </div>
  );
}