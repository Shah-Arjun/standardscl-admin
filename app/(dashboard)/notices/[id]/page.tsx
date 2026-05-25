"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getNoticeById, updateNotice } from "@/app/actions/notice";
import { Notice } from "@/lib/types/notice";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText, 
  Tag
} from "lucide-react";
import { motion } from "framer-motion";

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

const publishers = ["Principal", "Exam Coordinator", "Vice Principal"];

export default function UpdateNoticePage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Notice["category"]>("General");
  const [postedBy, setPostedBy] = useState<Notice["postedBy"]>("Principal");

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchNotice = async () => {
      try {
        setLoading(true);
        const res = await getNoticeById(Number(id));

        if (!res.success || !res.data) {
          throw new Error(res.message || "Failed to fetch notice details");
        }

        const data = res.data;
        setNotice(data);
        setTitle(data.title);
        setContent(data.content);
        setCategory(data.category);
        setPostedBy(data.postedBy);
      } catch (err: any) {
        setNotification({ type: "error", message: err.message || "Failed to load notice details" });
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setNotification({ type: "error", message: "Title and content fields are required." });
      return;
    }

    try {
      setSaving(true);
      setNotification(null);

      const res = await updateNotice(Number(id), {
        title: title.trim(),
        content: content.trim(),
        category,
        postedBy,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to update notice");
      }

      setNotification({ type: "success", message: "Notice updated successfully!" });
      
      // Navigate back after a brief delay
      setTimeout(() => {
        router.push("/notices");
      }, 1500);

    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "An error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  const catStyle = categoryStyles[category] || categoryStyles.General;
  const authorStyle = postedByStyles[postedBy] || { bg: "bg-slate-100 text-slate-800" };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse text-sm">Retrieving notice details...</p>
      </div>
    );
  }

  if (!notice && notification?.type === "error") {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center border border-rose-100 mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Error Loading Notice</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{notification.message}</p>
        <button
          onClick={() => router.push("/notices")}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Go back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4 px-2 sm:px-6">
      
      {/* Header / Back Action */}
      <div className="flex items-center justify-between border-b border-slate-150 pb-5">
        <div className="space-y-1">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to notices
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Update Notice
          </h1>
        </div>

        <div className="hidden sm:block">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            ID: {id}
          </span>
        </div>
      </div>

      {/* Inline Alerts */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
              : "bg-rose-50 text-rose-800 border-rose-100"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </motion.div>
      )}

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Editor Form Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
            <span className="p-1.5 bg-slate-50 text-slate-500 rounded-lg">
              <FileText className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-slate-800">Notice Editor</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Notice Title</label>
              <input
                type="text"
                placeholder="e.g. Annual Sports Meet 2026 Registration"
                className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Content Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Notice Contents</label>
              <textarea
                placeholder="Write the full announcement text here..."
                rows={8}
                className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* Selectors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Notice["category"])}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Tag className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Publisher Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Posted By</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none"
                    value={postedBy}
                    onChange={(e) => setPostedBy(e.target.value as Notice["postedBy"])}
                  >
                    {publishers.map((pub) => (
                      <option key={pub} value={pub}>{pub}</option>
                    ))}
                  </select>
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Actions Button */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.push("/notices")}
                className="px-5 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                Discard
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-indigo-950 text-white shadow-lg hover:shadow-indigo-950/10 hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Notice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div className="flex items-center gap-2 px-1">
            <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">
              <Eye className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-slate-700 text-sm">Real-time Live Preview</h3>
          </div>

          {/* Render Preview Card */}
          <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden min-h-[350px] flex flex-col justify-between">
            {/* Background design glow */}
            <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4">
              {/* Header: Category Badge + Simulated School Board stamp */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                  {category}
                </span>

                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Broadcast Notice
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight leading-snug break-words">
                {title || "Untitled Notice"}
              </h2>

              {/* Body Content */}
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {content || "Announcement text draft will render here dynamically as you type in the editor..."}
              </p>
            </div>

            {/* Signature / Meta info */}
            <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 border border-slate-700">
                  {postedBy.charAt(0)}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-200">{postedBy}</h5>
                  <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">SSBS Authority</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                <Calendar className="h-3 w-3 text-slate-600" />
                {notice ? new Date(notice.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>

          </div>

          {/* Dashboard Preview Helper Info */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-slate-500 text-xs leading-relaxed">
            💡 <strong>Aesthetic Note:</strong> The preview card displays exactly how the notice appears on student and staff dashboards, rendering Markdown linebreaks and the official broadcast signatures dynamically.
          </div>
        </div>

      </div>

    </div>
  );
}