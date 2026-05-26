"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Users, UserCheck, Bell, Image as ImageIcon, 
  Film, Plus 
} from "lucide-react";

import { getAllTeachers } from "./actions/teacher";
import { getAllNotices } from "@/app/actions/notice";
import { getGalleryImages } from "@/app/actions/gallery";
import { teachersTable } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Teacher = InferSelectModel<typeof teachersTable>;

export default function Dashboard() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const quickActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tRes, nRes, gRes] = await Promise.all([
          getAllTeachers(),
          getAllNotices(),
          getGalleryImages(),
        ]);
        setTeachers(tRes.teachers || []);
        setNotices(nRes.data || []);
        setGallery(gRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const scrollToQuickActions = () => {
    quickActionsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const stats = [
    {
      title: "Total Teachers",
      value: teachers.length,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
    },
    {
      title: "Active Teachers",
      value: teachers.length,
      icon: UserCheck,
      color: "from-emerald-500 to-teal-500",
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    },
    {
      title: "Notices",
      value: notices.length,
      icon: Bell,
      color: "from-pink-500 to-rose-500",
      bg: "bg-gradient-to-br from-pink-50 to-rose-50",
    },
    {
      title: "Gallery Items",
      value: gallery.length,
      icon: ImageIcon,
      color: "from-violet-500 to-purple-500",
      bg: "bg-gradient-to-br from-violet-50 to-purple-50",
    },
  ];

  const quickActions = [
    {
      title: "Create New Notice",
      href: "/notices",
      icon: Bell,
    },
    {
      title: "Add New Teacher",
      href: "/teachers",
      icon: Users,
    },
    {
      title: "Upload New Gallery Images",
      href: "/gallery",
      icon: ImageIcon,
    },
    // {
    //   title: "Manage Homepage Banner",
    //   href: "/banner",           // Change this if your route is different
    //   icon: Film,
    // },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-40 rounded-3xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(at_top_right,#4f46e510_0%,transparent_50%)]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md">
              <Film className="w-5 h-5" />
              <span className="text-sm font-medium tracking-widest uppercase">Website Content Management</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
              Welcome Back, <span className="bg-gradient-to-r from-indigo-300 to-white bg-clip-text text-transparent">Admin</span>
            </h1>
            
            <p className="text-slate-300 text-lg max-w-md">
              Keep up with the latest announcements and school activities
            </p>
          </div>

          <button 
            onClick={scrollToQuickActions}
            className="flex items-center gap-3 bg-white text-slate-900 px-6 py-3.5 rounded-2xl font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-lg group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Add New Content
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className={`${stat.bg} border border-gray-100 rounded-3xl p-6 group hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <h3 className="text-4xl font-bold text-gray-900 mt-3 tracking-tighter">
                    {stat.value}
                  </h3>
                </div>

                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              {/* <div className="mt-6 flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Updated just now</span>
              </div> */}
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div ref={quickActionsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 scroll-mt-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <span>Recent Activity</span>
            <div className="h-px flex-1 bg-gray-100" />
          </h2>
          <p className="text-gray-500 text-center py-12">
            Recent activity feed coming soon...
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          
          <div className="space-y-3 mt-auto">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className="w-full text-left px-5 py-4 rounded-2xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-primary" />
                    </div>
                    <span className="font-medium">{action.title}</span>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}