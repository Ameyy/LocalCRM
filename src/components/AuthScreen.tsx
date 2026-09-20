import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Key, Lock, Laptop, Check, AlertCircle, Shield, Briefcase } from 'lucide-react';
import { User } from '../types';
import { getStoredUsers, saveSession, saveUsers, logAudit } from '../lib/storage';
import { verifyPasswordMatch } from '../lib/authCrypto';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'employee' | 'admin'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const users = getStoredUsers();
    const cleanUsername = username.trim().toLowerCase();
    const user = users.find(
      (u) =>
        (u.username.toLowerCase() === cleanUsername ||
          (u.employeeId && u.employeeId.toLowerCase() === cleanUsername) ||
          (u.email && u.email.toLowerCase() === cleanUsername))
    );

    if (!user) {
      setError(
        loginMode === 'admin'
          ? 'Admin account not found. Please check your Administrator ID.'
          : 'Employee User ID not found. Contact your Administrator to generate your credentials.'
      );
      return;
    }

    if (!user.active) {
      setError(`Account for ${user.name} is deactivated. Please contact Administrator Amey Kulkarni.`);
      return;
    }

    // Role-specific check if logging into admin tab
    if (loginMode === 'admin' && user.role !== 'admin') {
      setError('Access Denied: This User ID does not have Administrator privileges. Please use Employee Login.');
      return;
    }

    const storedHash = user.passwordHash || user.rawPassword;
    const isMatch = verifyPasswordMatch(password, storedHash);

    if (!isMatch) {
      setError('Incorrect password. Please verify your credentials.');
      return;
    }

    // Success - update lastLogin
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
    };
    const allUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    saveUsers(allUsers);
    saveSession(updatedUser);
    logAudit('USER_LOGIN', `Signed in to CRM (${updatedUser.role})`, updatedUser, 'auth');
    onLoginSuccess(updatedUser);
  };

  const handleQuickLogin = (role: 'admin' | 'employee') => {
    if (role === 'admin') {
      setLoginMode('admin');
      setUsername('admin');
      setPassword('admin123');
    } else {
      setLoginMode('employee');
      setUsername('EMP-002');
      setPassword('sales123');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-950">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${loginMode === 'admin' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`} />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-neutral-800/40 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative mb-6 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl border mb-3 shadow-inner transition-colors duration-300 ${
            loginMode === 'admin'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {loginMode === 'admin' ? <Shield className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Role-Based CRM</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Separated Admin &amp; Employee Access with End-to-End Data Isolation
          </p>
        </div>

        {/* Portal Role Switcher Tabs */}
        <div className="relative mb-6 grid grid-cols-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
          <button
            type="button"
            id="login-mode-admin-tab"
            onClick={() => {
              setLoginMode('admin');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              loginMode === 'admin'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>

          <button
            type="button"
            id="login-mode-employee-tab"
            onClick={() => {
              setLoginMode('employee');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
              loginMode === 'employee'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Employee Login</span>
          </button>
        </div>

        {/* Role Description Banner */}
        <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-2">
          {loginMode === 'admin' ? (
            <>
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Administrator:</strong> Full CRM control, employee roster, account creation, password resets, and progress monitoring.
              </span>
            </>
          ) : (
            <>
              <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Employee:</strong> Access strictly restricted to assigned leads, tasks, calls, personal progress, and profile.
              </span>
            </>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              {loginMode === 'admin' ? 'Admin ID / Username' : 'Employee User ID / Login'}
            </label>
            <div className="relative">
              <input
                id="login-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={loginMode === 'admin' ? 'admin or EMP-001' : 'e.g. EMP-002, EMP001 or sales'}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <UserCheck className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Password
              </label>
              {loginMode === 'employee' && (
                <span className="text-[11px] text-neutral-500">
                  Initial password given by Admin
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2 ${
              loginMode === 'admin'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
            }`}
          >
            <span>{loginMode === 'admin' ? 'Sign In as Administrator' : 'Sign In as Employee'}</span>
            <Check className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Fill Credential Badges */}
        <div className="mt-6 pt-5 border-t border-neutral-800">
          <p className="text-[11px] font-medium text-neutral-400 mb-2.5 text-center uppercase tracking-wider">
            Quick 1-Click Role Login
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="quick-fill-admin-btn"
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 text-left transition group"
            >
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Admin (Amey K.)</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-mono">EMP-001 • admin</p>
              <p className="text-[10px] text-neutral-500">Pass: admin123</p>
            </button>

            <button
              id="quick-fill-sales-btn"
              type="button"
              onClick={() => handleQuickLogin('employee')}
              className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 text-left transition group"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Employee (Sarah J.)</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-mono">EMP-002 • sales</p>
              <p className="text-[10px] text-neutral-500">Pass: sales123</p>
            </button>
          </div>
        </div>

        {/* Offline Badge Footer */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <Laptop className="w-3.5 h-3.5 text-neutral-400" />
          <span>Local Data Isolation &amp; Role-Based Security</span>
        </div>
      </div>
    </div>
  );
};
