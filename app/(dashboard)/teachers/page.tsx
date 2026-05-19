"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, User, Search, AlertCircle, ChevronLeft, ChevronRight, ExternalLink, SquarePen, Delete, Trash, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteTeacher, getAllTeachers } from "@/app/actions/teacher";
import { InferSelectModel } from "drizzle-orm";
import { teachersTable } from "@/lib/db/schema";
import Image from "next/image";
import { strict } from "assert";


// ─── Types ────────────────────────────────────────────────────────────────────
type Teacher = InferSelectModel<typeof teachersTable>;


// ─── Constants ────────────────────────────────────────────────────────────────
const TEACHERS_PER_PAGE = 8;


// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const isActive = !status || status === "Active";
  return (
    <span
      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
    >
      {status || "Active"}
    </span>
  );
}

function EmptyState({ query }: { query: string }) {
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
      <Link
        href="/teachers/add"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
      >
        Add Teacher
      </Link>
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



  //handle delete
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteTeacher(id);
      if (res.success) {
        fetchTeachers();
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };



  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);


  // Reset to page 0 whenever search or teacher list changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, teachers]);



  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = searchQuery.trim()
    ? teachers.filter((t) => {
      const q = searchQuery.toLowerCase();

      return (
        t.teacherName?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        (t.qualifications &&
          t.qualifications.some((qual) =>
            qual.toLowerCase().includes(q)
          ))
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage school teachers and staff
          </p>
        </div>


        {/* Search */}
        {!loading && !error && teachers.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

            <input
              type="text"
              placeholder="Search by name, subject, email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            />
          </div>
        )}

        {/* Total */}
        {!loading && !error && (
          <div className="text-lg text-gray-500 sm:mr-4">
            Total:{" "}
            <span className="font-semibold text-gray-900">
              {teachers.length}
            </span>
          </div>
        )}
      </div>



      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <p className="mt-4 text-gray-500 text-sm">Loading teachers…</p>
          </div>
        ) : error ? (
          <ErrorState onRetry={fetchTeachers} />
        ) : filtered.length === 0 ? (
          <EmptyState query={searchQuery} />
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
                        {teacher.qualifications || "—"}
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
                          onClick={() => { setSelectedTeacher(teacher); setIsDeleteDialogOpen(true); }}
                          className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>


              {/*  */}
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
  );
}

export default Teachers;