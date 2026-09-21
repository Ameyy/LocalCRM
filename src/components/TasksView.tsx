import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  User as UserIcon, 
  Building2, 
  Search, 
  Filter, 
  Trash2, 
  Edit3,
  MessageSquare
} from 'lucide-react';
import { CrmTask, User, Lead, TaskPriority, TaskStatus } from '../types';

interface TasksViewProps {
  currentUser: User;
  users: User[];
  leads: Lead[];
  tasks: CrmTask[];
  onAddTask: (taskData: Omit<CrmTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<CrmTask>) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  currentUser,
  users,
  leads,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CrmTask | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>(
    users.find((u) => u.role === 'sales')?.id || users[0]?.id || ''
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState('');

  const activeLeads = leads.filter((l) => !l.deleted);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    
    // Strict employee isolation: employees only see their assigned tasks
    if (!isAdmin) {
      if (task.assignedTo !== currentUser.id && task.assignedTo !== currentUser.employeeId) {
        return false;
      }
    } else {
      if (filterAssignee !== 'all' && task.assignedTo !== filterAssignee) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchLead = task.leadName?.toLowerCase().includes(q);
      const matchAssignee = task.assignedName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLead && !matchAssignee) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setTitle('');
    setDescription('');
    setAssignedTo(isAdmin ? (users.find((u) => u.role === 'sales')?.id || users[0]?.id || '') : currentUser.id);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setDueDate(d.toISOString().slice(0, 10));
    setPriority('medium');
    setSelectedLeadId('');
    setTaskNotes('');
    setEditingTask(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (task: CrmTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setAssignedTo(task.assignedTo);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setSelectedLeadId(task.leadId || '');
    setTaskNotes(task.notes || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignee = users.find((u) => u.id === assignedTo);
    const assignedName = assignee ? assignee.name : 'Unknown';
    const associatedLead = activeLeads.find((l) => l.id === selectedLeadId);
    const leadName = associatedLead ? `${associatedLead.name} (${associatedLead.company})` : undefined;

    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        assignedTo: isAdmin ? assignedTo : editingTask.assignedTo,
        assignedName: isAdmin ? assignedName : editingTask.assignedName,
        dueDate,
        priority,
        leadId: selectedLeadId || undefined,
        leadName,
        notes: taskNotes.trim() || undefined,
      });
    } else {
      onAddTask({
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        assignedName,
        assignedBy: currentUser.id,
        assignedByName: currentUser.name,
        dueDate,
        priority,
        status: 'pending',
        leadId: selectedLeadId || undefined,
        leadName,
        notes: taskNotes.trim() || undefined,
      });
    }

    setShowAddModal(false);
    setEditingTask(null);
  };

  const priorityColors: Record<TaskPriority, { bg: string; text: string; border: string }> = {
    urgent: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    high: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    medium: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    low: { bg: 'bg-neutral-800', text: 'text-neutral-400', border: 'border-neutral-700' },
  };

  const statusColors: Record<TaskStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', text: 'text-amber-400', label: 'Pending' },
    in_progress: { bg: 'bg-sky-500/10 text-sky-400 border border-sky-500/30', text: 'text-sky-400', label: 'In Progress' },
    completed: { bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', text: 'text-emerald-400', label: 'Completed' },
  };

  return (
    <div id="tasks-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Employee Task Management</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {tasks.filter((t) => t.status !== 'completed').length} Open Tasks
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Assign, track, and complete sales activities, lead follow-ups, and customer onboarding
          </p>
        </div>

        <button
          id="assign-task-btn"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdmin ? 'Assign New Task' : 'Create Task'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-neutral-500 shrink-0 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, lead, or employee..."
            className="w-full bg-transparent border-none text-xs text-white placeholder-neutral-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 focus:outline-hidden text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 focus:outline-hidden text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee Filter (Admin Only) */}
          {isAdmin ? (
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 focus:outline-hidden text-xs"
            >
              <option value="all">All Employees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.employeeId || u.username})
                </option>
              ))}
            </select>
          ) : (
            <div className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-emerald-400 font-medium text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Assigned To: You ({currentUser.employeeId || currentUser.username})</span>
            </div>
          )}
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/50 border border-neutral-800/80 rounded-2xl">
          <CheckSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-300">No tasks found</h3>
          <p className="text-xs text-neutral-500 mt-1">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Click "Assign New Task" to delegate activities to employees.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isAssignedToMe = task.assignedTo === currentUser.id;
            const isDueSoon = new Date(task.dueDate).getTime() < Date.now() + 86400000 * 2;
            const isOverdue = new Date(task.dueDate).getTime() < Date.now() && task.status !== 'completed';

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`flex flex-col justify-between p-4 rounded-2xl border transition ${
                  task.status === 'completed'
                    ? 'bg-neutral-950/40 border-neutral-800/60 opacity-80'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-xs'
                }`}
              >
                <div>
                  {/* Top Bar: Priority & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text} ${priorityColors[task.priority].border}`}
                    >
                      {task.priority}
                    </span>

                    {/* Status Dropdown/Selector */}
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border focus:outline-hidden cursor-pointer ${statusColors[task.status].bg}`}
                    >
                      <option value="pending" className="bg-neutral-900 text-amber-400">Pending</option>
                      <option value="in_progress" className="bg-neutral-900 text-sky-400">In Progress</option>
                      <option value="completed" className="bg-neutral-900 text-emerald-400">Completed</option>
                    </select>
                  </div>

                  {/* Title & Description */}
                  <h3 className={`text-sm font-bold text-white mb-1 ${task.status === 'completed' ? 'line-through text-neutral-400' : ''}`}>
                    {task.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-3 mb-3">
                    {task.description}
                  </p>

                  {/* Associated Lead */}
                  {task.leadName && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 mb-3">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{task.leadName}</span>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {task.notes && (
                    <div className="flex items-start gap-1.5 text-[11px] text-neutral-400 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800/80 mb-3">
                      <MessageSquare className="w-3 h-3 text-neutral-500 shrink-0 mt-0.5" />
                      <span className="italic">{task.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer Info: Assignee, Due Date & Actions */}
                <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-white font-medium">
                        {task.assignedName} {isAssignedToMe ? '(You)' : ''}
                      </span>
                    </div>

                    <div className={`flex items-center gap-1 font-mono text-[11px] ${
                      isOverdue ? 'text-rose-400 font-bold' : isDueSoon ? 'text-amber-400' : 'text-neutral-400'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      <span>{task.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                    <span>By {task.assignedByName}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="p-1 hover:text-white rounded transition"
                        title="Edit Task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="p-1 hover:text-rose-400 rounded transition cursor-pointer"
                          title="Delete Task (Admin only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              {editingTask ? 'Edit Task Details' : (isAdmin ? 'Assign New Task' : 'Add My Task')}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              {isAdmin
                ? 'Delegate duties and set due dates for team execution'
                : 'Create an action item for your assigned leads or personal schedule'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule fleet licensing compliance review"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed instructions or action items..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Assignee *</label>
                  {isAdmin ? (
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.employeeId || u.username})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-emerald-400 font-medium">
                      {currentUser.name} ({currentUser.employeeId || currentUser.username})
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Associated Lead (Optional)</label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 truncate"
                  >
                    <option value="">-- No specific lead --</option>
                    {activeLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} - {l.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="e.g. Procurement requested technical checklist before signing."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  {editingTask ? 'Save Changes' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
