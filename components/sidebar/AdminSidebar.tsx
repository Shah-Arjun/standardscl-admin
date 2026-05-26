"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Bell, ImageIcon, 
  X, LogOut, Settings 
} from "lucide-react";
import { useEffect, useState } from "react";

type User = {
  email: string;
  role: string;
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/notices", label: "Notices", icon: Bell },
  { href: "/gallery", label: "Gallery", icon: ImageIcon },
];

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 h-16 px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="Logo"
            width={36}
            height={36}
            className="rounded-md bg-white"
          />
          <span className="font-semibold text-white">SSBS Admin</span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                ? "bg-amber-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="mt-auto border-t border-gray-800 p-4 space-y-3">
          <div 
            onClick={() => router.push("/settings")}
            className="w-full flex items-center gap-3 hover:bg-gray-800 transition p-3 rounded-xl cursor-pointer group"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold uppercase">
              {user.email?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* Info */}
            <div className="min-w-0 text-left flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user.email}
              </p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>

            <Settings className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-400 bg-gray-800 hover:bg-gray-700 rounded-xl transition"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        © 2026 SSBS Admin
      </div>
    </div>
  );
}