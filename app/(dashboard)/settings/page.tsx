"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAdminProfile, updateAdminProfile } from "@/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mail, Lock, ShieldCheck, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [initialEmail, setInitialEmail] = useState("");

  const [form, setForm] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // Fetch current profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await getAdminProfile();
        if (profile) {
          setForm(prev => ({ ...prev, email: profile.email }));
          setInitialEmail(profile.email);
        }
      } catch (error) {
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailInput = form.email.trim();
    if (!emailInput) {
      toast.error("Email address cannot be empty.");
      return;
    }

    const isEmailChanged = emailInput.toLowerCase() !== initialEmail.toLowerCase();
    const isPasswordChanged = !!form.newPassword;

    if (!isEmailChanged && !isPasswordChanged) {
      toast.info("No changes were made to your profile credentials.");
      return;
    }

    if ((isEmailChanged || isPasswordChanged) && !form.currentPassword) {
      toast.error("Your current password is required to authorize changes.");
      return;
    }

    let toastId;
    try {
      setSaving(true);
      toastId = toast.loading("Updating your secure profile credentials...");

      const result = await updateAdminProfile({
        email: emailInput,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });

      if (result.success) {
        // Construct a descriptive, user-friendly success toast
        let successMessage = "Profile updated successfully!";
        if (isEmailChanged && isPasswordChanged) {
          successMessage = `Email changed to ${emailInput} & password updated! Syncing session...`;
        } else if (isEmailChanged) {
          successMessage = `Email successfully changed to ${emailInput}! Syncing session...`;
        } else if (isPasswordChanged) {
          successMessage = "Password successfully updated!";
        }

        toast.success(successMessage, { id: toastId });
        
        // Update initial email state
        setInitialEmail(emailInput);

        // Clear password inputs after success
        setForm(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
        }));

        // Refresh the page if email changed to synchronize session across the layout (e.g. Sidebar)
        if (isEmailChanged) {
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        toast.error(result.error || "Failed to update profile", { id: toastId });
      }
    } catch (error) {
      if (toastId) {
        toast.error("An unexpected error occurred. Please try again.", { id: toastId });
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Loading secure profile credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-8">
      {/* Main Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 p-6 md:p-8 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Update Credentials</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              For security reasons, your current password is required before making any changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  Administrator Email Address
                </Label>
                <div className="relative rounded-2xl group transition-all">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="pl-11 pr-4 py-6 border-slate-200 focus-visible:ring-indigo-600 rounded-2xl text-slate-900 font-medium text-sm transition-all focus:border-indigo-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="admin@school.com"
                    required
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                    Security Verification
                  </span>
                </div>
              </div>

              {/* Current Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="currentPassword" className="text-xs font-semibold text-slate-700">
                    Current Password
                  </Label>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Required</span>
                </div>
                <div className="relative rounded-2xl group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={handleChange}
                    className="pl-11 pr-11 py-6 border-slate-200 focus-visible:ring-indigo-600 rounded-2xl text-slate-900 font-medium text-sm transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Enter current password to verify"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-700">
                    New Password
                  </Label>
                  <span className="text-[10px] font-medium text-slate-400">Optional</span>
                </div>
                <div className="relative rounded-2xl group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={form.newPassword}
                    onChange={handleChange}
                    className="pl-11 pr-11 py-6 border-slate-200 focus-visible:ring-indigo-600 rounded-2xl text-slate-900 font-medium text-sm transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Leave blank to keep unchanged"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium pl-1">
                  Must be at least 6 characters if you wish to change it.
                </p>
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full py-6 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 text-white transition-all duration-300"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Secure Credentials...</span>
                    </div>
                  ) : (
                    "Save Credentials"
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}