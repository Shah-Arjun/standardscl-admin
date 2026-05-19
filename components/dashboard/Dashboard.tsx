"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminSidebar from "../sidebar/AdminSidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);

    const closeSidebar = () => {
        setClosing(true);

        setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, 300);
    };

    if (pathname === "/login") {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-gray-50">

            {/* Mobile Topbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center px-4 z-50">
                <button
                    onClick={() => {
                        setOpen(true);
                        setClosing(false);
                    }}
                    className="p-2 rounded-md hover:bg-gray-100"
                >
                    <Menu className="h-5 w-5 text-gray-700" />
                </button>

                <span className="ml-3 font-semibold text-gray-800">SSBS Admin</span>
            </div>

            {/* Sidebar - Desktop */}
            <aside className="hidden md:block">
                <AdminSidebar />
            </aside>

            {/* Sidebar - Mobile Drawer */}
            <div className={`md:hidden fixed inset-0 z-50 flex pointer-events-none`}>

                {/* Overlay */}
                <div
                    onClick={closeSidebar}
                    className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${open && !closing ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
                />

                {/* Drawer */}
                <div
                    className={`relative w-72 h-full bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${open && !closing ? "translate-x-0" : "-translate-x-full"} pointer-events-auto`}
                >
                    <AdminSidebar onClose={closeSidebar} />
                </div>

            </div>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-y-auto md:ml-0 mt-14 md:mt-0">
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}