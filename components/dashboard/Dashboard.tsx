//  admin dashboard


"use client";


import Link from "next/link";
import AdminSidebar from "../sidebar/AdminSidebar";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";



type User = {
    email: string;
    role: string;
};




function Dashboard({ children }: Readonly<{ children: React.ReactNode }>) {
    const [user, setUser] = useState<User | null>(null);
    const [open, setOpen] = useState(false);
    const pathname = usePathname();


    // fetch admin from db
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();

                // console.log("user", data.user);   //debug
                setUser(data.user);
            } catch {
                setUser(null);
            }
        };

        if (pathname !== "/login") {
            fetchUser();
        } else {
            setUser(null);
        }
    }, [pathname]);


    // logout user handler
    const handleLogout = async () => {
        await fetch("/api/logout", {
            method: "POST",
        });

        window.location.href = "/login";
    };

    // If we are on the login page, render children directly without the layout wrapping
    if (pathname === "/login") {
        return <>{children}</>;
    }




    return (
        <div className="flex h-screen bg-gray-100">
            {/* sidebar  */}
            <div className="hidden md:flex flex-col w-64 bg-gray-800">
                <div className="flex items-center justify-start h-16 bg-gray-900 gap-6 px-6">
                    <Image
                        src="/icon.png"
                        alt="Logo"
                        width={50}
                        height={50}
                        className="rounded-full bg-white object-contain"
                    />
                    <span className="text-white font-bold uppercase">SSBS</span>
                </div>
                <AdminSidebar />
            </div>



            {/* Main content  */}
            <div className="flex flex-col flex-1 overflow-y-auto">
                <div className="flex items-center justify-between h-16 bg-white border-b border-gray-200">
                    <div className="flex items-center px-4">
                        <input
                            className="mx-4 w-full border rounded-md px-4 py-2"
                            type="text"
                            placeholder="Search"
                        />
                    </div>



                    {/* user info */}
                    <div className="flex items-center justify-end h-16 bg-white border-b px-6">
                        {user && (
                            <div className="relative">
                                {/* Avatar Button */}
                                <button
                                    onClick={() => setOpen(!open)}
                                    className="flex items-center gap-4"
                                >
                                    {/* Info */}
                                    <div className="text-right hidden sm:block">
                                        <p className="text-md font-medium text-gray-800">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-gray-500">{user?.role}</p>
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-blue-600 border text-white flex items-center justify-center font-bold uppercase">
                                        {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
                                    </div>
                                </button>



                                {/* Dropdown and logout */}
                                {open && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-md z-50">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-4 text-md text-red-600 hover:bg-red-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

export default Dashboard;
