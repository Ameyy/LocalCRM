import { User, Lead, AuditLog, SyncPacket, PipelineStage, NotificationItem, NotificationType, NoteReviewEntry, Priority, CrmTask } from '../types';

export const STAGES: { id: PipelineStage; label: string; color: string; bg: string; border: string }[] = [
  { id: 'new', label: 'New Inquiries', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'contacted', label: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'qualified', label: 'Qualified', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  { id: 'proposal', label: 'Proposal Sent', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'won', label: 'Closed Won', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'lost', label: 'Closed Lost', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin',
    employeeId: 'EMP-001',
    username: 'admin',
    name: 'Amey Kulkarni',
    role: 'admin',
    designation: 'CRM Administrator',
    department: 'Management',
    phone: '+1 (555) 010-0001',
    email: 'ameykulkarni1993@gmail.com',
    avatarColor: 'bg-amber-600',
    active: true,
    createdAt: '2026-01-15T09:00:00.000Z',
    passwordHash: 'admin123',
    passwordChangedAt: '2026-01-15T09:00:00.000Z',
    requiresPasswordReset: false,
  },
  {
    id: 'user_sales',
    employeeId: 'EMP-002',
    username: 'sales',
    name: 'Sarah Jenkins',
    role: 'employee',
    designation: 'Sales Representative',
    department: 'Sales & Inquiries',
    phone: '+1 (555) 010-0002',
    email: 'sarah.j@localcrm.internal',
    avatarColor: 'bg-emerald-600',
    active: true,
    createdAt: '2026-02-01T10:30:00.000Z',
    passwordHash: 'sales123',
    passwordChangedAt: '2026-02-01T10:30:00.000Z',
    requiresPasswordReset: false,
    permissions: {
      canViewLeads: true,
      canCreateLeads: true,
      canViewTasks: true,
      canViewFollowUps: true,
      canViewProgress: true,
      canExportData: false,
    },
  },
];

export const INITIAL_TASKS: CrmTask[] = [
  {
    id: 'task_1',
    title: 'Follow up on Fleet Licensing proposal',
    description: 'Schedule ISO-27001 offline security certification review with Marcus Vance.',
    assignedTo: 'user_sales',
    assignedName: 'Sarah Jenkins',
    assignedBy: 'user_admin',
    assignedByName: 'Amey Kulkarni',
    leadId: 'lead_1',
    leadName: 'Marcus Vance (Apex Industrial Tech)',
    dueDate: '2026-09-24',
    priority: 'urgent',
    status: 'in_progress',
    notes: 'Procurement requested technical compliance checklist.',
    createdAt: '2026-09-18T14:00:00.000Z',
    updatedAt: '2026-09-19T09:30:00.000Z',
  },
  {
    id: 'task_2',
    title: 'Solaria Solar onboarding kickoff',
    description: 'Send onboarding documentation and configure field team offline sync profiles.',
    assignedTo: 'user_sales',
    assignedName: 'Sarah Jenkins',
    assignedBy: 'user_admin',
    assignedByName: 'Amey Kulkarni',
    leadId: 'lead_3',
    leadName: 'David Chen (Solaria Solar Systems)',
    dueDate: '2026-09-22',
    priority: 'high',
    status: 'pending',
    notes: 'Customer requested kickoff within 48 hours of contract signing.',
    createdAt: '2026-09-19T16:30:00.000Z',
    updatedAt: '2026-09-19T16:30:00.000Z',
  },
  {
    id: 'task_3',
    title: 'Verify offline dispatch requirements',
    description: 'Confirm the 4 harbor terminal hardware specs with Elena Rostova.',
    assignedTo: 'user_sales',
    assignedName: 'Sarah Jenkins',
    assignedBy: 'user_admin',
    assignedByName: 'Amey Kulkarni',
    leadId: 'lead_2',
    leadName: 'Elena Rostova (Nordic Wave Logistics)',
    dueDate: '2026-09-26',
    priority: 'medium',
    status: 'pending',
    notes: 'Dispatch terminals require zero-internet local sync.',
    createdAt: '2026-09-20T03:00:00.000Z',
    updatedAt: '2026-09-20T03:00:00.000Z',
  },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead_1',
    name: 'Marcus Vance',
    company: 'Apex Industrial Tech',
    region: 'Maharashtra',
    city: 'Pune',
    location: 'Pune',
    email: 'marcus@apextech.example',
    phone: '+1 (555) 234-5678',
    stage: 'proposal',
    value: 48000,
    priority: 'high',
    assignedTo: 'user_sales',
    assignedName: 'Sarah Jenkins',
    notes: 'Interested in enterprise offline fleet licensing. Proposal sent for 120 seats in Pune hub.',
    notesLog: [
      {
        id: 'nl_1',
        leadId: 'lead_1',
        type: 'remark',
        content: 'Procurement requested additional ISO-27001 offline security certification.',
        authorId: 'user_admin',
        authorName: 'Alex Mitchell',
        authorRole: 'admin',
        createdAt: '2026-09-17T14:30:00.000Z',
      },
      {
        id: 'nl_2',
        leadId: 'lead_1',
        type: 'review',
        content: 'High-value deal with great close probability. Excellent discovery work by sales team.',
        rating: 5,
        authorId: 'user_admin',
        authorName: 'Alex Mitchell',
        authorRole: 'admin',
        createdAt: '2026-09-18T16:00:00.000Z',
      },
    ],
    tags: ['Enterprise', 'Fleet', 'Q3 Deal'],
    activities: [
      {
        id: 'act_1_1',
        leadId: 'lead_1',
        type: 'meeting',
        description: 'Demo presentation with procurement team.',
        performedBy: 'user_sales',
        performedByName: 'Sarah Jenkins',
        timestamp: '2026-09-15T14:30:00.000Z',
      },
      {
        id: 'act_1_2',
        leadId: 'lead_1',
        type: 'stage_change',
        description: 'Advanced to Proposal Sent ($48,000).',
        performedBy: 'user_sales',
        performedByName: 'Sarah Jenkins',
        timestamp: '2026-09-17T11:00:00.000Z',
      },
    ],
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-09-17T11:00:00.000Z',
    version: 3,
  },
  {
    id: 'lead_2',
    name: 'Elena Rostova',
    company: 'Nordic Wave Logistics',
    region: 'Maharashtra',
    city: 'Mumbai',
    location: 'Mumbai',
    email: 'elena@nordicwavelog.example',
    phone: '+1 (555) 876-5432',
    stage: 'qualified',
    value: 29500,
    priority: 'medium',
    assignedTo: 'user_sales',
    assignedName: 'Sarah Jenkins',
    notes: 'Needs local multi-device sync for warehouse dispatchers with patchy internet.',
    notesLog: [
      {
        id: 'nl_3',
        leadId: 'lead_2',
        type: 'note',
        content: 'Checked warehouse blueprint; 4 dispatch terminals run purely offline during harbor shifts.',
        authorId: 'user_sales',
        authorName: 'Sarah Jenkins',
        authorRole: 'sales',
        createdAt: '2026-09-18T10:15:00.000Z',
      },
    ],
    tags: ['Logistics', 'Warehouse'],
    activities: [
      {
        id: 'act_2_1',
        leadId: 'lead_2',
        type: 'call',
        description: 'Discovery call on local sync requirements.',
        performedBy: 'user_sales',
        performedByName: 'Sarah Jenkins',
        timestamp: '2026-09-18T10:15:00.000Z',
      },
    ],
    createdAt: '2026-09-12T09:30:00.000Z',
    updatedAt: '2026-09-18T10:15:00.000Z',
    version: 2,
  },
  {
    id: 'lead_3',
    name: 'David Chen',
    company: 'Solaria Solar Systems',
    region: 'Maharashtra',
    city: 'Pune',
    location: 'Pune',
    email: 'd.chen@solariapower.example',
    phone: '+1 (555) 432-1098',
    stage: 'won',
    value: 65000,
    priority: 'high',
    assignedTo: 'user_sales',
    assignedName: 'Sarah Jenkins',
    notes: 'Signed contract for annual CRM subscription and field team rollout.',
    notesLog: [
      {
        id: 'nl_4',
        leadId: 'lead_3',
        type: 'review',
        content: 'Contract terms verified and approved. Customer requested fast 48-hr kickoff.',
        rating: 5,
        authorId: 'user_admin',
        authorName: 'Amey Kulkarni',
        authorRole: 'admin',
        createdAt: '2026-09-19T16:10:00.000Z',
      },
    ],
    tags: ['Renewable', 'Contract Signed'],
    activities: [
      {
        id: 'act_3_1',
        leadId: 'lead_3',
        type: 'stage_change',
        description: 'Deal closed won! Contract signed.',
        performedBy: 'user_sales',
        performedByName: 'Sarah Jenkins',
        timestamp: '2026-09-19T16:00:00.000Z',
      },
    ],
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-09-19T16:00:00.000Z',
    version: 4,
  },
  {
    id: 'lead_4',
    name: 'Rachel Adams',
    company: 'Pinnacle Health Labs',
    region: 'Maharashtra',
    city: 'Nagpur',
    location: 'Nagpur',
    email: 'radams@pinnaclelabs.example',
    phone: '+1 (555) 345-6789',
    stage: 'contacted',
    value: 18000,
    priority: 'low',
    assignedTo: 'user_admin',
    assignedName: 'Amey Kulkarni',
    notes: 'Introductory email sent. Follow-up scheduled for next Tuesday.',
    notesLog: [],
    tags: ['Healthcare'],
    activities: [
      {
        id: 'act_4_1',
        leadId: 'lead_4',
        type: 'email',
        description: 'Sent product overview and security compliance sheet.',
        performedBy: 'user_admin',
        performedByName: 'Amey Kulkarni',
        timestamp: '2026-09-19T13:45:00.000Z',
      },
    ],
    createdAt: '2026-09-18T11:20:00.000Z',
    updatedAt: '2026-09-19T13:45:00.000Z',
    version: 1,
  },
  {
    id: 'lead_5',
    name: 'Omar Farooq',
    company: 'Caspian Freight',
    region: 'Maharashtra',
    city: 'Pune',
    location: 'Pune',
    email: 'omar@caspianfreight.example',
    phone: '+1 (555) 901-2345',
    stage: 'new',
    value: 34000,
    priority: 'medium',
    assignedTo: 'user_sales',
    assignedName: 'Sarah Jenkins',
    notes: 'Submitted contact form from remote offshore maritime station.',
    notesLog: [],
    tags: ['Maritime', 'Inbound'],
    activities: [],
    createdAt: '2026-09-20T02:15:00.000Z',
    updatedAt: '2026-09-20T02:15:00.000Z',
    version: 1,
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_init_1',
    type: 'priority_changed',
    title: 'Priority Escalated to HIGH',
    message: 'Amey Kulkarni set priority to HIGH for Marcus Vance (Apex Industrial Tech).',
    leadId: 'lead_1',
    leadName: 'Marcus Vance',
    leadCompany: 'Apex Industrial Tech',
    actorId: 'user_admin',
    actorName: 'Amey Kulkarni',
    actorRole: 'admin',
    actorAvatarColor: 'bg-amber-600',
    timestamp: '2026-09-19T10:00:00.000Z',
    metadata: {
      priority: 'high',
    },
    targetAudience: 'all',
    readBy: [],
  },
  {
    id: 'notif_init_2',
    type: 'review_added',
    title: 'Admin Review Added',
    message: 'Amey Kulkarni reviewed Marcus Vance: "High-value deal with great close probability."',
    leadId: 'lead_1',
    leadName: 'Marcus Vance',
    leadCompany: 'Apex Industrial Tech',
    actorId: 'user_admin',
    actorName: 'Amey Kulkarni',
    actorRole: 'admin',
    actorAvatarColor: 'bg-amber-600',
    timestamp: '2026-09-18T16:00:00.000Z',
    metadata: {
      reviewRating: 5,
      noteSnippet: 'High-value deal with great close probability. Excellent discovery work by sales team.',
    },
    targetAudience: 'all',
    readBy: [],
  },
  {
    id: 'notif_init_3',
    type: 'remark_added',
    title: 'New Remark Added',
    message: 'Amey Kulkarni added remark on Apex Industrial Tech regarding ISO-27001 offline security certification.',
    leadId: 'lead_1',
    leadName: 'Marcus Vance',
    leadCompany: 'Apex Industrial Tech',
    actorId: 'user_admin',
    actorName: 'Amey Kulkarni',
    actorRole: 'admin',
    actorAvatarColor: 'bg-amber-600',
    timestamp: '2026-09-17T14:30:00.000Z',
    metadata: {
      noteSnippet: 'Procurement requested additional ISO-27001 offline security certification.',
    },
    targetAudience: 'all',
    readBy: [],
  },
  {
    id: 'notif_init_4',
    type: 'admin_action',
    title: 'System Security Initialized',
    message: 'Offline RBAC and local database encryption partitions established.',
    actorId: 'user_admin',
    actorName: 'Amey Kulkarni',
    actorRole: 'admin',
    actorAvatarColor: 'bg-amber-600',
    timestamp: '2026-09-17T09:00:00.000Z',
    targetAudience: 'admin_only',
    readBy: [],
  },
];

