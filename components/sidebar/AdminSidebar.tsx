"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Bell, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

type User = {
  email: string;
  role: string;
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teachers", label: "Teachers", icon: Users },
  { href: "/notices", label: "Notice", icon: Bell },
  { href: "/gallery", label: "Gallery", icon: ImageIcon },
];

export default function AdminSidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-800">
        <Image
          src="/icon.png"
          alt="Logo"
          width={36}
          height={36}
          className="rounded-md bg-white"
        />
        <span className="font-semibold text-white tracking-wide">
          SSBS Admin
        </span>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400"
                  }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="border-t border-gray-800 p-4 relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 w-full"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold uppercase">
              {user.email.charAt(0)}
            </div>

            {/* Info */}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white truncate max-w-[150px]">
                {user.email}
              </p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute bottom-16 left-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 rounded-lg"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        © 2026 SSBS Admin
      </div>
    </div>
  );
}