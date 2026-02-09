'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  Save,
  CheckCircle2,
  XCircle,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// --- Schemas ---

const profileSchema = z.object({
  fullName: z.string().min(2, 'Ho ten phai co it nhat 2 ky tu'),
  phone: z
    .string()
    .regex(/^(0[3-9])\d{8}$/, 'So dien thoai khong hop le')
    .or(z.literal(''))
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui long nhap mat khau hien tai'),
    newPassword: z.string().min(6, 'Mat khau moi phai co it nhat 6 ky tu'),
    confirmNewPassword: z.string().min(1, 'Vui long xac nhan mat khau moi'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmNewPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

// --- Profile response type ---

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminProfilePage() {
  const { user, setUser } = useAuthStore();

  // Profile state
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Password state
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiClient.get<ProfileData>('/auth/me');
        setProfileData(data);
        resetProfile({
          fullName: data.fullName || '',
          phone: data.phone || '',
        });
      } catch {
        setProfileError('Khong the tai thong tin ho so');
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, [resetProfile]);

  // Update profile
  const onProfileSubmit = async (data: ProfileFormValues) => {
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const body: Record<string, string> = {};
      if (data.fullName) body.fullName = data.fullName;
      if (data.phone) body.phone = data.phone;

      await apiClient.patch('/auth/profile', body);

      // Refresh profile data
      const updated = await apiClient.get<ProfileData>('/auth/me');
      setProfileData(updated);

      // Update auth store
      if (user) {
        setUser({
          ...user,
          fullName: updated.fullName,
          avatar: updated.avatar,
        });
      }

      setProfileSuccess('Cap nhat ho so thanh cong');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Khong the cap nhat ho so';
      setProfileError(message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Change password
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');
    try {
      await apiClient.patch('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess('Doi mat khau thanh cong');
      resetPassword();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Khong the doi mat khau';
      setPasswordError(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Role display
  const roleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quan tri vien';
      case 'STAFF':
        return 'Nhan vien';
      default:
        return 'Khach hang';
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
        <span className="ml-2 text-sm text-neutral-500">
          Dang tai ho so...
        </span>
      </div>
    );
  }

  const avatarInitial =
    profileData?.fullName?.charAt(0)?.toUpperCase() ||
    profileData?.email?.charAt(0)?.toUpperCase() ||
    'A';

  return (
    <div className="space-y-6">
      {/* Profile Info & Edit Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-base font-heading font-semibold text-neutral-900 mb-6">
          Thong tin ho so
        </h2>

        {/* Avatar + Basic Info */}
        <div className="flex items-start gap-5 mb-6 pb-6 border-b border-neutral-100">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            {profileData?.avatar ? (
              <img
                src={profileData.avatar}
                alt={profileData.fullName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-primary-700 font-heading font-bold text-2xl">
                {avatarInitial}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-heading font-semibold text-neutral-900">
              {profileData?.fullName || 'Chua cap nhat'}
            </h3>
            <p className="text-sm text-neutral-500 mt-0.5">
              {profileData?.email}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                  profileData?.role === 'ADMIN'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-blue-50 text-blue-700'
                )}
              >
                <Shield className="w-3 h-3" />
                {roleLabel(profileData?.role || '')}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                  profileData?.emailVerified
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                )}
              >
                {profileData?.emailVerified
                  ? 'Email da xac minh'
                  : 'Email chua xac minh'}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {profileSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm mb-4">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {profileError}
          </div>
        )}

        {/* Edit Profile Form */}
        <form
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          className="space-y-4"
        >
          {/* Email (read-only) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Email
              </span>
            </label>
            <input
              id="email"
              type="email"
              value={profileData?.email || ''}
              readOnly
              className="w-full h-11 px-3 rounded-lg border border-neutral-300 bg-neutral-50 text-sm text-neutral-500 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-400 mt-1">
              Email khong the thay doi
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Ho va ten <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              id="fullName"
              type="text"
              {...registerProfile('fullName')}
              className={cn(
                'w-full h-11 px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700',
                profileErrors.fullName
                  ? 'border-red-400'
                  : 'border-neutral-300'
              )}
              placeholder="Nhap ho va ten"
            />
            {profileErrors.fullName && (
              <p className="text-xs text-red-500 mt-1">
                {profileErrors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                So dien thoai
              </span>
            </label>
            <input
              id="phone"
              type="text"
              {...registerProfile('phone')}
              className={cn(
                'w-full h-11 px-3 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700',
                profileErrors.phone ? 'border-red-400' : 'border-neutral-300'
              )}
              placeholder="0900 000 000"
            />
            {profileErrors.phone && (
              <p className="text-xs text-red-500 mt-1">
                {profileErrors.phone.message}
              </p>
            )}
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <button
              type="submit"
              disabled={profileSaving}
              className={cn(
                'inline-flex items-center gap-2 px-5 h-11 rounded-lg text-sm font-medium text-white transition-colors',
                'bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {profileSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {profileSaving ? 'Dang luu...' : 'Cap nhat ho so'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-base font-heading font-semibold text-neutral-900 mb-6">
          <span className="inline-flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Doi mat khau
          </span>
        </h2>

        {/* Feedback */}
        {passwordSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm mb-4">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {passwordError}
          </div>
        )}

        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className="space-y-4"
        >
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Mat khau hien tai <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                {...registerPassword('currentPassword')}
                className={cn(
                  'w-full h-11 px-3 pr-10 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700',
                  passwordErrors.currentPassword
                    ? 'border-red-400'
                    : 'border-neutral-300'
                )}
                placeholder="Nhap mat khau hien tai"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Mat khau moi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                {...registerPassword('newPassword')}
                className={cn(
                  'w-full h-11 px-3 pr-10 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700',
                  passwordErrors.newPassword
                    ? 'border-red-400'
                    : 'border-neutral-300'
                )}
                placeholder="Nhap mat khau moi (it nhat 6 ky tu)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordErrors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Xac nhan mat khau moi <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmNewPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerPassword('confirmNewPassword')}
                className={cn(
                  'w-full h-11 px-3 pr-10 rounded-lg border bg-white text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-primary-700',
                  passwordErrors.confirmNewPassword
                    ? 'border-red-400'
                    : 'border-neutral-300'
                )}
                placeholder="Nhap lai mat khau moi"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordErrors.confirmNewPassword && (
              <p className="text-xs text-red-500 mt-1">
                {passwordErrors.confirmNewPassword.message}
              </p>
            )}
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <button
              type="submit"
              disabled={passwordSaving}
              className={cn(
                'inline-flex items-center gap-2 px-5 h-11 rounded-lg text-sm font-medium text-white transition-colors',
                'bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {passwordSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {passwordSaving ? 'Dang doi...' : 'Doi mat khau'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-base font-heading font-semibold text-neutral-900 mb-4">
          Thong tin tai khoan
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
            <Shield className="w-5 h-5 text-primary-700 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500">Vai tro</p>
              <p className="text-sm font-medium text-neutral-900">
                {roleLabel(profileData?.role || '')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
            <Mail className="w-5 h-5 text-primary-700 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500">Trang thai email</p>
              <p
                className={cn(
                  'text-sm font-medium',
                  profileData?.emailVerified
                    ? 'text-green-700'
                    : 'text-amber-700'
                )}
              >
                {profileData?.emailVerified ? 'Da xac minh' : 'Chua xac minh'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
            <Calendar className="w-5 h-5 text-primary-700 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500">Thanh vien tu</p>
              <p className="text-sm font-medium text-neutral-900">
                {profileData?.createdAt
                  ? formatDate(profileData.createdAt)
                  : '--'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
            <User className="w-5 h-5 text-primary-700 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500">Ma tai khoan</p>
              <p className="text-sm font-medium text-neutral-900 font-mono">
                {profileData?.id
                  ? `${profileData.id.substring(0, 8)}...`
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
