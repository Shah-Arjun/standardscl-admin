"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  getGalleryImages, 
  createGalleryImage, 
  updateGalleryImage, 
  deleteGalleryImage 
} from "@/app/actions/gallery";
import { GalleryImage } from "@/lib/types/gallery";
import { uploadFileToCloudinary } from "@/lib/upload";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Image as ImageIcon,
  SlidersHorizontal,
  Maximize2,
  Play,
  Film,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categoryStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  School: { bg: "bg-blue-50/80", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500" },
  Teachers: { bg: "bg-indigo-50/80", text: "text-indigo-700", border: "border-indigo-100", dot: "bg-indigo-500" },
  Students: { bg: "bg-emerald-50/80", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
  Events: { bg: "bg-pink-50/80", text: "text-pink-700", border: "border-pink-100", dot: "bg-pink-500" },
  Sports: { bg: "bg-purple-50/80", text: "text-purple-700", border: "border-purple-100", dot: "bg-purple-500" },
  Arts: { bg: "bg-rose-50/80", text: "text-rose-700", border: "border-rose-100", dot: "bg-rose-500" },
  Activities: { bg: "bg-cyan-50/80", text: "text-cyan-700", border: "border-cyan-100", dot: "bg-cyan-500" },
  "Educational Tour": { bg: "bg-amber-50/80", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500" },
  Memories: { bg: "bg-violet-50/80", text: "text-violet-700", border: "border-violet-100", dot: "bg-violet-500" },
};

const categories = [
  "All",
  "School",
  "Teachers",
  "Students",
  "Events",
  "Sports",
  "Arts",
  "Activities",
  "Educational Tour",
  "Memories",
];

const formCategories = [
  "School",
  "Teachers",
  "Students",
  "Events",
  "Sports",
  "Arts",
  "Activities",
  "Educational Tour",
  "Memories",
];

const isVideoFile = (url: string) => {
  if (!url) return false;
  return (
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov") ||
    url.endsWith(".m4v") ||
    url.endsWith(".avi") ||
    url.includes("/video/upload/")
  );
};

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editImage, setEditImage] = useState<GalleryImage | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<GalleryImage["category"]>("School");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFilePreview, setFormFilePreview] = useState<string | null>(null);

  // Status message
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images
  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await getGalleryImages();
      setImages(res.data || []);
      setFilteredImages(res.data || []);
    } catch (error) {
      console.error("Failed to load gallery images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Filter & Search logic
  useEffect(() => {
    let result = images;

    if (selectedCategory !== "All") {
      result = result.filter((img) => img.category === selectedCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter((img) => img.title.toLowerCase().includes(q));
    }

    setFilteredImages(result);
  }, [searchQuery, selectedCategory, images]);

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      if (!isImg && !isVid) {
        setNotification({ type: "error", message: "Only image and video files are allowed." });
        return;
      }

      if (isImg && file.size > 15 * 1024 * 1024) {
        setNotification({ type: "error", message: "Image files must be less than 15 MB." });
        return;
      }

      if (isVid && file.size > 50 * 1024 * 1024) {
        setNotification({ type: "error", message: "Video files must be less than 50 MB." });
        return;
      }

      setFormFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormFilePreview(previewUrl);
      setNotification(null);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormTitle("");
    setFormCategory("School");
    setFormFile(null);
    setFormFilePreview(null);
    setNotification(null);
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (img: GalleryImage) => {
    setEditImage(img);
    setFormTitle(img.title);
    setFormCategory(img.category);
    setFormFile(null);
    setFormFilePreview(img.url); // Use existing URL as preview
    setNotification(null);
  };

  // Close Modals
  const closeModals = () => {
    setIsAddOpen(false);
    setEditImage(null);
    setDeleteId(null);
    // Revoke object URL to prevent memory leaks
    if (formFilePreview && !formFilePreview.startsWith("http")) {
      URL.revokeObjectURL(formFilePreview);
    }
    setFormFilePreview(null);
    setFormFile(null);
  };

  // Add (Create) Action
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formFile) {
      setNotification({ type: "error", message: "All fields are required, including a media file." });
      return;
    }

    try {
      setActionLoading(true);
      setNotification(null);

      // Direct client-side signed upload to Cloudinary
      const uploadRes = await uploadFileToCloudinary(formFile, "ssbs_gallery");

      const res = await createGalleryImage({
        title: formTitle.trim(),
        category: formCategory,
        url: uploadRes.secure_url,
        photoPublicId: uploadRes.public_id,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to add item to gallery");
      }

      setImages((prev) => [res.data!, ...prev]);
      setNotification({ type: "success", message: "Media uploaded and published successfully!" });
      setTimeout(() => {
        closeModals();
      }, 1000);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to upload media asset." });
    } finally {
      setActionLoading(false);
    }
  };

  // Update Action
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editImage) return;

    if (!formTitle.trim()) {
      setNotification({ type: "error", message: "Title field is required." });
      return;
    }

    try {
      setActionLoading(true);
      setNotification(null);

      let url = undefined;
      let photoPublicId = undefined;

      if (formFile) {
        // Direct client-side signed upload to Cloudinary
        const uploadRes = await uploadFileToCloudinary(formFile, "ssbs_gallery");
        url = uploadRes.secure_url;
        photoPublicId = uploadRes.public_id;
      }

      const res = await updateGalleryImage(editImage.id, {
        title: formTitle.trim(),
        category: formCategory,
        url,
        photoPublicId,
      });

      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to update gallery item");
      }

      setImages((prev) => prev.map((img) => (img.id === editImage.id ? res.data! : img)));
      setNotification({ type: "success", message: "Gallery item updated successfully!" });
      setTimeout(() => {
        closeModals();
      }, 1000);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to update item." });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setActionLoading(true);
      const res = await deleteGalleryImage(deleteId);
      if (res.success) {
        setImages((prev) => prev.filter((img) => img.id !== deleteId));
        setDeleteId(null);
      } else {
        alert(res.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Delete gallery error:", error);
      alert("An error occurred while deleting the media.");
    } finally {
      setActionLoading(false);
    }
  };

  // Lightbox Navigation Functions
  const handlePrev = useCallback(() => {
    if (!lightboxImage || filteredImages.length <= 1) return;
    const currentIndex = filteredImages.findIndex((img) => img.id === lightboxImage.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
    setLightboxImage(filteredImages[prevIndex]);
  }, [lightboxImage, filteredImages]);

  const handleNext = useCallback(() => {
    if (!lightboxImage || filteredImages.length <= 1) return;
    const currentIndex = filteredImages.findIndex((img) => img.id === lightboxImage.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % filteredImages.length;
    setLightboxImage(filteredImages[nextIndex]);
  }, [lightboxImage, filteredImages]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setLightboxImage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage, handlePrev, handleNext]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4 px-2 sm:px-6">
      
      {/* Header and Add Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/20">
              <Film className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold tracking-wider uppercase text-indigo-300">Visual Assets</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
            School Gallery
          </h1>
          <p className="text-slate-300 max-w-xl text-sm sm:text-base">
            Upload, update, and manage official images and videos. All uploads sync directly to the public website showcase.
          </p>
        </div>

        <div className="z-10 flex self-start md:self-center">
          <button
            onClick={openAddModal}
            className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <Plus className="h-5 w-5 stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
            Add Media
          </button>
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
              placeholder="Search gallery by title keyword..."
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

      {/* Gallery Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse text-sm">Retrieving media assets...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white border border-slate-100 rounded-3xl max-w-full px-6"
        >
          <div className="mx-auto w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 mb-4">
            <ImageIcon className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No media found</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
            We couldn&apos;t find any gallery items matching your criteria. Try uploading a new image or video.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img, index) => {
              const catStyle = categoryStyles[img.category] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100", dot: "bg-slate-500" };
              const isVideo = isVideoFile(img.url);

              return (
                <motion.div
                  key={`gallery-card-${img.id}`}
                  layoutId={`gallery-card-${img.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-150 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
                >
                  {/* Card Media Area with Overlays */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    {isVideo ? (
                      <div className="w-full h-full relative">
                        <video
                          src={img.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        {/* Play Indicator Icon */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2.5 bg-black/55 backdrop-blur-[2px] rounded-full border border-white/20 text-white shadow-md">
                          <Play className="h-4.5 w-4.5 fill-white stroke-none" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={img.url}
                        alt={img.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    )}

                    {/* Action buttons overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setLightboxImage(img)}
                        className="p-3 bg-white/90 hover:bg-white text-slate-800 rounded-full hover:scale-110 transition-all shadow-md cursor-pointer"
                        title="Zoom / View Media"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(img)}
                        className="p-3 bg-white/90 hover:bg-white text-indigo-600 rounded-full hover:scale-110 transition-all shadow-md cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(img.id)}
                        className="p-3 bg-white/90 hover:bg-white text-rose-600 rounded-full hover:scale-110 transition-all shadow-md cursor-pointer"
                        title="Delete Media"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                          {img.category}
                        </span>
                        
                        {isVideo && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/50">
                            <Film className="h-3 w-3 text-slate-400" />
                            Video
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {img.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-semibold">
                      <Calendar className="h-3 w-3 text-slate-300" />
                      <span>
                        {new Date(img.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {(isAddOpen || editImage) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    {isAddOpen ? <Upload className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {isAddOpen ? "Add New Media" : "Update Gallery Item"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAddOpen ? "Upload a photo or video to publish on the website gallery." : `Modify details for asset ID: ${editImage?.id}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModals}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={isAddOpen ? handleAddSubmit : handleUpdateSubmit} className="p-6 space-y-5 flex-1">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter short descriptive title..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as GalleryImage["category"])}
                  >
                    {formCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Image/Video Upload Dropzone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Media File</label>
                  
                  {formFilePreview ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50 flex items-center justify-center">
                      {formFile?.type.startsWith("video/") || isVideoFile(formFilePreview) ? (
                        <video
                          src={formFilePreview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={formFilePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFormFile(null);
                            setFormFilePreview(null);
                          }}
                          className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition-colors space-y-2 group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      
                      <div className="w-10 h-10 bg-slate-100 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-100 text-slate-500 group-hover:text-indigo-600 rounded-xl flex items-center justify-center mx-auto transition-colors">
                        <Upload className="h-5 w-5" />
                      </div>
                      
                      <div>
                        <p className="text-xs font-bold text-slate-700">Click to Upload Image or Video</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Supports Images up to 15MB, Videos up to 50MB.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-start gap-3 border text-xs font-medium ${
                      notification.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                        : "bg-rose-50 text-rose-800 border-rose-100"
                    }`}
                  >
                    {notification.type === "success" ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4.5 w-4.5 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <span>{notification.message}</span>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={closeModals}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Discard
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-indigo-950/10 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : isAddOpen ? (
                      <>
                        <Plus className="h-4.5 w-4.5 stroke-[3px]" />
                        Publish
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4" />
                        Update Details
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Zoom Modal with Navigation Controls */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-[2px] flex flex-col justify-between z-50 p-4 select-none">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between text-white p-2">
              <span className="text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                Category: {lightboxImage.category}
              </span>

              <button
                onClick={() => setLightboxImage(null)}
                className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Media View with Floating Next/Prev Arrow Buttons */}
            <div className="flex-1 flex items-center justify-center p-2 sm:p-6 max-h-[80vh] relative group/arrow">
              
              {/* Prev Button */}
              {filteredImages.length > 1 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-black/40 hover:bg-black/60 border border-white/10 text-white rounded-full hover:scale-105 transition-all shadow-lg cursor-pointer z-10"
                  title="Previous Media"
                >
                  <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
                </button>
              )}

              {/* Main Media Node */}
              {isVideoFile(lightboxImage.url) ? (
                <video
                  src={lightboxImage.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-2xl shadow-2xl select-none outline-none"
                />
              ) : (
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
                />
              )}

              {/* Next Button */}
              {filteredImages.length > 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-black/40 hover:bg-black/60 border border-white/10 text-white rounded-full hover:scale-105 transition-all shadow-lg cursor-pointer z-10"
                  title="Next Media"
                >
                  <ChevronRight className="h-5 w-5 stroke-[2.5]" />
                </button>
              )}

            </div>

            {/* Bottom Caption with Counter indicator */}
            <div className="text-center text-white pb-6 space-y-1.5 max-w-xl mx-auto px-4">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">
                {lightboxImage.title}
              </h3>
              
              <div className="flex items-center justify-center gap-3">
                <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                  Uploaded: {new Date(lightboxImage.createdAt).toLocaleDateString()}
                </p>
                {filteredImages.length > 1 && (
                  <span className="text-2xs font-bold text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                    {filteredImages.findIndex((img) => img.id === lightboxImage.id) + 1} / {filteredImages.length}
                  </span>
                )}
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

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
                <AlertCircle className="h-6 w-6 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Delete Gallery Media?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to delete this media? It will be removed from Cloudinary storage and the public website permanently.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 text-xs font-bold rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? (
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