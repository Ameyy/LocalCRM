import React, { useState } from 'react';
import { 
  User, 
  Key, 
  Mail, 
  Check, 
  AlertCircle, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Building,
  Briefcase,
  CheckSquare,
  LogOut
} from 'lucide-react';
import { User as UserType } from '../types';
import { hashPassword, verifyPasswordMatch } from '../lib/authCrypto';

interface ProfileModalProps {
  currentUser: UserType;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updates: { name: string; email?: string; phone?: string; password?: string }) => void;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSaveProfile,
  onLogout,
}) => {
  const isEmployee = currentUser.role !== 'admin';
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a valid display name');
      return;
    }

    let updatedPassword: string | undefined = undefined;

    if (newPassword.trim() || confirmPassword.trim()) {
      if (newPassword.length < 4) {
        setError('New password must be at least 4 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match. Please verify your confirmation password.');
        return;
      }

      // If user has an existing password and is changing it, verify current password
      const storedHash = currentUser.passwordHash || currentUser.rawPassword;
      if (storedHash && !currentUser.requiresPasswordReset) {
        if (!currentPasswordInput) {
          setError('Please enter your current password to authorize this password change.');
          return;
        }
        if (!verifyPasswordMatch(currentPasswordInput, storedHash)) {
          setError('Current password is incorrect. Please try again.');
          return;
        }
      }

      updatedPassword = newPassword.trim();
    }

    onSaveProfile({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      password: updatedPassword,
    });

    setSavedSuccess(true);
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-800 relative">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl ${currentUser.avatarColor || 'bg-neutral-700'} flex items-center justify-center text-base font-bold text-white uppercase shadow-inner`}
            >
              {name.slice(0, 2) || currentUser.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isEmployee ? 'My Employee Profile' : 'Administrator Profile'}
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isEmployee 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                }`}>
                  {isEmployee ? 'Employee' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isEmployee 
                  ? 'Your personal employee details and secure password management'
                  : 'Administrative master credentials and system configuration'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Temporary password alert banner */}
        {currentUser.requiresPasswordReset && (
          <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Action Required:</span> Your account was issued a temporary password by the Administrator. Please change it to a confidential password below.
            </div>
          </div>
        )}

        {/* Access Boundary Notice for Employee */}
        {isEmployee ? (
          <div className="mt-4 p-3 bg-neutral-950/80 border border-neutral-800 rounded-2xl flex items-start gap-2.5 text-xs text-neutral-400">
            <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-neutral-200">Employee Account Boundary:</span>{' '}
              You can view your employee profile, update contact information, and change your password. Employee account creation, roster management, deletion, and CRM administration are managed strictly by Administrator Amey Kulkarni.
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-semibold text-amber-200">System Administrator:</span>{' '}
              Employee accounts, role permissions, and company configuration are controlled via the Admin Command Center tab.
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">Profile and password successfully saved!</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 relative">
          {/* Employee Details Grid */}
          <div className="bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800 space-y-3">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Employee Information</span>
              <span className="text-emerald-400 font-mono font-bold">
                {currentUser.employeeId || (isEmployee ? 'EMP-002' : 'EMP-001')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5">User ID / Username</span>
                <span className="font-mono font-semibold text-neutral-200">@{currentUser.username}</span>
              </div>
              <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5">Role</span>
                <span className="font-semibold text-neutral-200 capitalize">{currentUser.role === 'admin' ? 'Administrator' : 'Employee'}</span>
              </div>
              <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                  <Building className="w-3 h-3 text-neutral-400" />
                  <span>Department</span>
                </span>
                <span className="font-semibold text-neutral-200">{currentUser.department || 'Sales & Inquiries'}</span>
              </div>
              <div className="bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-neutral-400" />
                  <span>Responsibilities</span>
                </span>
                <span className="font-semibold text-neutral-200">{currentUser.designation || 'Sales Representative'}</span>
              </div>
            </div>

            {/* Permitted Sections for Employee */}
            {isEmployee && currentUser.permissions && (
              <div className="pt-2 border-t border-neutral-800/80">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Permitted CRM Sections
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.permissions.canViewLeads && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      ✓ My Leads
                    </span>
                  )}
                  {currentUser.permissions.canCreateLeads && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      ✓ Add Leads
                    </span>
                  )}
                  {currentUser.permissions.canViewTasks && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      ✓ My Tasks
                    </span>
                  )}
                  {currentUser.permissions.canViewFollowUps && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      ✓ Follow-ups
                    </span>
                  )}
                  {currentUser.permissions.canViewProgress && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      ✓ My Progress
                    </span>
                  )}
                  {currentUser.permissions.canExportData && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      ✓ Export Data
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Display Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 transition font-medium"
            />
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 010-0000"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Password Change Box */}
          <div className="pt-3 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Change Your Password</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            {!currentUser.requiresPasswordReset && (
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Current Password (required to change password)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-600 focus:outline-hidden focus:border-emerald-500 transition font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-amber-300 placeholder-neutral-600 focus:outline-hidden focus:border-amber-500 transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-amber-300 placeholder-neutral-600 focus:outline-hidden focus:border-amber-500 transition font-mono font-bold"
                />
              </div>
            </div>

            {newPassword && confirmPassword && (
              <div className="flex items-center gap-1.5 text-[11px]">
                {newPassword === confirmPassword ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> Passwords match
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-medium">
                    <X className="w-3 h-3" /> Passwords do not match
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons with Logout */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t border-neutral-800">
            {onLogout ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
