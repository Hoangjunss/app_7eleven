"use client";

import React, { useState, useEffect } from "react";
import { useUserProfile, useUpdateProfile, useChangePassword } from "@/hooks/useUser";
import { User, Lock, Save, Loader2, KeyRound } from "lucide-react";

export default function ProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!fullName.trim()) {
      setProfileMsg({ type: "error", text: "Họ và tên không được để trống." });
      return;
    }

    try {
      await updateProfileMutation.mutateAsync(fullName);
      setProfileMsg({ type: "success", text: "Cập nhật thông tin cá nhân thành công!" });
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Đã xảy ra lỗi khi cập nhật thông tin.",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: "error", text: "Vui lòng nhập đầy đủ thông tin mật khẩu." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới xác nhận không khớp." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới phải từ 6 ký tự trở lên." });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ oldPassword, newPassword });
      setPasswordMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Mật khẩu cũ không chính xác.",
      });
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#09090b] text-white">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-[#09090b] text-white min-h-screen max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#0C5CAB] to-blue-400 bg-clip-text text-transparent">
          Cài đặt tài khoản
        </h1>
        <p className="text-zinc-400 mt-1">Quản lý thông tin hồ sơ cá nhân và đổi mật khẩu bảo mật.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details Form */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-primary border-b border-white/10 pb-3">
            <User size={20} /> Thông tin cá nhân
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Địa chỉ Email (Đăng nhập)</label>
              <input
                type="text"
                disabled
                value={profile?.email || ""}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-500 cursor-not-allowed text-sm focus:outline-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Không thể thay đổi email đã đăng ký.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Nhập họ và tên"
              />
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  profileMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary hover:bg-primary/95 text-white font-medium text-sm transition-all disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu thay đổi
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-[#09090b]/40 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-400 border-b border-white/10 pb-3">
            <Lock size={20} /> Đổi mật khẩu
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Mật khẩu cũ</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                placeholder="Mật khẩu mới từ 6 ký tự"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                placeholder="Xác nhận lại mật khẩu mới"
              />
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm transition-all disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <KeyRound size={16} />
              )}
              Đổi mật khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
