import React, { useState } from 'react';
import { 
  Users, 
  BarChart3, 
  ShieldAlert, 
  DollarSign, 
  TrendingUp, 
  Award, 
  UserPlus, 
  Key, 
  UserX, 
  UserCheck, 
  RefreshCw, 
  Clock, 
  Database,
  CheckCircle2,
  FileText,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  CheckSquare,
  PieChart as PieIcon,
  Target,
  Activity,
  Plus,
  Zap,
  ArrowRightLeft,
  SlidersHorizontal,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import { User, Lead, AuditLog, CrmTask, LeadStage, LeadPriority, TaskPriority } from '../types';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  leads: Lead[];
  tasks: CrmTask[];
  auditLogs: AuditLog[];
  onAddUser: (user: Partial<User> & { password?: string }) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onAddTask: (taskData: Omit<CrmTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<CrmTask>) => void;
  onDeleteTask: (taskId: string) => void;
  onBulkDeleteTasks?: (taskIds: string[]) => void;
  onResetDatabase: () => void;
  onBulkReassignPipelinedLeads?: (
    targetUserId: string,
    options?: {
      leadIds?: string[];
      stage?: string;
      fromUserId?: string;
      pipelinedOnly?: boolean;
      customTargetName?: string;
    }
  ) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  users,
  leads,
  tasks,
  auditLogs,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onBulkDeleteTasks,
  onResetDatabase,
  onBulkReassignPipelinedLeads,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'employees' | 'tasks' | 'audit' | 'pipeline'>('analytics');

  // Task deletion and bulk selection states (Admin oversight)
  const [selectedAdminTaskIds, setSelectedAdminTaskIds] = useState<string[]>([]);
  const [adminTaskToDelete, setAdminTaskToDelete] = useState<CrmTask | null>(null);
  const [showAdminBulkDeleteTaskModal, setShowAdminBulkDeleteTaskModal] = useState<boolean>(false);

  // Pipeline 1-Click Reassignment State
  const nonAdminEmployee = users.find((u) => u.role !== 'admin');
  const [pipelineTargetUserId, setPipelineTargetUserId] = useState<string>(
    nonAdminEmployee?.id || users[0]?.id || ''
  );
  const [pipelineStageScope, setPipelineStageScope] = useState<string>('all_pipeline');
  const [pipelineFromUserId, setPipelineFromUserId] = useState<string>('all');
  const [isReassigningPipeline, setIsReassigningPipeline] = useState<boolean>(false);
  const [pipelineSuccessMessage, setPipelineSuccessMessage] = useState<string | null>(null);

  // Add User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'sales'>('sales');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Password visibility map for admin
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active leads calculation
  const activeLeads = leads.filter((l) => !l.deleted);
  const wonLeads = activeLeads.filter((l) => l.stage === 'won');
  const lostLeads = activeLeads.filter((l) => l.stage === 'lost');

  const totalPipelineValue = activeLeads
    .filter((l) => l.stage !== 'lost')
    .reduce((sum, l) => sum + (l.value || 0), 0);

  const totalWonRevenue = wonLeads.reduce((sum, l) => sum + (l.value || 0), 0);

  const closedCount = wonLeads.length + lostLeads.length;
  const winRate = closedCount > 0 ? Math.round((wonLeads.length / closedCount) * 100) : 0;
  const avgDealSize = activeLeads.length > 0 ? Math.round(totalPipelineValue / activeLeads.length) : 0;

  // Active pipelined leads calculation (excluding won and lost)
  const activePipelinedLeads = activeLeads.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
  const activePipelinedValue = activePipelinedLeads.reduce((sum, l) => sum + (l.value || 0), 0);

  // Filtered matching pipeline leads for Admin Dashboard 1-click reassignment
  const matchingPipelineLeads = activeLeads.filter((l) => {
    if (pipelineStageScope === 'all_pipeline') {
      if (l.stage === 'won' || l.stage === 'lost') return false;
    } else if (pipelineStageScope !== 'all') {
      if (l.stage !== pipelineStageScope) return false;
    }
    if (pipelineFromUserId !== 'all') {
      if (l.assignedTo !== pipelineFromUserId) return false;
    }
    return true;
  });
  const matchingPipelineValue = matchingPipelineLeads.reduce((sum, l) => sum + (l.value || 0), 0);

  const handleExecute1ClickPipelineReassign = async (targetId: string, customFromId?: string, customStage?: string) => {
    if (!onBulkReassignPipelinedLeads || !targetId) return;
    const targetUser = users.find((u) => u.id === targetId);
    if (!targetUser) return;

    setIsReassigningPipeline(true);
    try {
      const fromId = customFromId || (pipelineFromUserId !== 'all' ? pipelineFromUserId : undefined);
      const stage = customStage || (pipelineStageScope !== 'all_pipeline' && pipelineStageScope !== 'all' ? pipelineStageScope : undefined);
      const pipelinedOnly = customStage ? false : pipelineStageScope === 'all_pipeline';

      await onBulkReassignPipelinedLeads(targetId, {
        fromUserId: fromId,
        stage: stage,
        pipelinedOnly: pipelinedOnly,
        customTargetName: targetUser.name,
      });

      setPipelineSuccessMessage(`⚡ All targeted pipelined leads successfully reassigned to ${targetUser.name} in 1 click!`);
      setTimeout(() => setPipelineSuccessMessage(null), 5000);
    } finally {
      setIsReassigningPipeline(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyPassword = (text: string, userId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateEmployeeId = () => {
    const existingNums = users
      .map((u) => {
        const match = u.employeeId?.match(/EMP-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;
    return `EMP-${String(nextNum).padStart(3, '0')}`;
  };

  const generateSimplePassword = () => {
    const adjectives = ['swift', 'bright', 'prime', 'smart', 'rapid'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${adj}${num}`;
  };

  const handleOpenAddModal = () => {
    setNewEmployeeId(generateEmployeeId());
    setNewUsername('');
    setNewName('');
    setNewRole('sales');
    setNewPassword(generateSimplePassword());
    setNewEmail('');
    setShowAddUserModal(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) return;

    onAddUser({
      employeeId: newEmployeeId.trim() || generateEmployeeId(),
      username: newUsername.trim().toLowerCase(),
      name: newName.trim(),
      role: newRole,
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@localcrm.internal`,
      password: newPassword.trim(),
    });

    setShowAddUserModal(false);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPasswordValue.trim()) return;

    onUpdateUser(resetTargetUser.id, {
      passwordHash: newPasswordValue.trim(),
      rawPassword: newPasswordValue.trim(),
    });
    setResetTargetUser(null);
    setNewPasswordValue('');
  };

  // ===================== DATA FOR CHARTS =====================

  // 1. Pipeline Stage Breakdown
  const stagesOrder: { key: LeadStage; label: string }[] = [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'qualified', label: 'Qualified' },
    { key: 'proposal', label: 'Proposal' },
    { key: 'won', label: 'Won' },
    { key: 'lost', label: 'Lost' },
  ];

  const stageData = stagesOrder.map(({ key, label }) => {
    const stageLeads = activeLeads.filter((l) => l.stage === key);
    const totalVal = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
    return {
      stage: label,
      count: stageLeads.length,
      value: totalVal,
    };
  });

  // 2. Priority Distribution
  const priorityColors: Record<TaskPriority, string> = {
    urgent: '#f43f5e',
    high: '#f59e0b',
    medium: '#0ea5e9',
    low: '#64748b',
  };

  const priorityCounts: Record<TaskPriority, number> = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  activeLeads.forEach((l) => {
    if (priorityCounts[l.priority] !== undefined) {
      priorityCounts[l.priority]++;
    }
  });

  const priorityData = Object.entries(priorityCounts).map(([priority, count]) => ({
    name: priority.toUpperCase(),
    value: count,
    color: priorityColors[priority as LeadPriority],
  }));

  // 3. Sales Rep Comparative Performance Data
  const repPerformanceData = users.map((u) => {
    const repLeads = activeLeads.filter((l) => l.assignedTo === u.id);
    const activeValue = repLeads.filter((l) => l.stage !== 'lost').reduce((s, l) => s + (l.value || 0), 0);
    const wonValue = repLeads.filter((l) => l.stage === 'won').reduce((s, l) => s + (l.value || 0), 0);
    const wonCount = repLeads.filter((l) => l.stage === 'won').length;
    const repTasks = tasks.filter((t) => t.assignedTo === u.id);
    const completedTasks = repTasks.filter((t) => t.status === 'completed').length;

    return {
      name: u.name.split(' ')[0], // First name for chart axis
      fullName: u.name,
      employeeId: u.employeeId || u.username,
      totalDeals: repLeads.length,
      activeValue,
      wonValue,
      wonCount,
      tasksAssigned: repTasks.length,
      completedTasks,
    };
  });

  // 4. Regional & Location Breakdown
  const regionMap: Record<string, { count: number; value: number; cities: Set<string> }> = {};
  activeLeads.forEach((l) => {
    const reg = l.region || 'General Territory';
    const city = l.city || l.location || 'Not Specified';
    if (!regionMap[reg]) {
      regionMap[reg] = { count: 0, value: 0, cities: new Set() };
    }
    regionMap[reg].count++;
    regionMap[reg].value += l.value || 0;
    regionMap[reg].cities.add(city);
  });
  const regionalBreakdown = Object.entries(regionMap).map(([region, data]) => ({
    region,
    count: data.count,
    value: data.value,
    cityList: Array.from(data.cities).join(', '),
  }));

  return (
    <div id="admin-dashboard" className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Header with navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Admin Command Center</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Administrator View
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Detailed analytics, charts, employee credentials &amp; permissions, and task assignments
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            id="admin-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'analytics'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Charts &amp; Statistics
          </button>
          <button
            id="admin-tab-employees"
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'employees'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Employees &amp; Logins ({users.length})
          </button>
          <button
            id="admin-tab-tasks"
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'tasks'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            id="admin-tab-pipeline"
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-amber-500 text-neutral-950 shadow-xs'
                : 'text-amber-400 hover:text-amber-300 hover:bg-neutral-800/80'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>1-Click Reassign ({activePipelinedLeads.length})</span>
          </button>
          <button
            id="admin-tab-audit"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'audit'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DETAILED CHARTS & STATISTICAL DATA */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span>Active Pipeline Value</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(totalPipelineValue)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Across {activeLeads.filter((l) => l.stage !== 'lost').length} active deals
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span>Total Won Revenue</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">
                {formatCurrency(totalWonRevenue)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                {wonLeads.length} deals successfully closed
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span>Win Rate Ratio</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {winRate}%
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                {closedCount} deals concluded
              </div>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
                <span>Avg. Deal Size</span>
                <BarChart3 className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(avgDealSize)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                Per active pipeline lead
              </div>
            </div>
          </div>

          {/* Charts Row 1: Pipeline Stage Breakdown & Priority Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline Stage Bar Chart (2 cols) */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Pipeline Value by Stage</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Dollar volume distributed across progressive deal stages
                  </p>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  Total {activeLeads.length} Deals
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="stage" stroke="#737373" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#737373" 
                      fontSize={11} 
                      tickLine={false} 
                      tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#171717', 
                        borderColor: '#404040', 
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Value']}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution Pie Chart (1 col) */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <PieIcon className="w-4 h-4 text-sky-400" />
                  <span>Deal Priority Distribution</span>
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Breakdown of leads by urgency rating
                </p>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#171717', 
                          borderColor: '#404040', 
                          borderRadius: '12px',
                          color: '#ffffff',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend with counts */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-800 text-xs">
                {priorityData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-neutral-400 capitalize">{p.name.toLowerCase()}:</span>
                    <span className="text-white font-semibold">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Sales Team Performance Comparison */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Sales Rep Pipeline vs Won Revenue</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Side-by-side comparison of deal volume and closed revenue per employee
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repPerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#737373" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(v) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#171717', 
                      borderColor: '#404040', 
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                    formatter={(val: any, name: any) => [
                      formatCurrency(Number(val)), 
                      name === 'activeValue' ? 'Active Pipeline' : 'Won Revenue'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => (
                      <span className="text-xs text-neutral-300">
                        {value === 'activeValue' ? 'Active Pipeline ($)' : 'Won Revenue ($)'}
                      </span>
                    )}
                  />
                  <Bar dataKey="activeValue" fill="#0284c7" radius={[4, 4, 0, 0]} name="activeValue" />
                  <Bar dataKey="wonValue" fill="#10b981" radius={[4, 4, 0, 0]} name="wonValue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Statistical Breakdown Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Team Operational Metrics &amp; Task Completion</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Employee ID</th>
                    <th className="py-2.5 px-3">Deals Count</th>
                    <th className="py-2.5 px-3">Active Value</th>
                    <th className="py-2.5 px-3">Won Revenue</th>
                    <th className="py-2.5 px-3">Tasks Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-xs">
                  {repPerformanceData.map((rep) => (
                    <tr key={rep.employeeId} className="hover:bg-neutral-800/30 transition">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white">{rep.fullName}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">
                        {rep.employeeId}
                      </td>
                      <td className="py-3 px-3 text-neutral-300 font-medium">
                        {rep.totalDeals} deals
                      </td>
                      <td className="py-3 px-3 font-semibold text-neutral-200">
                        {formatCurrency(rep.activeValue)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        {formatCurrency(rep.wonValue)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-300 font-medium">
                            {rep.completedTasks} / {rep.tasksAssigned}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            ({rep.tasksAssigned > 0 ? Math.round((rep.completedTasks / rep.tasksAssigned) * 100) : 100}%)
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional & City Distribution */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Regional &amp; Location Breakdown</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Standardized CRM territory coverage across regions (e.g. Maharashtra) and active cities (e.g. Pune, Mumbai, Nagpur)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {regionalBreakdown.map((item) => (
                <div
                  key={item.region}
                  className="p-4 bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 rounded-xl space-y-2 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span className="font-bold text-white text-sm">{item.region}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                    <span>Active Leads: <strong className="text-white font-mono">{item.count}</strong></span>
                    <span className="text-[11px] text-neutral-500 truncate max-w-[140px]" title={item.cityList}>
                      📍 {item.cityList || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEES & LOGIN CREDENTIALS MANAGEMENT */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* 1-Click Pipeline Reassignment Quick Bar */}
          <div className="bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <span>1-Click Pipeline Lead Reassignment</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                    {activePipelinedLeads.length} leads • {formatCurrency(activePipelinedValue)}
                  </span>
                </div>
                <div className="text-neutral-400 text-xs mt-0.5">
                  Transfer all open pipeline deals to any employee in a single click
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pipelineTargetUserId}
                onChange={(e) => setPipelineTargetUserId(e.target.value)}
                className="px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    Assign to: {u.name} ({u.employeeId || u.username})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleExecute1ClickPipelineReassign(pipelineTargetUserId)}
                disabled={isReassigningPipeline || activePipelinedLeads.length === 0}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isReassigningPipeline ? 'Transferring...' : '1-Click Reassign All'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pipeline')}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition cursor-pointer"
              >
                Scope &amp; Filters
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Employee Roster &amp; Login Passwords</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Add or remove employees, manage Employee IDs, and view or reset passwords
              </p>
            </div>
            <button
              id="add-employee-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New Employee</span>
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-950/60">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Password (Admin View)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-xs">
                  {users.map((u) => {
                    const isRevealed = !!revealedPasswords[u.id];
                    const pwdDisplay = u.rawPassword || u.passwordHash || 'password123';
                    const isCurrentUser = u.id === currentUser.id;

                    return (
                      <tr key={u.id} className="hover:bg-neutral-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg ${u.avatarColor || 'bg-neutral-700'} flex items-center justify-center text-xs font-bold text-white uppercase`}
                            >
                              {u.name.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-400">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                          {u.employeeId || 'EMP-000'}
                        </td>

                        <td className="py-3 px-4 font-mono text-neutral-300 font-medium">
                          @{u.username}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrator' : 'Sales Person'}
                          </span>
                        </td>

                        {/* Admin Password View with Show/Hide & Copy */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 max-w-[200px]">
                            <span className="font-mono text-xs text-amber-300 flex-1 truncate">
                              {isRevealed ? pwdDisplay : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-neutral-400 hover:text-white p-0.5 rounded transition"
                              title={isRevealed ? 'Hide Password' : 'Show Password'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopyPassword(pwdDisplay, u.id)}
                              className="text-neutral-400 hover:text-emerald-400 p-0.5 rounded transition"
                              title="Copy Password"
                            >
                              {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {u.active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                              <UserX className="w-3.5 h-3.5" />
                              <span>Inactive</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setResetTargetUser(u);
                                setNewPasswordValue(u.rawPassword || u.passwordHash || '');
                              }}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                              title="Reset Employee Password"
                            >
                              <Key className="w-3 h-3 text-amber-400" />
                              <span>Change Pwd</span>
                            </button>

                            {!isCurrentUser && u.id !== 'user_admin' && (
                              <>
                                <button
                                  onClick={() => onUpdateUser(u.id, { active: !u.active })}
                                  className={`p-1.5 rounded-lg text-xs transition ${
                                    u.active
                                      ? 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-800'
                                      : 'text-emerald-400 hover:bg-emerald-500/10'
                                  }`}
                                  title={u.active ? 'Deactivate Employee' : 'Activate Employee'}
                                >
                                  {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to remove employee "${u.name}" (${u.employeeId})? This action cannot be undone.`)) {
                                      onDeleteUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-xs text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
                                  title="Remove Employee"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TASKS QUICK VIEW & ASSIGNMENT */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Employee Task Oversight</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Overview of all assigned duties, pending follow-ups, and completion statuses
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-mono text-emerald-400">
                {tasks.filter((t) => t.status === 'completed').length} / {tasks.length} Completed
              </div>
              <div className="flex items-center gap-1.5 pl-3 border-l border-neutral-800 text-xs">
                <span className="text-neutral-500 text-[11px]">Select:</span>
                <button
                  type="button"
                  onClick={() => setSelectedAdminTaskIds(tasks.map((t) => t.id))}
                  className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg transition cursor-pointer text-[11px]"
                >
                  All ({tasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdminTaskIds(tasks.filter((t) => t.status === 'completed').map((t) => t.id))}
                  className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 rounded-lg transition cursor-pointer text-[11px]"
                >
                  Completed
                </button>
                {selectedAdminTaskIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowAdminBulkDeleteTaskModal(true)}
                      className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg transition cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Delete ({selectedAdminTaskIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAdminTaskIds([])}
                      className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 rounded-lg transition cursor-pointer text-[11px]"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Admin Multi-Select Tasks Banner */}
          {selectedAdminTaskIds.length > 0 && (
            <div className="bg-neutral-900 border border-rose-500/40 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-white">
                  {selectedAdminTaskIds.length} {selectedAdminTaskIds.length === 1 ? 'Task' : 'Tasks'} Selected
                </span>
                <span className="text-xs text-neutral-400">
                  ({tasks.filter((t) => selectedAdminTaskIds.includes(t.id) && t.status === 'completed').length} completed, {tasks.filter((t) => selectedAdminTaskIds.includes(t.id) && t.status !== 'completed').length} pending)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAdminTaskIds([])}
                  className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-950 border border-neutral-800 rounded-xl transition cursor-pointer"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminBulkDeleteTaskModal(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bulk Delete Tasks ({selectedAdminTaskIds.length})</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => {
              const isSelected = selectedAdminTaskIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-rose-500/60 bg-rose-950/10 shadow-md ring-1 ring-rose-500/30'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedAdminTaskIds((prev) =>
                              prev.includes(task.id) ? prev.filter((id) => id !== task.id) : [...prev, task.id]
                            );
                          }}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-emerald-500 focus:ring-0 cursor-pointer shrink-0"
                          title={`Select task "${task.title}"`}
                        />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-neutral-800 text-neutral-300">
                          {task.priority}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${
                        task.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {task.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{task.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-2 mb-2">{task.description}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                    <div className="min-w-0 pr-2">
                      <span>Assigned to: <strong className="text-white">{task.assignedName}</strong></span>
                      <div className="font-mono text-[11px] text-neutral-500">Due: {task.dueDate}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminTaskToDelete(task)}
                      className="p-1.5 hover:text-rose-400 text-neutral-500 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                      title="Delete Task (Admin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white">System Security &amp; Activity Log</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Timestamped records of user logins, deal modifications, tasks, and sync events
              </p>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              {auditLogs.length} events logged
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-6 text-center">No logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        log.category === 'auth'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : log.category === 'sync'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : log.category === 'admin'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-neutral-300 font-medium">{log.details}</span>
                  </div>

                  <div className="flex items-center gap-3 text-neutral-500 text-[11px] shrink-0">
                    <span>by {log.userName}</span>
                    <span>•</span>
                    <span>
                      {new Date(log.timestamp).toLocaleDateString()}{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: 1-CLICK PIPELINE LEAD REASSIGNMENT COMMAND CENTER */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {pipelineSuccessMessage && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span className="font-semibold">{pipelineSuccessMessage}</span>
            </div>
          )}

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/15 via-neutral-900 to-neutral-900 border border-amber-500/30 p-6 rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>1-Click Pipeline Lead Reassignment</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Instantly transfer all open sales pipeline leads from one employee to another in a single click
                  </p>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 font-medium">All Active Pipeline Leads</div>
                <div className="text-xl font-bold text-white mt-1">
                  {activePipelinedLeads.length}{' '}
                  <span className="text-xs text-neutral-400 font-normal">deals</span>
                </div>
                <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                  {formatCurrency(activePipelinedValue)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 font-medium">Current Scope Matched</div>
                <div className="text-xl font-bold text-amber-300 mt-1">
                  {matchingPipelineLeads.length}{' '}
                  <span className="text-xs text-neutral-400 font-normal">deals ready</span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  {formatCurrency(matchingPipelineValue)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="text-[11px] text-neutral-400 font-medium">Destination Employee</div>
                <div className="text-xl font-bold text-white mt-1 truncate">
                  {users.find((u) => u.id === pipelineTargetUserId)?.name || 'Select below'}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  {users.find((u) => u.id === pipelineTargetUserId)?.employeeId || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Choose Target Employee */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>1. Select Destination Employee</span>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    (Click an employee to select them or click the 1-Click button)
                  </span>
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {users.map((u) => {
                const isSelected = pipelineTargetUserId === u.id;
                const employeeDeals = leads.filter((l) => !l.deleted && l.assignedTo === u.id);
                const employeePipelineDeals = employeeDeals.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
                const employeePipelineVal = employeePipelineDeals.reduce((s, l) => s + (l.value || 0), 0);

                return (
                  <div
                    key={u.id}
                    onClick={() => setPipelineTargetUserId(u.id)}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl ${
                            u.avatarColor || 'bg-neutral-700'
                          } flex items-center justify-center font-bold text-white text-xs`}
                        >
                          {u.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.id === currentUser.id && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {u.employeeId || u.username} • {u.role === 'admin' ? 'Admin' : 'Sales Rep'}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="p-1 rounded-lg bg-amber-400 text-neutral-950">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-2 border-t border-neutral-800/80">
                      <span>Currently holds:</span>
                      <span className="font-semibold text-neutral-200">
                        {employeePipelineDeals.length} pipeline ({formatCurrency(employeePipelineVal)})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPipelineTargetUserId(u.id);
                        handleExecute1ClickPipelineReassign(u.id);
                      }}
                      disabled={isReassigningPipeline || matchingPipelineLeads.length === 0}
                      className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>1-Click Assign All to {u.name.split(' ')[0]}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Reassignment Scope & Filters */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>2. Reassignment Scope &amp; Filters</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Pipeline Stage Scope
                </label>
                <select
                  value={pipelineStageScope}
                  onChange={(e) => setPipelineStageScope(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value="all_pipeline">
                    All Active Pipeline (New, Contacted, Qualified, Proposal) — {activePipelinedLeads.length} leads
                  </option>
                  <option value="all">
                    All Records (Including Won &amp; Lost Deals) — {activeLeads.length} leads
                  </option>
                  <option value="new">Only 'New' Stage Inquiries</option>
                  <option value="contacted">Only 'Contacted' Stage</option>
                  <option value="qualified">Only 'Qualified' Stage</option>
                  <option value="proposal">Only 'Proposal' Stage</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Current Assignee Filter
                </label>
                <select
                  value={pipelineFromUserId}
                  onChange={(e) => setPipelineFromUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                >
                  <option value="all">All Employees (Reassign regardless of current owner)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      Only leads currently assigned to: {u.name} ({u.employeeId || u.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Big Action CTA */}
            <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-neutral-400">
                Ready to execute transfer of{' '}
                <strong className="text-white">{matchingPipelineLeads.length} leads</strong> (
                <strong className="text-amber-300">{formatCurrency(matchingPipelineValue)}</strong>) to{' '}
                <strong className="text-emerald-400">
                  {users.find((u) => u.id === pipelineTargetUserId)?.name || 'Selected Employee'}
                </strong>
                .
              </div>

              <button
                type="button"
                onClick={() => handleExecute1ClickPipelineReassign(pipelineTargetUserId)}
                disabled={isReassigningPipeline || matchingPipelineLeads.length === 0}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-extrabold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wide"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>
                  {isReassigningPipeline
                    ? 'Processing 1-Click Reassignment...'
                    : `⚡ Reassign All ${matchingPipelineLeads.length} Leads in 1-Click`}
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: Live Preview of Leads to be Reassigned */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Preview of Matching Leads ({matchingPipelineLeads.length})
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  These records will immediately transfer to the destination employee upon 1-click execution
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                Total: {formatCurrency(matchingPipelineValue)}
              </span>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-neutral-950 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Contact Name</th>
                    <th className="py-2.5 px-4">Company</th>
                    <th className="py-2.5 px-4">Current Assignee</th>
                    <th className="py-2.5 px-4">Stage</th>
                    <th className="py-2.5 px-4 text-right">Deal Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {matchingPipelineLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500 italic">
                        No leads match current scope &amp; filter.
                      </td>
                    </tr>
                  ) : (
                    matchingPipelineLeads.map((l) => (
                      <tr key={l.id} className="hover:bg-neutral-800/30">
                        <td className="py-2.5 px-4 font-semibold text-white">{l.name}</td>
                        <td className="py-2.5 px-4 text-neutral-400">{l.company || '—'}</td>
                        <td className="py-2.5 px-4 text-neutral-300">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px]">
                            {l.assignedName || users.find((u) => u.id === l.assignedTo)?.name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] capitalize font-medium text-amber-300">
                            {l.stage}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-400">
                          {formatCurrency(l.value || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-neutral-400">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Central CRM Database • Production live persistence with multi-user sync and document preservation</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Active</span>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Add Employee Account</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Create an employee ID with a generated simple password for login
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-003"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="sales">Sales Person</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">User ID / Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. rahul"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-300">Generated Simple Password *</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateSimplePassword())}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Regenerate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. swift482"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-amber-300 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-mono font-bold"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  The employee can log in with this password and change it; you will still see it here.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul@localcrm.internal"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">Change Employee Password</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Enter a new password for <span className="text-white font-semibold">{resetTargetUser.name}</span> ({resetTargetUser.employeeId || resetTargetUser.username})
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">New Simple Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="New password..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-amber-300 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Task Delete Confirmation Modal */}
      {adminTaskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Delete Task</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete this task from the system? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Title:</span>
                <span className="font-bold text-white">{adminTaskToDelete.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Assigned To:</span>
                <span className="text-neutral-200">{adminTaskToDelete.assignedName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Due Date:</span>
                <span className="font-mono text-neutral-300">{adminTaskToDelete.dueDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Status:</span>
                <span className="capitalize text-neutral-200">{adminTaskToDelete.status.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdminTaskToDelete(null)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(adminTaskToDelete.id);
                  setSelectedAdminTaskIds((prev) => prev.filter((id) => id !== adminTaskToDelete.id));
                  setAdminTaskToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bulk Task Delete Confirmation Modal */}
      {showAdminBulkDeleteTaskModal && selectedAdminTaskIds.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  Bulk Delete {selectedAdminTaskIds.length} Tasks
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete these <strong className="text-rose-300">{selectedAdminTaskIds.length} tasks</strong>?
                </p>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-2xl p-3 space-y-2 divide-y divide-neutral-900">
              {tasks
                .filter((t) => selectedAdminTaskIds.includes(t.id))
                .slice(0, 10)
                .map((t) => (
                  <div key={t.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-white truncate">{t.title}</div>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {t.assignedName} • Due: {t.dueDate}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                        t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              {selectedAdminTaskIds.length > 10 && (
                <div className="pt-2 text-center text-neutral-400 text-xs italic">
                  + {selectedAdminTaskIds.length - 10} more tasks selected
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminBulkDeleteTaskModal(false)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onBulkDeleteTasks) {
                    onBulkDeleteTasks(selectedAdminTaskIds);
                  } else {
                    selectedAdminTaskIds.forEach((id) => onDeleteTask(id));
                  }
                  setSelectedAdminTaskIds([]);
                  setShowAdminBulkDeleteTaskModal(false);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Bulk Delete ({selectedAdminTaskIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
