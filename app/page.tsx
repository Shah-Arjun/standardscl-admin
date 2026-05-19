"use client";

import { useEffect, useState } from "react";
import { getAllTeachers } from "./actions/teacher";
import { teachersTable } from "@/lib/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { Users, UserCheck, Bell, Image as ImageIcon } from "lucide-react";

type Teacher = InferSelectModel<typeof teachersTable>;

export default function TeacherStats() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tRes, nRes, gRes] = await Promise.all([
          getAllTeachers(),
          fetch("/api/notices").then((r) => r.json()),
          fetch("/api/gallery").then((r) => r.json()),
        ]);

        setTeachers(tRes.teachers || []);
        setNotices(nRes || []);
        setGallery(gRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const stats = [
    {
      title: "Total Teachers",
      value: teachers.length,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Teachers",
      value: teachers.length,
      icon: UserCheck,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Notices",
      value: notices.length,
      icon: Bell,
      color: "bg-pink-50 text-pink-600",
    },
    {
      title: "Gallery",
      value: gallery.length,
      icon: ImageIcon,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item, i) => {
        const Icon = item.icon;

        return (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <h2 className="text-2xl font-semibold text-gray-900 mt-1">
                  {item.value}
                </h2>
              </div>

              <div
                className={`p-2.5 rounded-lg ${item.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* soft underline */}
            <div className="mt-4 h-1 w-12 bg-gray-100 rounded-full" />
          </div>
        );
      })}
    </div>
  );
}