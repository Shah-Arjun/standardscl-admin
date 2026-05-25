"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllNotices, deleteNotice } from "@/app/actions/notice";
import { Notice } from "@/lib/types/notice";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  AlertTriangle,
  X,
  SlidersHorizontal,
  BellRing
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categoryStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Admissions: { bg: "bg-emerald-50/80", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
  Sports: { bg: "bg-purple-50/80", text: "text-purple-700", border: "border-purple-100", dot: "bg-purple-500" },
  Events: { bg: "bg-pink-50/80", text: "text-pink-700", border: "border-pink-100", dot: "bg-pink-500" },
  Academic: { bg: "bg-blue-50/80", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500" },
  Meeting: { bg: "bg-indigo-50/80", text: "text-indigo-700", border: "border-indigo-100", dot: "bg-indigo-500" },
  Holiday: { bg: "bg-amber-50/80", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500" },
  News: { bg: "bg-cyan-50/80", text: "text-cyan-700", border: "border-cyan-100", dot: "bg-cyan-500" },
  Exam: { bg: "bg-rose-50/80", text: "text-rose-700", border: "border-rose-100", dot: "bg-rose-500" },
  Result: { bg: "bg-violet-50/80", text: "text-violet-700", border: "border-violet-100", dot: "bg-violet-500" },
  General: { bg: "bg-slate-50/80", text: "text-slate-700", border: "border-slate-100", dot: "bg-slate-500" },
};

const postedByStyles: Record<string, { bg: string; text: string }> = {
  Principal: { bg: "bg-indigo-100", text: "text-indigo-800" },
  "Exam Coordinator": { bg: "bg-amber-100", text: "text-amber-800" },
  "Vice Principal": { bg: "bg-sky-100", text: "text-sky-800" },
};

const categories = [
  "All",
  "Admissions",
  "Sports",
  "Events",
  "Academic",
  "Meeting",
  "Holiday",
  "News",
  "Exam",
  "Result",
  "General",
];

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Fetch notices
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await getAllNotices();
      const data = res.data || [];
      // newest first
      const sorted = [...data].reverse();
      setNotices(sorted);
      setFilteredNotices(sorted);
    } catch (error) {
      console.error("Failed to load notices", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = notices;

    if (selectedCategory !== "All") {
      result = result.filter((n) => n.category === selectedCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.postedBy.toLowerCase().includes(q)
      );
    }

    setFilteredNotices(result);
  }, [searchQuery, selectedCategory, notices]);

  // Delete notice
  const handleDelete = async () => {
    if (!deleteId) return;
    setLoadingDelete(true);

    try {
      const res = await deleteNotice(deleteId);
      if (res.success) {
        setNotices((prev) => prev.filter((n) => n.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(res.message || "Failed to delete notice");
      }
    } catch (error) {
      console.error("Failed to delete notice:", error);
      alert("An error occurred while deleting the notice.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4 px-2 sm:px-6">
      
      {/* Header and Add Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/20">
              <BellRing className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold tracking-wider uppercase text-indigo-300">Management Panel</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
            School Notices
          </h1>
          <p className="text-slate-300 max-w-xl text-sm sm:text-base">
            Create, update, and manage official notices broadcasted to the student and faculty dashboards.
          </p>
        </div>

        <div className="z-10 flex self-start md:self-center">
          <Link
            href="/notices/create"
            className="group flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg hover:shadow-orange-500/20 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="h-5 w-5 stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
            Add New Notice
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, contents, or author..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Category Filter Title */}
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Category:</span>
          </div>
        </div>

        {/* Categories List Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm scale-102"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notices View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse text-sm">Retrieving notices database...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white border border-slate-100 rounded-3xl max-w-full px-6"
        >
          <div className="mx-auto w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 mb-4">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No notices found</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
            We couldn&apos;t find any notices matching your filters or search query. Try resetting filters or adding a new notice.
          </p>
          {(searchQuery || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Notice Info</th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Author</th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Posted Date</th>
                    <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredNotices.map((notice, index) => {
                      const catStyle = categoryStyles[notice.category] || categoryStyles.General;
                      const authorStyle = postedByStyles[notice.postedBy] || { bg: "bg-slate-100 text-slate-800" };
                      
                      return (
                        <motion.tr
                          key={notice.id}
                          layoutId={`notice-row-${notice.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="hover:bg-slate-50/40 transition-colors group"
                        >
                          <td className="p-5 max-w-md">
                            <div className="space-y-1">
                              <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {notice.title}
                              </h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {notice.content}
                              </p>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                              {notice.category}
                            </span>
                          </td>
                          <td className="p-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${authorStyle.bg} ${authorStyle.text}`}>
                              <User className="h-3 w-3" />
                              {notice.postedBy}
                            </span>
                          </td>
                          <td className="p-5 text-xs text-slate-400 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-300" />
                              {new Date(notice.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/notices/${notice.id}`}
                                className="inline-flex items-center gap-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Update
                              </Link>
                              <button
                                onClick={() => setDeleteId(notice.id)}
                                className="inline-flex items-center gap-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-rose-500/5 hover:-translate-y-0.5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Grid Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            <AnimatePresence mode="popLayout">
              {filteredNotices.map((notice, index) => {
                const catStyle = categoryStyles[notice.category] || categoryStyles.General;
                const authorStyle = postedByStyles[notice.postedBy] || { bg: "bg-slate-100 text-slate-800" };
                
                return (
                  <motion.div
                    key={`notice-card-${notice.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="bg-white rounded-3xl border border-slate-150 p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                          {notice.category}
                        </span>
                        <h4 className="font-bold text-slate-800 line-clamp-1">
                          {notice.title}
                        </h4>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-semibold ${authorStyle.bg} ${authorStyle.text} shrink-0`}>
                        {notice.postedBy}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {notice.content}
                    </p>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-2xs">
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3 text-slate-300" />
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/notices/${notice.id}`}
                          className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold"
                        >
                          <Edit3 className="h-3 w-3" />
                          Update
                        </Link>
                        <button
                          onClick={() => setDeleteId(notice.id)}
                          className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Confirm Delete Popup Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5"
            >
              <div className="mx-auto w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Delete Notice?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to delete this notice? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={loadingDelete}
                  className="flex-1 py-3 px-4 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={loadingDelete}
                  className="flex-1 py-3 px-4 text-xs font-bold rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  {loadingDelete ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}