export const INITIAL_AUDIT: AuditLog[] = [
  {
    id: 'audit_init_1',
    action: 'SYSTEM_BOOT',
    details: 'Connected CRM Database Server online with multi-URL synchronization',
    userId: 'system',
    userName: 'Central Server',
    timestamp: '2026-09-20T05:00:00.000Z',
    category: 'sync',
  },
  {
    id: 'audit_init_2',
    action: 'USER_LOGIN',
    details: 'Admin Amey Kulkarni authenticated',
    userId: 'user_admin',
    userName: 'Amey Kulkarni',
    timestamp: '2026-09-20T05:01:00.000Z',
    category: 'auth',
  },
];

// LocalStorage Keys
const KEYS = {
  USERS: 'localcrm_users_v1',
  LEADS: 'localcrm_leads_v1',
  TASKS: 'localcrm_tasks_v1',
  AUDIT: 'localcrm_audit_v1',
  NOTIFICATIONS: 'localcrm_notifications_v1',
  SESSION: 'localcrm_current_user_v1',
  DEVICE_ID: 'localcrm_device_id_v1',
  DEVICE_NAME: 'localcrm_device_name_v1',
};

export function getDeviceId(): string {
  let id = localStorage.getItem(KEYS.DEVICE_ID);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(KEYS.DEVICE_ID, id);
  }
  return id;
}

