"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Camera,
  Plus,
  Loader2,
  ImageIcon,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import { InferSelectModel } from "drizzle-orm";
import { teachersTable } from "@/lib/db/schema";
import { addTeacher } from "@/app/actions/teacher";
import { uploadFileToCloudinary } from "@/lib/upload";

// ─── Types ────────────────────────────────────────────────────────────────────
type Teacher = InferSelectModel<typeof teachersTable>;

type FormData = {
  teacherName: string;
  gender: "" | "male" | "female" | "other";
  email: string;
  phone: string;
  address: string;
  employmentType: string;
  qualifications: string[];
  subjectsTeaches: string[];
  post: string[];
  experience: string;
};

type FormErrors = Partial<Record<keyof FormData | "photo", string>>;

const EMPTY_FORM: FormData = {
  teacherName: "",
  gender: "",
  email: "",
  phone: "",
  address: "",
  employmentType: "full-time",
  qualifications: [],
  subjectsTeaches: [],
  post: [],
  experience: "",
};

// ─── Styles (matching existing codebase) ──────────────────────────────────────
const inputCls =
  "w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white focus:border-transparent transition placeholder:text-gray-300";
const inputErrCls =
  "w-full px-4 py-2.5 text-sm text-gray-800 bg-red-50 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white focus:border-transparent transition placeholder:text-gray-400";
const selectCls =
  "w-full px-4 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white focus:border-transparent transition";
const selectErrCls =
  "w-full px-4 py-2.5 text-sm text-gray-800 bg-red-50 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white focus:border-transparent transition";




// ─── Label ────────────────────────────────────────────────────────────────────
function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}


// ─── FieldError ───────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">{msg}</p>;
}


// ─── Section ──────────────────────────────────────────────────────────────────
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
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}


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
      <Label>{label}</Label>
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


// ─── AddTeacherModal ──────────────────────────────────────────────────────────
interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacher: Teacher) => void;
}

