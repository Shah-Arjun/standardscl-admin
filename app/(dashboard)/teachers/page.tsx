"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  User,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { deleteTeacher, getAllTeachers } from "@/app/actions/teacher";
import { InferSelectModel } from "drizzle-orm";
import { teachersTable } from "@/lib/db/schema";
import Image from "next/image";
import { AddTeacherModal } from "@/components/dashboard/AddTeacherModal";


// ─── Types ────────────────────────────────────────────────────────────────────
type Teacher = InferSelectModel<typeof teachersTable>;


// ─── Constants ────────────────────────────────────────────────────────────────
const TEACHERS_PER_PAGE = 8;


// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastState = { type: "success" | "error"; msg: string } | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium border backdrop-blur-sm transition-all
        ${toast.type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
        }`}
    >
      {toast.type === "success"
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        : <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
      {toast.msg}
    </div>
  );
}


// ─── Sub-components ───────────────────────────────────────────────────────────
function EmptyState({ query, onAddClick }: { query: string; onAddClick: () => void }) {
  if (query) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="h-14 w-14 text-gray-300" />
        <p className="mt-4 text-lg font-medium text-gray-700">No results for "{query}"</p>
        <p className="text-gray-500 mt-1 text-sm">Try a different name, subject, or email</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <User className="h-16 w-16 text-gray-300" />
      <p className="mt-4 text-xl font-medium text-gray-700">No teachers yet</p>
      <p className="text-gray-500 mt-2 text-sm">Get started by adding your first teacher</p>
      <button
        onClick={onAddClick}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
      >
        <UserPlus className="h-4 w-4" />
        Add Teacher
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="h-14 w-14 text-red-400" />
      <p className="mt-4 text-lg font-medium text-gray-700">Failed to load teachers</p>
      <p className="text-gray-500 mt-1 text-sm">Something went wrong while fetching data</p>
      <button
        onClick={onRetry}
        className="mt-5 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}


// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  teacherName,
  teacherImg,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  teacherName?: string;
  teacherImg?: string | null;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-6 text-center">

          {/* IMAGE */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
            <Image
              src={teacherImg || "/default-avatar.png"}
              alt="Teacher"
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          </div>

          {/* TITLE */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Delete Teacher
          </h3>

          {/* TEXT */}
          <p className="text-gray-500 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">
              {teacherName || "this teacher"}
            </span>
            ?
          </p>

          {/* BUTTONS */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              Delete
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);


  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getAllTeachers();
      if (res.success) {
        setTeachers(res.teachers);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);


  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteTeacher(id);
      if (res.success) {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        setToast({ type: "success", msg: "Teacher deleted successfully" });
      } else {
        setToast({ type: "error", msg: "Failed to delete teacher" });
      }
    } catch {
      setToast({ type: "error", msg: "An error occurred while deleting" });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
    }
  };


  // ── Teacher added ──────────────────────────────────────────────────────────
  const handleTeacherAdded = useCallback((newTeacher: Teacher) => {
    setTeachers((prev) => [...prev, newTeacher]);
    setToast({ type: "success", msg: `${newTeacher.teacherName} added successfully!` });
  }, []);


  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);


  // Reset to page 0 whenever search query changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);


  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = searchQuery.trim()
    ? teachers.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.teacherName?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        (t.qualifications &&
          t.qualifications.some((qual) => qual.toLowerCase().includes(q)))
      );
    })
    : teachers;


  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / TEACHERS_PER_PAGE);
  const paginated = filtered.slice(
    currentPage * TEACHERS_PER_PAGE,
    (currentPage + 1) * TEACHERS_PER_PAGE
  );


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page-level toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleTeacherAdded}
      />

      <div className="p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Manage school teachers and staff
            </p>
          </div>

          {/* Right side: search + add button */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">

            {/* Total count */}
            {!loading && !error && (
              <div className="text-sm text-gray-500 whitespace-nowrap">
                Total:{" "}
                <span className="font-semibold text-gray-900">{teachers.length}</span>
              </div>
            )}

            {/* Search */}
            {!loading && !error && teachers.length > 0 && (
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, subject, email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                />
              </div>
            )}

            {/* Add Teacher button — always visible */}
            <button
              id="add-teacher-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 active:scale-95 transition shadow-sm whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Teacher</span>
            </button>
          </div>
        </div>


        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              <p className="mt-4 text-gray-500 text-sm">Loading teachers…</p>
            </div>
          ) : error ? (
            <ErrorState onRetry={fetchTeachers} />
          ) : filtered.length === 0 ? (
            <EmptyState
              query={searchQuery}
              onAddClick={() => setIsAddModalOpen(true)}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Name", "Qualifications", "Experience", "Contact", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((teacher, index) => (
                      <tr
                        key={teacher.id}
                        className="hover:bg-amber-50/40 transition-colors"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{teacher.teacherName}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {teacher.qualifications?.join(", ") || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {teacher.experience
                            ? `${Math.floor(Number(teacher.experience))} yrs+`
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {teacher.email && <div>{teacher.email}</div>}
                            {teacher.phone && (
                              <div className="text-gray-500">{teacher.phone}</div>
                            )}
                            {!teacher.email && !teacher.phone && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-x-6">
                          <Link
                            href={`/teachers/${teacher.id}`}
                            className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                          >
                            <SquarePen className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <DeleteConfirmationModal
                  isOpen={isDeleteDialogOpen}
                  teacherName={selectedTeacher?.teacherName}
                  teacherImg={selectedTeacher?.photo}
                  onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedTeacher(null);
                  }}
                  onConfirm={() => {
                    if (selectedTeacher) {
                      handleDelete(selectedTeacher.id);
                    }
                  }}
                />
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg disabled:opacity-40 hover:bg-white transition"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  <span className="text-sm text-gray-500">
                    Page{" "}
                    <span className="font-semibold text-gray-800">{currentPage + 1}</span>{" "}
                    of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg disabled:opacity-40 hover:bg-white transition"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Teachers;