export function getDeviceName(): string {
  let name = localStorage.getItem(KEYS.DEVICE_NAME);
  if (!name) {
    const isMac = navigator.userAgent.includes('Mac');
    const isWindows = navigator.userAgent.includes('Windows');
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const platform = isMobile ? 'Mobile' : isMac ? 'MacBook' : isWindows ? 'ThinkPad' : 'Laptop';
    name = `${platform} (${getDeviceId().slice(-4).toUpperCase()})`;
    localStorage.setItem(KEYS.DEVICE_NAME, name);
  }
  return name;
}

export function setDeviceName(name: string) {
  localStorage.setItem(KEYS.DEVICE_NAME, name);
}

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(KEYS.USERS);
    if (!raw) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const users: User[] = JSON.parse(raw);
    let changed = false;
    const updated = users.map((u) => {
      let mod = { ...u };
      if (mod.name === 'Alex Mitchell' || (mod.id === 'user_admin' && mod.name !== 'Amey Kulkarni')) {
        changed = true;
        mod = {
          ...mod,
          name: 'Amey Kulkarni',
          email: 'ameykulkarni1993@gmail.com',
          employeeId: mod.employeeId || 'EMP-001',
          designation: mod.designation || 'CRM Administrator',
          department: mod.department || 'Management',
          role: 'admin',
        };
      }
      if (mod.role === ('sales' as any)) {
        changed = true;
        mod.role = 'employee';
      }
      if (mod.role !== 'admin' && !mod.permissions) {
        changed = true;
        mod.permissions = {
          canViewLeads: true,
          canCreateLeads: true,
          canViewTasks: true,
          canViewFollowUps: true,
          canViewProgress: true,
          canExportData: false,
        };
      }
      if (!mod.employeeId) {
        changed = true;
        mod.employeeId = mod.role === 'admin' ? 'EMP-001' : 'EMP-002';
      }
      if (!mod.department) {
        changed = true;
        mod.department = mod.role === 'admin' ? 'Management' : 'Sales & Inquiries';
      }
      if (!mod.designation) {
        changed = true;
        mod.designation = mod.role === 'admin' ? 'CRM Administrator' : 'Sales Representative';
      }
      return mod;
    });
    if (changed) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

