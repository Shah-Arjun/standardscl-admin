"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "../sidebar/AdminSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // bypass layout for login page
    if (pathname === "/login") {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="hidden md:block">
                <AdminSidebar />
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Page Content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}