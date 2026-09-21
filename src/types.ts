export type UserRole = 'admin' | 'employee' | 'sales';

export interface EmployeePermissions {
  canViewLeads: boolean;     // Access to My Leads / Assigned Leads
  canCreateLeads: boolean;   // Can create/add new leads
  canViewTasks: boolean;     // Access to Tasks
  canViewFollowUps: boolean; // Access to Follow-ups & Call logs
  canViewProgress: boolean;  // Access to My Progress / Dashboard
  canExportData: boolean;    // Can export to CSV/Excel
}

export const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  canViewLeads: true,
  canCreateLeads: true,
  canViewTasks: true,
  canViewFollowUps: true,
  canViewProgress: true,
  canExportData: false,
};

export interface User {
  id: string;
  employeeId?: string;
  username: string; // Login ID (e.g. admin, EMP001, sales)
  name: string;
  role: UserRole;
  designation?: string; // e.g. 'Telecaller', 'Sales Executive', 'Account Manager'
  department?: string;  // e.g. 'Sales', 'Telecalling', 'Customer Support'
  phone?: string;
  email: string;
  avatarColor: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions?: EmployeePermissions;
  passwordHash?: string; // Securely hashed password
  passwordChangedAt?: string;
  requiresPasswordReset?: boolean;
  rawPassword?: string; // Deprecated backwards-compat only
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface CrmTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // User ID
  assignedName: string;
  assignedBy: string; // User ID
  assignedByName: string;
  leadId?: string;
  leadName?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PipelineStage = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost';

export type LeadStage = PipelineStage;

export type Priority = 'low' | 'medium' | 'high';
export type LeadPriority = Priority;

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'stage_change';
  description: string;
  performedBy: string; // userId
  performedByName: string;
  timestamp: string;
}

export interface NoteReviewEntry {
  id: string;
  leadId: string;
  type: 'note' | 'remark' | 'review';
  content: string;
  rating?: number; // 1-5 for reviews
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  region?: string; // e.g. 'Maharashtra'
  city?: string;   // e.g. 'Pune'
  location?: string; // Location / City representation
  stage: PipelineStage;
  value: number; // e.g. 15000 in USD
  priority: Priority;
  assignedTo: string; // userId
  assignedName: string;
  notes: string;
  notesLog?: NoteReviewEntry[];
  nextFollowUp?: string;
  tags: string[];
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
  version: number;
  deleted?: boolean;
}

export type NotificationType = 
  | 'lead_created'
  | 'lead_imported'
  | 'note_added'
  | 'remark_added'
  | 'review_added'
  | 'priority_changed'
  | 'stage_changed'
  | 'value_changed'
  | 'lead_deleted'
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'deal_updated'
  | 'profile_updated'
  | 'admin_action';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  leadId?: string;
  leadName?: string;
  leadCompany?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actorAvatarColor?: string;
  timestamp: string;
  metadata?: {
    oldValue?: any;
    newValue?: any;
    priority?: Priority | TaskPriority;
    stage?: PipelineStage;
    noteSnippet?: string;
    reviewRating?: number;
    importCount?: number;
    fileName?: string;
    taskId?: string;
    taskTitle?: string;
    assignedTo?: string;
    assignedName?: string;
    status?: string;
    [key: string]: any;
  };
  targetAudience: 'all' | 'admin_only' | 'sales_limited';
  readBy: string[]; // array of user IDs
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
  category: 'auth' | 'deal' | 'sync' | 'admin';
}

export interface SyncPacket {
  version: number;
  timestamp: string;
  senderDeviceId: string;
  senderName: string;
  leads: Lead[];
  users: User[];
  tasks?: CrmTask[];
  auditLogs: AuditLog[];
  notifications?: NotificationItem[];
}

export interface PeerConnectionStatus {
  id: string;
  name: string;
  state: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  lastPing?: string;
  messagesSent: number;
  messagesReceived: number;
}

