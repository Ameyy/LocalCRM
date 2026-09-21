import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight, 
  Plus, 
  Edit3, 
  User as UserIcon, 
  ShieldCheck, 
  FileText,
  Briefcase,
  Building,
  Target,
  Sparkles,
  MapPin
} from 'lucide-react';
import { User, Lead, CrmTask, AuditLog, NoteReviewEntry } from '../types';
import { AddNoteReviewModal } from './AddNoteReviewModal';

interface EmployeeDashboardProps {
  currentUser: User;
  leads: Lead[];
  tasks: CrmTask[];
  auditLogs: AuditLog[];
  onUpdateLead: (lead: Lead) => void;
  onUpdateTask: (taskId: string, updates: Partial<CrmTask>) => void;
  onNavigateToTab: (tab: 'table' | 'tasks' | 'notifications' | 'followups') => void;
  onOpenProfile: () => void;
  onAddNoteReview: (leadId: string, type: 'note' | 'remark' | 'review', content: string, rating?: number) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  leads,
  tasks,
  auditLogs,
  onUpdateLead,
  onUpdateTask,
  onNavigateToTab,
  onOpenProfile,
  onAddNoteReview,
}) => {
  const [selectedLeadForNote, setSelectedLeadForNote] = useState<Lead | null>(null);

  // STRICT DATA ISOLATION: Only leads and tasks assigned to current employee
  const myLeads = leads.filter(
    (l) => !l.deleted && (l.assignedTo === currentUser.id || l.assignedTo === currentUser.employeeId)
  );

  const myTasks = tasks.filter(
    (t) => t.assignedTo === currentUser.id || t.assignedTo === currentUser.employeeId
  );

  const pendingTasks = myTasks.filter((t) => t.status !== 'completed');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');

  // Leads stats
  const wonLeads = myLeads.filter((l) => l.stage === 'won');
  const activePipelineValue = myLeads
    .filter((l) => l.stage !== 'lost')
    .reduce((sum, l) => sum + (l.value || 0), 0);
  const wonRevenue = wonLeads.reduce((sum, l) => sum + (l.value || 0), 0);

  // Calculate notes/calls logged by this employee
  const myNotesCount = myLeads.reduce((count, l) => {
    const userNotes = (l.notesLog || []).filter(
      (n: NoteReviewEntry) => n.authorId === currentUser.id || n.authorName === currentUser.name
    );
    return count + userNotes.length;
  }, 0);

  // Urgent follow-ups / attention required
  const followUpLeads = myLeads.filter((l) => {
    if (l.stage === 'won' || l.stage === 'lost') return false;
    return Boolean(l.nextFollowUp || l.priority === 'high');
  }).slice(0, 5);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleQuickCallLog = (lead: Lead, callResult: string) => {
    const timestamp = new Date().toISOString();
    const newNote: NoteReviewEntry = {
      id: 'note_' + Date.now(),
      leadId: lead.id,
      type: 'remark',
      content: `Call Status Update: ${callResult}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      createdAt: timestamp,
    };

    const updatedLead: Lead = {
      ...lead,
      notesLog: [newNote, ...(lead.notesLog || [])],
      updatedAt: timestamp,
      version: (lead.version || 0) + 1,
    };

    onUpdateLead(updatedLead);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl ${currentUser.avatarColor || 'bg-emerald-600'} flex items-center justify-center text-lg font-bold text-white uppercase shadow-inner border border-white/10`}
            >
              {currentUser.name.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Welcome, {currentUser.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {currentUser.role === 'admin' ? 'Admin' : 'Employee'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-1">
                <span className="font-mono text-emerald-400 font-semibold">
                  ID: {currentUser.employeeId || currentUser.username}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-neutral-500" />
                  {currentUser.department || 'Sales & Inquiries'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                  {currentUser.designation || 'Sales Representative'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenProfile}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>My Profile &amp; Password</span>
            </button>
            <button
              onClick={() => onNavigateToTab('table')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition flex items-center gap-1.5"
            >
              <span>View My Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards: My Activity & Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Leads */}
        <div 
          onClick={() => onNavigateToTab('table')}
          className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 rounded-2xl p-4 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">My Assigned Leads</span>
            <Building2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{myLeads.length}</div>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{formatCurrency(activePipelineValue)}</span>
            <span>pipeline value</span>
          </p>
        </div>

        {/* Card 2: Won Revenue */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">My Closed Deals</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{wonLeads.length}</div>
          <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{formatCurrency(wonRevenue)}</span>
            <span>won revenue</span>
          </p>
        </div>

        {/* Card 3: Tasks Due */}
        <div 
          onClick={() => onNavigateToTab('tasks')}
          className="bg-neutral-900 border border-neutral-800 hover:border-sky-500/40 rounded-2xl p-4 transition cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">My Pending Tasks</span>
            <CheckSquare className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{pendingTasks.length}</div>
          <p className="text-[11px] text-neutral-400 mt-1">
            <span className="text-sky-400 font-semibold">{completedTasks.length}</span> completed tasks
          </p>
        </div>

        {/* Card 4: Calls & Remarks */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Calls &amp; Remarks Logged</span>
            <Phone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{myNotesCount}</div>
          <p className="text-[11px] text-neutral-400 mt-1">
            Activity logged on assigned leads
          </p>
        </div>
      </div>

      {/* Main Grid: Follow-ups & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Priority Follow-ups and Call Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Follow-ups &amp; Call Management
                </h2>
              </div>
              <button
                onClick={() => onNavigateToTab('table')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>All {myLeads.length} Leads</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {followUpLeads.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-300">All follow-ups up to date!</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  You have no pending urgent follow-ups scheduled for today.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {followUpLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{lead.name}</span>
                        <span className="text-[10px] text-neutral-400">• {lead.company}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                          lead.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : lead.priority === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {lead.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1 text-neutral-300">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{lead.city || lead.location || '—'}{lead.region ? `, ${lead.region}` : ''}</span>
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1 font-mono text-emerald-400/90">
                            <Phone className="w-3 h-3 text-neutral-500" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.nextFollowUp && (
                          <span className="flex items-center gap-1 text-amber-300/90">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Follow-up: {lead.nextFollowUp}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Call Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        onClick={() => handleQuickCallLog(lead, 'Connected - Interested')}
                        className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-medium transition"
                        title="Log: Connected - Interested"
                      >
                        Interested
                      </button>

                      <button
                        onClick={() => handleQuickCallLog(lead, 'Follow-up Call Scheduled')}
                        className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-medium transition"
                        title="Log: Follow-up Scheduled"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => handleQuickCallLog(lead, 'Call Not Answered / Busy')}
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] font-medium transition"
                        title="Log: Not Reached"
                      >
                        No Answer
                      </button>

                      <button
                        onClick={() => setSelectedLeadForNote(lead)}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
                        title="Add Note or Remark"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-neutral-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Tasks Box */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Today's Assigned Tasks ({pendingTasks.length} Pending)
                </h2>
              </div>
              <button
                onClick={() => onNavigateToTab('tasks')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <span>Open Task Board</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {myTasks.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800/80">
                <CheckCircle2 className="w-8 h-8 text-sky-500/60 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-300">No tasks currently assigned to you</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  When the Administrator assigns tasks to you, they will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myTasks.slice(0, 5).map((task) => {
                  const isCompleted = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            onUpdateTask(task.id, {
                              status: isCompleted ? 'pending' : 'completed',
                            })
                          }
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-neutral-700 hover:border-emerald-500 text-transparent'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <p
                            className={`text-xs font-medium text-white ${
                              isCompleted ? 'line-through text-neutral-400' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                            {task.dueDate && <span>Due: {task.dueDate}</span>}
                            <span>•</span>
                            <span className="capitalize">{task.priority} Priority</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile & Personal Progress */}
        <div className="space-y-4">
          {/* Personal Profile Summary */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>My Employee Profile</span>
              </h3>
              <button
                onClick={onOpenProfile}
                className="text-[11px] text-emerald-400 hover:underline font-medium"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">User ID</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {currentUser.employeeId || currentUser.username}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Role</span>
                <span className="font-semibold text-neutral-200 capitalize">{currentUser.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Department</span>
                <span className="text-neutral-200">{currentUser.department || 'Sales & Inquiries'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Responsibilities</span>
                <span className="text-neutral-200">{currentUser.designation || 'Sales Representative'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-800/60">
                <span className="text-neutral-400">Password Status</span>
                <span className="text-emerald-400 font-medium">Secured (SHA-256)</span>
              </div>
            </div>

            <button
              onClick={onOpenProfile}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 border border-neutral-700"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Change My Password</span>
            </button>
          </div>

          {/* Scope & Data Isolation Notice */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 text-[11px] text-neutral-400 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Access Control</span>
            </div>
            <p className="leading-relaxed">
              Your account operates with strict data isolation. You have access to your assigned leads, tasks, follow-ups, and personal progress. Administrative settings, employee rosters, and company configs are managed by Administrator Amey Kulkarni.
            </p>
          </div>
        </div>
      </div>

      {/* Note modal if triggered */}
      {selectedLeadForNote && (
        <AddNoteReviewModal
          isOpen={true}
          lead={selectedLeadForNote}
          currentUser={currentUser}
          onClose={() => setSelectedLeadForNote(null)}
          onSubmit={onAddNoteReview}
        />
      )}
    </div>
  );
};