export function getStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(KEYS.LEADS);
    if (!raw) {
      localStorage.setItem(KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    const parsed: Lead[] = JSON.parse(raw);
    // Ensure all leads have region, city, location, and notesLog array initialized
    return parsed.map(l => ({
      ...l,
      region: l.region || 'Maharashtra',
      city: l.city || l.location || 'Pune',
      location: l.city || l.location || 'Pune',
      notesLog: l.notesLog || [],
    }));
  } catch {
    return INITIAL_LEADS;
  }
}

export function saveLeads(leads: Lead[]) {
  localStorage.setItem(KEYS.LEADS, JSON.stringify(leads));
}

export function deleteLeads(leadIds: string[]): number {
  const leads = getStoredLeads();
  const idSet = new Set(leadIds);
  const remaining = leads.filter((l) => !idSet.has(l.id));
  const removed = leads.length - remaining.length;
  saveLeads(remaining);
  return removed;
}

export function bulkReassignPipelinedLeads(
  targetUserId: string,
  targetUserName: string,
  adminUser: User,
  options?: {
    leadIds?: string[];
    stage?: string;
    fromUserId?: string;
    pipelinedOnly?: boolean;
  }
): { updatedLeads: Lead[]; count: number } {
  const currentLeads = getStoredLeads();
  const pipelinedOnly = options?.pipelinedOnly !== false;
  const now = new Date().toISOString();
  let count = 0;

  const updatedLeads = currentLeads.map((lead) => {
    if (lead.deleted) return lead;

    if (options?.leadIds && options.leadIds.length > 0) {
      if (!options.leadIds.includes(lead.id)) return lead;
    } else {
      if (pipelinedOnly && (lead.stage === 'won' || lead.stage === 'lost')) {
        return lead;
      }
      if (options?.stage && options.stage !== 'all' && lead.stage !== options.stage) {
        return lead;
      }
      if (options?.fromUserId && options.fromUserId !== 'all' && lead.assignedTo !== options.fromUserId) {
        return lead;
      }
    }

    count++;
    const prevAssignee = lead.assignedName || 'Previous Rep';
    const activities = lead.activities || [];
    activities.unshift({
      id: 'act_reassign_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      leadId: lead.id,
      type: 'stage_change',
      description: `1-Click Reassigned from ${prevAssignee} to ${targetUserName} by Admin`,
      performedBy: adminUser.id,
      performedByName: adminUser.name,
      timestamp: now,
    });

    return {
      ...lead,
      assignedTo: targetUserId,
      assignedName: targetUserName,
      updatedAt: now,
      version: (lead.version || 1) + 1,
      activities,
    };
  });

  saveLeads(updatedLeads);

  // Log audit
  logAudit(
    'BULK_REASSIGN_PIPELINE',
    `Reassigned ${count} pipelined leads to ${targetUserName}`,
    adminUser,
    'deal'
  );

  // Create notification
  addNotification({
    type: 'deal_updated',
    title: `⚡ Reassigned ${count} Pipelined Leads`,
    message: `${adminUser.name} reassigned ${count} pipelined leads to ${targetUserName} in a single click.`,
    actorId: adminUser.id,
    actorName: adminUser.name,
    actorRole: adminUser.role,
    targetAudience: 'all',
  });

  return { updatedLeads, count };
}

