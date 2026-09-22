import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Key, Lock, Laptop, Check, AlertCircle, Shield, Briefcase, Loader2 } from 'lucide-react';
import { User } from '../types';
import { saveSession, runLegacyCrmStorageCleanup } from '../lib/storage';
import { loginUserApi } from '../lib/api';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'employee' | 'admin'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Clean any legacy stale CRM data keys from previous versions
    runLegacyCrmStorageCleanup();

    try {
      const result = await loginUserApi(username, password, loginMode);

      if (!result.success || !result.user) {
        setError(result.message || 'Unable to authenticate. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      const authenticatedUser = result.user;
      saveSession(authenticatedUser);
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to the CRM database. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Krew Mesh CRM</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Enterprise Operations Platform • Universal Leads Visibility
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
                <strong className="text-neutral-200">Administrator:</strong> Full system control, employee roster, lead assignment, document importing, and database management.
              </span>
            </>
          ) : (
            <>
              <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Employee:</strong> View all company leads with editing access to lead and task details.
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
                placeholder={loginMode === 'admin' ? 'Enter Administrator ID or username' : 'Enter Employee ID or username'}
                required
                autoComplete="username"
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
            </div>
            <div className="relative">
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer ${
              loginMode === 'admin'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with Supabase...</span>
              </>
            ) : (
              <>
                <span>{loginMode === 'admin' ? 'Sign In as Administrator' : 'Sign In as Employee'}</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Badge Footer */}
        <div className="mt-6 pt-5 border-t border-neutral-800 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
          <Laptop className="w-3.5 h-3.5 text-neutral-400" />
          <span>Krew Mesh CRM • Role-Governed Access &amp; Secure Authentication</span>
        </div>
      </div>
    </div>
  );
};