export function AddTeacherModal({ isOpen, onClose, onSuccess }: AddTeacherModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  // ── Reset when modal closes ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setImageFile(null);
      setImagePreview("");
      setSubmitting(false);
      setSubmitError("");
    }
  }, [isOpen]);

  // ── Close on Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, submitting, onClose]);

  // ── Prevent body scroll ───────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ── Field setter ──────────────────────────────────────────────────────────
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Image selection ───────────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, photo: "Only image files are allowed" }));
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Image must be less than 15 MB" }));
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, photo: undefined }));

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };



  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FormErrors = {};

    // Only required validation
    if (!form.teacherName.trim()) {
      errs.teacherName = "Teacher name is required";
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };



  // ── Submit ────────────────────────────────────────────────────────────────
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setSubmitError("");

  if (!validate()) return;

  setSubmitting(true);

  try {
    let photo = null;
    let photoPublicId = null;

    if (imageFile) {
      // Direct client-side signed upload to Cloudinary
      const uploadRes = await uploadFileToCloudinary(imageFile, "teachers");
      photo = uploadRes.secure_url;
      photoPublicId = uploadRes.public_id;
    }

    const res = await addTeacher({
      teacherName: form.teacherName.trim(),
      gender: form.gender || null,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      employmentType: form.employmentType || "full-time",
      qualifications: form.qualifications,
      subjectsTeaches: form.subjectsTeaches,
      post: form.post,
      experience: form.experience ? Number(form.experience) : null,
      photo,
      photoPublicId,
    });

    if (res.success && res.teacher) {
      onSuccess(res.teacher);
      onClose();
    } else {
      setSubmitError(res.message || "Failed to add teacher");
    }
  } catch (err: any) {
    console.error("[ADD_TEACHER_MODAL_ERROR]", err);
    setSubmitError(err.message || "Failed to add teacher. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      {/* ── Modal ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white rounded-t-2xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <UserPlus className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Teacher</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the teacher's details below</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition disabled:opacity-40"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            <form id="add-teacher-form" onSubmit={handleSubmit} className="space-y-4">

              {/* ── Photo Upload ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <Label required>Teacher Photo</Label>
                <div className="flex items-start gap-5 mt-2">

                  {/* Avatar preview */}
                  <div className="relative shrink-0">
                    {imagePreview ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-amber-300 shadow">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-24 h-24 rounded-full flex items-center justify-center ring-2 shadow ${
                          errors.photo
                            ? "ring-red-300 bg-red-50"
                            : "ring-amber-200 bg-amber-50"
                        }`}
                      >
                        <User
                          className={`h-10 w-10 ${
                            errors.photo ? "text-red-300" : "text-amber-300"
                          }`}
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={submitting}
                      className="absolute -bottom-1 -right-1 p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 active:scale-95 transition shadow-md disabled:opacity-50"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Upload zone */}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={submitting}
                      className={`w-full border-2 border-dashed rounded-xl px-4 py-5 text-center transition hover:border-amber-400 hover:bg-amber-50/40 disabled:opacity-50 ${
                        errors.photo
                          ? "border-red-300 bg-red-50/30"
                          : "border-gray-200 bg-gray-50/60"
                      }`}
                    >
                      <ImageIcon
                        className={`h-6 w-6 mx-auto mb-2 ${
                          errors.photo ? "text-red-400" : "text-gray-300"
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          errors.photo ? "text-red-600" : "text-gray-600"
                        }`}
                      >
                        {imageFile ? imageFile.name : "Click to upload photo"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        PNG, JPG, WebP · Max 15 MB
                      </p>
                    </button>
                    <FieldError msg={errors.photo} />
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageSelect}
                  />
                </div>
              </div>

              {/* ── Personal Information ── */}
              <Section icon={User} title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <Label required>Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                      <input
                        type="text"
                        value={form.teacherName}
                        onChange={(e) => setField("teacherName", e.target.value)}
                        placeholder="Full name"
                        disabled={submitting}
                        className={(errors.teacherName ? inputErrCls : inputCls) + " pl-10"}
                      />
                    </div>
                    <FieldError msg={errors.teacherName} />
                  </div>

                  {/* Gender */}
                  <div>
                    <Label>Gender</Label>
                    <select
                      value={form.gender}
                      onChange={(e) => setField("gender", e.target.value as FormData["gender"])}
                      disabled={submitting}
                      className={selectCls}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                      <input
                        type="text"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="teacher@school.edu.np"
                        disabled={submitting}
                        className={(errors.email ? inputErrCls : inputCls) + " pl-10"}
                      />
                    </div>
                    <FieldError msg={errors.email} />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label>Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="+977 98XXXXXXXX"
                        disabled={submitting}
                        className={(errors.phone ? inputErrCls : inputCls) + " pl-10"}
                      />
                    </div>
                    <FieldError msg={errors.phone} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label>Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-300 pointer-events-none" />
                    <textarea
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="Street / Tole, City, District"
                      rows={2}
                      disabled={submitting}
                      className={inputCls + " pl-10 resize-none"}
                    />
                  </div>
                </div>
              </Section>

              {/* ── Employment Details ── */}
              <Section icon={Briefcase} title="Employment Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Employment Type */}
                  <div>
                    <Label required>Employment Type</Label>
                    <select
                      value={form.employmentType}
                      onChange={(e) => setField("employmentType", e.target.value)}
                      disabled={submitting}
                      className={errors.employmentType ? selectErrCls : selectCls}
                    >
                      <option value="">Select type</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                    </select>
                    <FieldError msg={errors.employmentType} />
                  </div>

                  {/* Experience */}
                  <div>
                    <Label>Years of Experience</Label>
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
                        disabled={submitting}
                        className={(errors.experience ? inputErrCls : inputCls) + " pl-10"}
                      />
                    </div>
                    <FieldError msg={errors.experience} />
                  </div>
                </div>

                <TagInput
                  label="Posts / Positions"
                  values={form.post}
                  onChange={(v) => setField("post", v)}
                  placeholder="e.g. Class Teacher, HOD…"
                />
              </Section>

              {/* ── Academic Information ── */}
              <Section icon={GraduationCap} title="Academic Information">
                <TagInput
                  label="Qualifications"
                  values={form.qualifications}
                  onChange={(v) => setField("qualifications", v)}
                  placeholder="e.g. M.Ed., B.Sc., Ph.D…"
                />
                <TagInput
                  label="Subjects Taught"
                  values={form.subjectsTeaches}
                  onChange={(v) => setField("subjectsTeaches", v)}
                  placeholder="e.g. Mathematics, Physics…"
                />
              </Section>

              {/* ── Submit error banner ── */}
              {submitError && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-xs">!</span>
                  {submitError}
                </div>
              )}
            </form>
          </div>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl flex items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-gray-400 hidden sm:block">
              Fields marked <span className="text-red-500 font-medium">*</span> are required
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => !submitting && onClose()}
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-teacher-form"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 transition shadow-sm"
              >
                {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add Teacher
                    </>
                  )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
