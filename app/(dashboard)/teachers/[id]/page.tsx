"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getTeacherById, updateTeacher } from "@/app/actions/teacher";
import { uploadFileToCloudinary } from "@/lib/upload";
import { InferSelectModel } from "drizzle-orm";
import { teachersTable } from "@/lib/db/schema";
import {
  ArrowLeft,
  Loader2,
  Save,
  Camera,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  BookOpen,
  BadgeCheck,
  Clock,
} from "lucide-react";


// ─── Types ────────────────────────────────────────────────────────────────────
type Teacher = InferSelectModel<typeof teachersTable>;
type FormState = Omit<Teacher, "experience"> & { experience: string };

function toFormState(t: Teacher): FormState {
  return { ...t, experience: t.experience != null ? String(t.experience) : "" };
}


// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastState = { type: "success" | "error"; msg: string } | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium border backdrop-blur-sm transition-all
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


// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <Icon className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}


// ─── Field ───────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white focus:border-transparent transition placeholder:text-gray-300";
const selectCls = "w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white focus:border-transparent transition";


// ─── TagInput ─────────────────────────────────────────────────────────────────
function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          className={inputCls + " flex-1"}
        />
        <button
          type="button"
          onClick={add}
          className="px-3.5 py-2.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full font-medium"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TeacherDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastState>(null);


  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getTeacherById(String(id));
        if (res.success && res.teacher) {
          setTeacher(res.teacher);
          setForm(toFormState(res.teacher));
          setPhoto(res.teacher.photo ?? "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);


  // ── Field setter ───────────────────────────────────────────────────────────
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));


  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !teacher) return;
    setSaving(true);
    try {
      let finalPhoto = photo;
      let finalPhotoPublicId = teacher.photoPublicId;

      if (imageFile) {
        // Direct client-side signed upload to Cloudinary
        const uploadRes = await uploadFileToCloudinary(imageFile, "teachers");
        finalPhoto = uploadRes.secure_url;
        finalPhotoPublicId = uploadRes.public_id;
      }

      const res = await updateTeacher(teacher.id, {
        ...form,
        experience: form.experience ? Number(form.experience) : null,
        photo: finalPhoto,
        photoPublicId: finalPhotoPublicId,
      });

      if (res.success && res.teacher) {
        setTeacher(res.teacher);
        setForm(toFormState(res.teacher));
        setPhoto(res.teacher.photo ?? "");
        setImageFile(null); // Reset local file state
        setToast({ type: "success", msg: "Changes saved successfully" });
      } else {
        setToast({ type: "error", msg: res.error ?? "Update failed" });
      }
    } catch (err: any) {
      setToast({ type: "error", msg: err.message || "An unexpected error occurred" });
    } finally {
      setSaving(false);
    }
  }


  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading teacher details…</p>
      </div>
    );
  }

  if (!form || !teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-medium text-gray-700">Teacher not found</p>
        <button onClick={() => router.back()} className="text-sm text-amber-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-5xl mx-auto px-4 space-y-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors border border-gray-400 px-4 py-2 rounded-lg bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Edit Teacher</h1>
            <p className="text-xs text-gray-400 mt-0.5">SSBS · ID {teacher.id}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Photo card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {photo ? (
                  <Image
                    src={photo}
                    alt={form.teacherName ?? "Teacher"}
                    width={88}
                    height={88}
                    className="w-[88px] h-[88px] rounded-full object-cover ring-2 ring-amber-200"
                  />
                ) : (
                  <div className="w-[88px] h-[88px] rounded-full bg-amber-50 ring-2 ring-amber-200 flex items-center justify-center">
                    <User className="h-10 w-10 text-amber-300" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 active:scale-95 transition shadow-md"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 15 * 1024 * 1024) {
                        setToast({ type: "error", msg: "Image must be less than 15 MB" });
                        return;
                      }
                      setImageFile(file);
                      setPhoto(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>

              {/* Info summary */}
              <div>
                <p className="font-semibold text-gray-900 text-lg leading-tight">
                  {form.teacherName || "—"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {form.subjectsTeaches?.join(", ") || "No subjects assigned"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.post?.map((p) => (
                    <span
                      key={p}
                      className="text-xs px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-medium"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Personal Info ── */}
          <Section icon={User} title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <input
                    required
                    value={form.teacherName ?? ""}
                    onChange={(e) => setField("teacherName", e.target.value)}
                    placeholder="Full name"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>

              <Field label="Gender">
                <select
                  value={form.gender ?? ""}
                  onChange={(e) => setField("gender", e.target.value as Teacher["gender"])}
                  className={selectCls}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="teacher@school.edu.np"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>

              <Field label="Phone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <input
                    type="tel"
                    value={form.phone ?? ""}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+977 98XXXXXXXX"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
            </div>

            <Field label="Address">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-300 pointer-events-none" />
                <textarea
                  value={form.address ?? ""}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Street / Tole, City, District"
                  rows={2}
                  className={inputCls + " pl-10 resize-none"}
                />
              </div>
            </Field>
          </Section>

          {/* ── Employment ── */}
          <Section icon={Briefcase} title="Employment Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Employment Type *">
                <select
                  required
                  value={form.employmentType ?? ""}
                  onChange={(e) => setField("employmentType", e.target.value)}
                  className={selectCls}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </Field>

              <Field label="Years of Experience">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={0.5}
                    value={form.experience}
                    onChange={(e) => setField("experience", e.target.value)}
                    placeholder="e.g. 5"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
            </div>

            <TagInput
              label="Posts / Positions"
              values={form.post ?? []}
              onChange={(v) => setField("post", v)}
              placeholder="e.g. Class Teacher, HOD…"
            />
          </Section>

          {/* ── Academic ── */}
          <Section icon={GraduationCap} title="Academic Information">
            <TagInput
              label="Qualifications"
              values={form.qualifications ?? []}
              onChange={(v) => setField("qualifications", v)}
              placeholder="e.g. M.Ed., B.Sc., Ph.D…"
            />

            <TagInput
              label="Subjects Taught"
              values={form.subjectsTeaches ?? []}
              onChange={(v) => setField("subjectsTeaches", v)}
              placeholder="e.g. Mathematics, Physics…"
            />
          </Section>

          {/* ── Meta (read-only) ── */}
          <Section icon={BadgeCheck} title="Record Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Created At">
                <p className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl">
                  {teacher.createdAt
                    ? new Date(teacher.createdAt).toLocaleDateString("en-NP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "—"}
                </p>
              </Field>
              <Field label="Last Updated">
                <p className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl">
                  {teacher.updatedAt
                    ? new Date(teacher.updatedAt).toLocaleDateString("en-NP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "—"}
                </p>
              </Field>
            </div>
          </Section>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-1 pb-6">
            <button
              type="button"
              onClick={() => {
                setForm(toFormState(teacher));
                setPhoto(teacher.photo ?? "");
              }}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition shadow-sm"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}