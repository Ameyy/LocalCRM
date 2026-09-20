import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Table as TableIcon, 
  BarChart3, 
  UploadCloud, 
  LogOut, 
  Download, 
  Bell,
  ChevronDown,
  UserCheck,
  User as UserIcon,
  CheckSquare,
  Edit,
  Sparkles
} from 'lucide-react';
import { User } from '../types';
import { usePWAInstall } from './usePWAInstall';

interface NavbarProps {
  currentUser: User;
  allUsers: User[];
  currentTab: 'table' | 'notifications' | 'tasks' | 'admin';
  unreadNotificationsCount: number;
  openTasksCount?: number;
  onSelectTab: (tab: 'table' | 'notifications' | 'tasks' | 'admin') => void;
  onOpenImporter: () => void;
  onOpenProfile: () => void;
  onSwitchUser: (user: User) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  currentTab,
  unreadNotificationsCount,
  openTasksCount = 0,
  onSelectTab,
  onOpenImporter,
  onOpenProfile,
  onSwitchUser,
  onLogout,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Offline badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('table')}>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white tracking-tight">Local CRM</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Offline
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Central Sync • Amey Kulkarni CRM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-neutral-950/60 p-1 rounded-xl border border-neutral-800">
            <button
              id="nav-tab-table"
              onClick={() => onSelectTab('table')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                currentTab === 'table'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Fixed Table</span>
            </button>

            {/* Tasks Tab */}
            <button
              id="nav-tab-tasks"
              onClick={() => onSelectTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer relative ${
                currentTab === 'tasks'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks</span>
              {openTasksCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-500 text-white">
                  {openTasksCount}
                </span>
              )}
            </button>

            {/* Notifications Tab */}
            <button
              id="nav-tab-notifications"
              onClick={() => onSelectTab('notifications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer relative ${
                currentTab === 'notifications'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {unreadNotificationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {currentUser.role === 'admin' && (
              <button
                id="nav-tab-admin"
                onClick={() => onSelectTab('admin')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-amber-400/70 hover:text-amber-300'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Primary Import Button */}
            <button
              id="nav-import-doc-btn"
              onClick={onOpenImporter}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition shrink-0 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Import Document</span>
            </button>

            {/* PWA Install Button if available */}
            {isInstallable && (
              <button
                id="install-pwa-button"
                onClick={install}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Install</span>
              </button>
            )}

            {/* Fast Role / Account Switcher & Logout */}
            <div className="relative flex items-center gap-1.5 pl-2 border-l border-neutral-800">
              <button
                id="user-account-switcher-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-neutral-800/80 transition cursor-pointer"
                title="Account menu"
              >
                <div
                  className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || 'bg-neutral-700'} flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner`}
                >
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </div>
                  <div className="text-[10px] text-neutral-400 capitalize">
                    {currentUser.role === 'admin' ? '👑 Admin' : '🎯 Sales Person'} • {currentUser.employeeId || currentUser.username}
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-neutral-800 mb-1">
                    <div className="text-xs font-semibold text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">ID: {currentUser.employeeId || currentUser.username}</div>
                  </div>

                  {/* Edit My Profile Option */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-emerald-300 hover:bg-neutral-800 hover:text-white transition font-medium"
                    >
                      <Edit className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentUser.role === 'admin' ? 'Edit Admin Profile & Pwd' : 'My Profile & Change Password'}</span>
                    </button>
                  </div>

                  {/* Switch Active Session - strictly restricted to Admin */}
                  {currentUser.role === 'admin' ? (
                    <>
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider border-t border-neutral-800 mt-1 mb-1 flex items-center justify-between">
                        <span>Switch Session (Admin Only)</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Admin</span>
                      </div>
                      <div className="space-y-1">
                        {allUsers.map((u) => {
                          const isCurrent = u.id === currentUser.id;
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                onSwitchUser(u);
                                setIsUserMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-neutral-800/90 text-white font-semibold'
                                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-md ${u.avatarColor || 'bg-neutral-700'} flex items-center justify-center text-[10px] text-white font-bold uppercase`}
                                >
                                  {u.name.slice(0, 2)}
                                </div>
                                <div>
                                  <div>{u.name}</div>
                                  <div className="text-[10px] text-neutral-500 capitalize">
                                    {u.role === 'admin' ? 'Admin' : 'Sales'} • {u.employeeId || u.username}
                                  </div>
                                </div>
                              </div>
                              {isCurrent && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="p-2.5 my-1 bg-neutral-950/70 border border-neutral-800/80 rounded-xl text-[11px] text-neutral-400">
                      <div className="font-semibold text-neutral-300 flex items-center gap-1 mb-0.5">
                        <span>Employee Limited Access</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-neutral-500">
                        Admin dashboard &amp; employee account controls are managed exclusively in the Admin section.
                      </p>
                    </div>
                  )}
                  <div className="border-t border-neutral-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out to Login Screen</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                id="user-logout-btn"
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/80 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