export function getStoredTasks(): CrmTask[] {
  try {
    const raw = localStorage.getItem(KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed: CrmTask[] = JSON.parse(raw);
    return parsed;
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: CrmTask[]) {
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}

export function addTask(
  taskData: Omit<CrmTask, 'id' | 'createdAt' | 'updatedAt'>,
  creator: User
): CrmTask {
  const tasks = getStoredTasks();
  const newTask: CrmTask = {
    ...taskData,
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newTask, ...tasks];
  saveTasks(updated);

  // Generate notification for task assignment
  addNotification({
    type: 'task_assigned',
    title: `Task Assigned: ${newTask.title}`,
    message: `${creator.name} assigned "${newTask.title}" to ${newTask.assignedName}. Due: ${newTask.dueDate}`,
    leadId: newTask.leadId,
    leadName: newTask.leadName,
    actorId: creator.id,
    actorName: creator.name,
    actorRole: creator.role,
    metadata: {
      taskId: newTask.id,
      taskTitle: newTask.title,
      assignedTo: newTask.assignedTo,
      assignedName: newTask.assignedName,
      priority: newTask.priority,
    },
    targetAudience: 'all',
  });

  return newTask;
}

export function updateTask(
  taskId: string,
  updates: Partial<CrmTask>,
  editor: User
): CrmTask | null {
  const tasks = getStoredTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const oldStatus = task.status;
  const updatedTask: CrmTask = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const updatedTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
  saveTasks(updatedTasks);

  if (updates.status && updates.status !== oldStatus) {
    const isCompleted = updates.status === 'completed';
    addNotification({
      type: isCompleted ? 'task_completed' : 'task_updated',
      title: isCompleted ? `Task Completed: ${task.title}` : `Task Updated: ${task.title}`,
      message: `${editor.name} marked task as ${updates.status.toUpperCase()}: "${task.title}"`,
      leadId: task.leadId,
      leadName: task.leadName,
      actorId: editor.id,
      actorName: editor.name,
      actorRole: editor.role,
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        status: updates.status,
      },
      targetAudience: 'all',
    });
  }

  return updatedTask;
}

export function deleteTask(taskId: string): boolean {
  const tasks = getStoredTasks();
  const filtered = tasks.filter((t) => t.id !== taskId);
  saveTasks(filtered);
  return true;
}

export function deleteTasks(taskIds: string[]): number {
  const tasks = getStoredTasks();
  const idSet = new Set(taskIds);
  const remaining = tasks.filter((t) => !idSet.has(t.id));
  const removed = tasks.length - remaining.length;
  saveTasks(remaining);
  return removed;
}

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveNotifications(notifications: NotificationItem[]) {
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

/**
 * Add a new notification and persist it
 */
export function addNotification(
  item: Omit<NotificationItem, 'id' | 'timestamp' | 'readBy'> & Partial<NotificationItem>
): NotificationItem {
  const current = getStoredNotifications();
  const newNotif: NotificationItem = {
    id: item.id || 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type: item.type,
    title: item.title,
    message: item.message,
    leadId: item.leadId,
    leadName: item.leadName,
    leadCompany: item.leadCompany,
    actorId: item.actorId,
    actorName: item.actorName,
    actorRole: item.actorRole,
    actorAvatarColor: item.actorAvatarColor || (item.actorRole === 'admin' ? 'bg-amber-600' : 'bg-emerald-600'),
    timestamp: item.timestamp || new Date().toISOString(),
    metadata: item.metadata,
    targetAudience: item.targetAudience || 'all',
    readBy: item.readBy || [],
  };

  const updated = [newNotif, ...current.slice(0, 199)]; // Keep latest 200 notifications
  saveNotifications(updated);
  return newNotif;
}

export function markNotificationAsRead(notificationId: string, userId: string): NotificationItem[] {
  const current = getStoredNotifications();
  const updated = current.map((n) => {
    if (n.id === notificationId && !n.readBy.includes(userId)) {
      return { ...n, readBy: [...n.readBy, userId] };
    }
    return n;
  });
  saveNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(userId: string): NotificationItem[] {
  const current = getStoredNotifications();
  const updated = current.map((n) => {
    if (!n.readBy.includes(userId)) {
      return { ...n, readBy: [...n.readBy, userId] };
    }
    return n;
  });
  saveNotifications(updated);
  return updated;
}

/**
 * Filter notifications based on role requirements:
 * - Admin gets EVERY notification
 * - Sales person gets limited notifications (priority changes, notes, remarks, reviews, and lead updates assigned to them)
 */
export function isNotificationVisibleForUser(notification: NotificationItem, user: User): boolean {
  if (user.role === 'admin') {
    return true; // Admin gets everything!
  }

  // If marked specifically for admin only, hide from sales
  if (notification.targetAudience === 'admin_only') {
    return false;
  }

  // Sales person gets priority updates, notes, remarks, reviews
  const allowedTypes: NotificationType[] = [
    'priority_changed',
    'note_added',
    'remark_added',
    'review_added',
    'task_assigned',
    'task_updated',
    'task_completed',
  ];

  if (allowedTypes.includes(notification.type)) {
    // If it's a task assigned to this user or created for them
    if (notification.type === 'task_assigned') {
      if (notification.metadata?.assignedTo && notification.metadata.assignedTo !== user.id) {
        return false;
      }
    }
    return true;
  }

  // Sales person also sees new leads/imports assigned to them or general new leads
  if (notification.type === 'lead_created' || notification.type === 'lead_imported') {
    return true;
  }

  return false;
}

export function getNotificationsForUser(user: User): NotificationItem[] {
  const all = getStoredNotifications();
  return all.filter((n) => isNotificationVisibleForUser(n, user));
}

export function getStoredAudit(): AuditLog[] {
  try {
    const raw = localStorage.getItem(KEYS.AUDIT);
    if (!raw) {
      localStorage.setItem(KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
      return INITIAL_AUDIT;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT;
  }
}

export function logAudit(action: string, details: string, user: User, category: AuditLog['category'] = 'deal') {
  const current = getStoredAudit();
  const entry: AuditLog = {
    id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    action,
    details,
    userId: user.id,
    userName: user.name,
    timestamp: new Date().toISOString(),
    category,
  };
  const updated = [entry, ...current.slice(0, 199)]; // Keep latest 200 logs
  localStorage.setItem(KEYS.AUDIT, JSON.stringify(updated));
  return entry;
}

/**
 * Session storage allows each tab/window to have its own logged-in user
 * (e.g. Tab 1 = Admin Amey Kulkarni, Tab 2 = Sales Sarah Jenkins)
 * while falling back to localStorage if opened fresh.
 */
export function getStoredSession(): User | null {
  try {
    let user: User | null = null;
    const sessionRaw = sessionStorage.getItem(KEYS.SESSION);
    if (sessionRaw) {
      user = JSON.parse(sessionRaw);
    } else {
      const localRaw = localStorage.getItem(KEYS.SESSION);
      if (localRaw) {
        user = JSON.parse(localRaw);
      }
    }

    if (user) {
      if (user.name === 'Alex Mitchell' || (user.id === 'user_admin' && user.name !== 'Amey Kulkarni')) {
        user.name = 'Amey Kulkarni';
        user.email = 'ameykulkarni1993@gmail.com';
        user.employeeId = user.employeeId || 'EMP-001';
        user.rawPassword = user.rawPassword || user.passwordHash || 'admin123';
        saveSession(user);
      }
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(user: User | null) {
  if (!user) {
    sessionStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.SESSION);
  } else {
    sessionStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  }
}

/**
 * Add a Note, Remark, or Review to a specific Lead
 */
export function addNoteReviewToLead(
  leadId: string,
  type: 'note' | 'remark' | 'review',
  content: string,
  rating: number | undefined,
  currentUser: User
): { updatedLead: Lead; newEntry: NoteReviewEntry } {
  const leads = getStoredLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
  }

  const newEntry: NoteReviewEntry = {
    id: 'nr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    leadId,
    type,
    content,
    rating: type === 'review' ? (rating || 5) : undefined,
    authorId: currentUser.id,
    authorName: currentUser.name,
    authorRole: currentUser.role,
    createdAt: new Date().toISOString(),
  };

  const updatedLog = [newEntry, ...(lead.notesLog || [])];
  const updatedLead: Lead = {
    ...lead,
    notesLog: updatedLog,
    // Keep notes summary updated with latest remark/note
    notes: content,
    updatedAt: new Date().toISOString(),
    version: lead.version + 1,
  };

  const updatedLeads = leads.map((l) => (l.id === leadId ? updatedLead : l));
  saveLeads(updatedLeads);

  // Generate corresponding notification
  const notifType: NotificationType =
    type === 'review' ? 'review_added' : type === 'remark' ? 'remark_added' : 'note_added';

  const typeLabels = {
    note: 'Note Added',
    remark: 'Remark Added',
    review: `Review Added (${newEntry.rating ? newEntry.rating + '★' : ''})`,
  };

  addNotification({
    type: notifType,
    title: `${typeLabels[type]}: ${lead.name}`,
    message: `${currentUser.name} (${currentUser.role === 'admin' ? 'Admin' : 'Sales'}): "${content}"`,
    leadId: lead.id,
    leadName: lead.name,
    leadCompany: lead.company,
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorRole: currentUser.role,
    metadata: {
      noteSnippet: content,
      reviewRating: newEntry.rating,
    },
    targetAudience: 'all',
  });

  return { updatedLead, newEntry };
}

/**
 * Last-Write-Wins (LWW) Merge Engine for Offline Multi-Device Synchronization
 */
export function mergeLeads(localLeads: Lead[], incomingLeads: Lead[]): { merged: Lead[]; changesCount: number } {
  const map = new Map<string, Lead>();
  localLeads.forEach(lead => map.set(lead.id, lead));

  let changesCount = 0;

  for (const inc of incomingLeads) {
    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, inc);
      changesCount++;
    } else {
      const incDate = new Date(inc.updatedAt).getTime();
      const existDate = new Date(existing.updatedAt).getTime();

      // If incoming is strictly newer, or same timestamp but higher version
      if (incDate > existDate || (incDate === existDate && inc.version > existing.version)) {
        map.set(inc.id, inc);
        changesCount++;
      } else if (inc.notesLog && inc.notesLog.length > (existing.notesLog?.length || 0)) {
        // Merge notes if incoming has more notes
        const existingNoteIds = new Set((existing.notesLog || []).map(n => n.id));
        const newNotes = inc.notesLog.filter(n => !existingNoteIds.has(n.id));
        if (newNotes.length > 0) {
          map.set(inc.id, {
            ...existing,
            notesLog: [...newNotes, ...(existing.notesLog || [])],
          });
          changesCount++;
        }
      }
    }
  }

  const merged = Array.from(map.values()).sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return { merged, changesCount };
}

export function mergeUsers(localUsers: User[], incomingUsers: User[]): { merged: User[]; changesCount: number } {
  const map = new Map<string, User>();
  localUsers.forEach(u => map.set(u.id, u));

  let changesCount = 0;
  for (const inc of incomingUsers) {
    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, inc);
      changesCount++;
    } else {
      map.set(inc.id, { ...existing, ...inc });
    }
  }

  return { merged: Array.from(map.values()), changesCount };
}

export function mergeNotifications(localNotifs: NotificationItem[], incomingNotifs: NotificationItem[]): NotificationItem[] {
  const map = new Map<string, NotificationItem>();
  [...incomingNotifs, ...localNotifs].forEach(notif => {
    map.set(notif.id, notif);
  });
  return Array.from(map.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 200);
}

export function mergeAuditLogs(localLogs: AuditLog[], incomingLogs: AuditLog[]): AuditLog[] {
  const map = new Map<string, AuditLog>();
  [...incomingLogs, ...localLogs].forEach(log => {
    map.set(log.id, log);
  });
  return Array.from(map.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 200);
}

export function mergeTasks(localTasks: CrmTask[], incomingTasks: CrmTask[]): { merged: CrmTask[]; changesCount: number } {
  const map = new Map<string, CrmTask>();
  localTasks.forEach((t) => map.set(t.id, t));

  let changesCount = 0;
  for (const inc of incomingTasks) {
    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, inc);
      changesCount++;
    } else {
      const incDate = new Date(inc.updatedAt).getTime();
      const existDate = new Date(existing.updatedAt).getTime();
      if (incDate >= existDate) {
        map.set(inc.id, inc);
        changesCount++;
      }
    }
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return { merged, changesCount };
}

export function resetDatabaseToDefaults() {
  localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
  localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  localStorage.setItem(KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
}

