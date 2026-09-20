import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cross-origin and iframe headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'crm_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data dir:', err);
  }
}

// Initial default state for the CRM
const DEFAULT_INITIAL_STATE = {
  version: 1,
  updatedAt: new Date().toISOString(),
  users: [
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
  ],
  leads: [
    {
      id: 'lead_1',
      name: 'Marcus Vance',
      company: 'Apex Industrial Tech',
      email: 'marcus@apextech.example',
      phone: '+1 (555) 234-5678',
      stage: 'proposal',
      value: 48000,
      priority: 'high',
      assignedTo: 'user_sales',
      assignedName: 'Sarah Jenkins',
      notes: 'Interested in enterprise offline fleet licensing. Proposal sent for 120 seats.',
      notesLog: [
        {
          id: 'nl_1',
          leadId: 'lead_1',
          type: 'remark',
          content: 'Procurement requested additional ISO-27001 offline security certification.',
          authorId: 'user_admin',
          authorName: 'Amey Kulkarni',
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
          authorName: 'Amey Kulkarni',
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
      tags: ['Logistics', 'Maritime', 'Sync'],
      activities: [
        {
          id: 'act_2_1',
          leadId: 'lead_2',
          type: 'call',
          description: 'Technical discovery call with logistics director.',
          performedBy: 'user_sales',
          performedByName: 'Sarah Jenkins',
          timestamp: '2026-09-18T10:00:00.000Z',
        },
      ],
      createdAt: '2026-09-12T14:00:00.000Z',
      updatedAt: '2026-09-18T10:15:00.000Z',
      version: 2,
    },
    {
      id: 'lead_3',
      name: 'David Chen',
      company: 'Solaria Solar Systems',
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
  ],
  tasks: [
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
  ],
  notifications: [
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
  ],
  auditLogs: [
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
  ],
};

function readDb() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_INITIAL_STATE, null, 2), 'utf-8');
      return DEFAULT_INITIAL_STATE;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);

    // Auto-migrate any old Alex Mitchell reference to Amey Kulkarni
    let changed = false;
    if (data.users) {
      for (const u of data.users) {
        if (u.name === 'Alex Mitchell' || u.id === 'user_admin') {
          if (u.name !== 'Amey Kulkarni') {
            u.name = 'Amey Kulkarni';
            u.email = 'ameykulkarni1993@gmail.com';
            changed = true;
          }
        }
      }
    }
    if (!data.tasks) {
      data.tasks = DEFAULT_INITIAL_STATE.tasks;
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
    return data;
  } catch (e) {
    console.error('Error reading DB:', e);
    return DEFAULT_INITIAL_STATE;
  }
}

function writeDb(data: any) {
  try {
    data.updatedAt = new Date().toISOString();
    data.version = (data.version || 1) + 1;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  } catch (e) {
    console.error('Error writing DB:', e);
    return data;
  }
}

// Helper to determine caller identity and role for RBAC
function getCaller(req: express.Request, currentUsers: any[]) {
  const callerId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const callerRoleHeader = (req.headers['x-user-role'] as string) || (req.query.userRole as string);
  const user = currentUsers?.find((u: any) => u.id === callerId || u.username === callerId || u.employeeId === callerId);
  const role = user ? user.role : (callerRoleHeader === 'admin' ? 'admin' : 'employee');
  return {
    id: user?.id || callerId,
    user,
    role: role === 'sales' ? 'employee' : role,
    isAdmin: user ? user.role === 'admin' : callerRoleHeader === 'admin',
  };
}

// Strip sensitive credentials from user objects
function sanitizeUser(u: any) {
  if (!u) return null;
  const { passwordHash, rawPassword, ...safe } = u;
  return {
    ...safe,
    hasPassword: Boolean(passwordHash || rawPassword),
    requiresPasswordReset: Boolean(u.requiresPasswordReset),
    passwordChangedAt: u.passwordChangedAt || u.createdAt,
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET ALL DATA - Full connected state with RBAC Data Isolation
app.get('/api/crm/data', (req, res) => {
  const current = readDb();
  const caller = getCaller(req, current.users || []);

  if (!caller.isAdmin && caller.id) {
    // Data isolation for employee: Return strictly assigned work and sanitize roster
    const filteredLeads = (current.leads || []).filter(
      (l: any) => !l.deleted && (l.assignedTo === caller.id || l.assignedTo === caller.user?.id)
    );
    const filteredTasks = (current.tasks || []).filter(
      (t: any) => t.assignedTo === caller.id || t.assignedTo === caller.user?.id
    );
    const filteredAudit = (current.auditLogs || []).filter(
      (a: any) => a.userId === caller.id || a.userId === caller.user?.id
    );

    return res.json({
      status: 'success',
      data: {
        version: current.version,
        updatedAt: current.updatedAt,
        leads: filteredLeads,
        tasks: filteredTasks,
        users: (current.users || []).map(sanitizeUser),
        notifications: (current.notifications || []).slice(-50),
        auditLogs: filteredAudit.slice(-50),
      },
      serverTime: new Date().toISOString(),
    });
  }

  // Admin caller: return full database with sanitized users
  res.json({
    status: 'success',
    data: {
      ...current,
      users: (current.users || []).map(sanitizeUser),
    },
    serverTime: new Date().toISOString(),
  });
});

// FULL SYNC / BATCH MERGE (Admin or synchronized background)
app.post('/api/crm/sync', (req, res) => {
  const incoming = req.body;
  const current = readDb();

  if (incoming.leads && Array.isArray(incoming.leads)) {
    const leadMap = new Map();
    for (const l of current.leads || []) leadMap.set(l.id, l);
    for (const l of incoming.leads) {
      const existing = leadMap.get(l.id);
      if (!existing || (l.version || 0) >= (existing.version || 0)) {
        leadMap.set(l.id, l);
      }
    }
    current.leads = Array.from(leadMap.values());
  }

  if (incoming.tasks && Array.isArray(incoming.tasks)) {
    const taskMap = new Map();
    for (const t of current.tasks || []) taskMap.set(t.id, t);
    for (const t of incoming.tasks) taskMap.set(t.id, t);
    current.tasks = Array.from(taskMap.values());
  }

  if (incoming.users && Array.isArray(incoming.users)) {
    const userMap = new Map();
    for (const u of current.users || []) userMap.set(u.id, u);
    for (const u of incoming.users) {
      const ex = userMap.get(u.id);
      // Preserve existing password if not updated
      const merged = { ...ex, ...u };
      if (!u.passwordHash && ex?.passwordHash) {
        merged.passwordHash = ex.passwordHash;
      }
      userMap.set(u.id, merged);
    }
    current.users = Array.from(userMap.values());
  }

  if (incoming.notifications && Array.isArray(incoming.notifications)) {
    const notifMap = new Map();
    for (const n of current.notifications || []) notifMap.set(n.id, n);
    for (const n of incoming.notifications) notifMap.set(n.id, n);
    current.notifications = Array.from(notifMap.values()).slice(-200);
  }

  if (incoming.auditLogs && Array.isArray(incoming.auditLogs)) {
    const auditMap = new Map();
    for (const a of current.auditLogs || []) auditMap.set(a.id, a);
    for (const a of incoming.auditLogs) auditMap.set(a.id, a);
    current.auditLogs = Array.from(auditMap.values()).slice(-300);
  }

  const saved = writeDb(current);
  res.json({
    status: 'success',
    data: {
      ...saved,
      users: (saved.users || []).map(sanitizeUser),
    },
  });
});

// UPDATE / CREATE LEADS with RBAC Isolation
app.post('/api/crm/leads', (req, res) => {
  const current = readDb();
  const caller = getCaller(req, current.users || []);
  const { leads, lead, action } = req.body;

  if (Array.isArray(leads)) {
    if (!caller.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Batch lead replacement requires Admin role' });
    }
    current.leads = leads;
  } else if (lead) {
    const index = current.leads.findIndex((l: any) => l.id === lead.id);
    if (index >= 0) {
      const existing = current.leads[index];
      // RBAC check: Non-admin can only update their own assigned lead
      if (!caller.isAdmin && existing.assignedTo && existing.assignedTo !== caller.id) {
        return res.status(403).json({ error: 'Access denied: You are not authorized to modify another employee\'s lead' });
      }

      if (action === 'delete') {
        if (!caller.isAdmin) {
          return res.status(403).json({ error: 'Unauthorized: Only administrator can delete leads' });
        }
        current.leads[index].deleted = true;
        current.leads[index].updatedAt = new Date().toISOString();
      } else {
        current.leads[index] = { ...existing, ...lead, updatedAt: new Date().toISOString() };
      }
    } else {
      // New lead creation
      const newLead = {
        ...lead,
        assignedTo: caller.isAdmin ? (lead.assignedTo || caller.id) : caller.id,
        assignedName: caller.isAdmin ? (lead.assignedName || caller.user?.name) : (caller.user?.name || 'Employee'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      current.leads.unshift(newLead);
    }
  }

  const saved = writeDb(current);
  res.json({ status: 'success', data: saved });
});

// BULK REASSIGN PIPELINED LEADS (Admin 1-Click Assignment)
app.post('/api/crm/leads/bulk-reassign', (req, res) => {
  const current = readDb();
  const caller = getCaller(req, current.users || []);

  if (!caller.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Bulk lead reassignment requires Admin role' });
  }

  const { targetUserId, targetUserName, leadIds, stage, fromUserId, pipelinedOnly = true } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }

  const targetUser = (current.users || []).find((u: any) => u.id === targetUserId || u.employeeId === targetUserId);
  const finalTargetName = targetUserName || targetUser?.name || 'Assigned Representative';

  let reassignedCount = 0;
  const now = new Date().toISOString();

  current.leads = (current.leads || []).map((lead: any) => {
    if (lead.deleted) return lead;

    // Filter by leadIds if provided
    if (Array.isArray(leadIds) && leadIds.length > 0) {
      if (!leadIds.includes(lead.id)) return lead;
    } else {
      // Filter by pipeline stage if pipelinedOnly is true (default)
      if (pipelinedOnly && (lead.stage === 'won' || lead.stage === 'lost')) {
        return lead;
      }
      if (stage && stage !== 'all' && lead.stage !== stage) {
        return lead;
      }
      if (fromUserId && fromUserId !== 'all' && lead.assignedTo !== fromUserId) {
        return lead;
      }
    }

    reassignedCount++;
    const prevAssignee = lead.assignedName || 'Previous Rep';
    const activities = lead.activities || [];
    activities.unshift({
      id: 'act_reassign_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      leadId: lead.id,
      type: 'stage_change',
      description: `1-Click Reassigned from ${prevAssignee} to ${finalTargetName} by Admin`,
      performedBy: caller.id,
      performedByName: caller.user?.name || 'Administrator',
      timestamp: now,
    });

    return {
      ...lead,
      assignedTo: targetUserId,
      assignedName: finalTargetName,
      updatedAt: now,
      version: (lead.version || 1) + 1,
      activities,
    };
  });

  // Log audit
  if (!current.auditLogs) current.auditLogs = [];
  current.auditLogs.unshift({
    id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    action: 'BULK_REASSIGN_PIPELINE',
    details: `Admin ${caller.user?.name || 'Admin'} reassigned ${reassignedCount} pipelined leads to ${finalTargetName}`,
    userId: caller.id,
    userName: caller.user?.name || 'Administrator',
    timestamp: now,
    category: 'deal',
  });

  // Notify team
  if (!current.notifications) current.notifications = [];
  current.notifications.unshift({
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type: 'deal_updated',
    title: `⚡ Bulk Pipeline Reassignment: ${reassignedCount} Leads`,
    message: `Admin ${caller.user?.name || 'Admin'} reassigned ${reassignedCount} pipelined leads to ${finalTargetName}.`,
    actorId: caller.id,
    actorName: caller.user?.name || 'Administrator',
    actorRole: 'admin',
    targetAudience: 'all',
    timestamp: now,
    readBy: [],
  });

  const saved = writeDb(current);
  res.json({
    status: 'success',
    reassignedCount,
    targetUserId,
    targetUserName: finalTargetName,
    data: saved,
  });
});

// TASKS MANAGEMENT with RBAC Isolation
app.post('/api/crm/tasks', (req, res) => {
  const current = readDb();
  const caller = getCaller(req, current.users || []);
  const { task, action, taskId } = req.body;

  if (!current.tasks) current.tasks = [];

  if (action === 'delete' && taskId) {
    if (!caller.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Only administrator can delete tasks' });
    }
    current.tasks = current.tasks.filter((t: any) => t.id !== taskId);
  } else if (task) {
    const index = current.tasks.findIndex((t: any) => t.id === task.id);
    if (index >= 0) {
      const existing = current.tasks[index];
      // Employee can update status/notes of their assigned task
      if (!caller.isAdmin && existing.assignedTo !== caller.id) {
        return res.status(403).json({ error: 'Access denied: You can only update tasks assigned to you' });
      }
      current.tasks[index] = { ...existing, ...task, updatedAt: new Date().toISOString() };
    } else {
      if (!caller.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized: Only administrator can create new tasks' });
      }
      current.tasks.unshift(task);
    }
  }

  const saved = writeDb(current);
  res.json({ status: 'success', data: saved });
});

// EMPLOYEES / USERS MANAGEMENT (Strictly Administrator Only)
app.post('/api/crm/users', (req, res) => {
  const current = readDb();
  const caller = getCaller(req, current.users || []);

  if (!caller.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Only administrator can manage employee accounts' });
  }

  const { user, userId, action, updates } = req.body;
  if (!current.users) current.users = [];

  if (action === 'delete' && userId) {
    if (userId === 'user_admin') {
      return res.status(403).json({ error: 'Cannot delete primary admin account' });
    }
    current.users = current.users.filter((u: any) => u.id !== userId);
  } else if (action === 'update' && userId && updates) {
    const index = current.users.findIndex((u: any) => u.id === userId);
    if (index >= 0) {
      current.users[index] = { ...current.users[index], ...updates };
    }
  } else if (user) {
    const index = current.users.findIndex((u: any) => u.id === user.id);
    if (index >= 0) {
      current.users[index] = { ...current.users[index], ...user };
    } else {
      current.users.push(user);
    }
  }

  const saved = writeDb(current);
  res.json({
    status: 'success',
    data: {
      ...saved,
      users: (saved.users || []).map(sanitizeUser),
    },
  });
});

// ADMIN RESET EMPLOYEE PASSWORD (Generates temporary password, marks requiresPasswordReset)
app.post('/api/crm/reset-password', (req, res) => {
  const current = readDb();
  const caller = getCaller(req, current.users || []);

  if (!caller.isAdmin) {
    return res.status(403).json({ error: 'Unauthorized: Only administrator can reset employee passwords' });
  }

  const { userId, temporaryPassword } = req.body;
  if (!userId || !temporaryPassword) {
    return res.status(400).json({ error: 'Target userId and temporaryPassword are required' });
  }

  const user = current.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Employee account not found' });
  }

  user.passwordHash = temporaryPassword.trim();
  user.requiresPasswordReset = true;
  user.passwordChangedAt = new Date().toISOString();

  const saved = writeDb(current);
  res.json({
    status: 'success',
    message: 'Temporary password generated successfully',
    temporaryPassword,
    user: sanitizeUser(user),
    data: saved,
  });
});

// SALESPERSON SELF PROFILE UPDATE (Name & Password)
app.post('/api/crm/profile', (req, res) => {
  const current = readDb();
  const { userId, name, password } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const user = current.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldName = user.name;
  if (name && name.trim()) {
    user.name = name.trim();
  }
  if (password && password.trim()) {
    user.passwordHash = password.trim();
    user.requiresPasswordReset = false;
    user.passwordChangedAt = new Date().toISOString();
  }

  // Also update assignedName on leads and tasks if name changed
  if (name && name.trim() && name.trim() !== oldName) {
    if (current.leads) {
      current.leads.forEach((l: any) => {
        if (l.assignedTo === userId) {
          l.assignedName = name.trim();
        }
      });
    }
    if (current.tasks) {
      current.tasks.forEach((t: any) => {
        if (t.assignedTo === userId) {
          t.assignedName = name.trim();
        }
      });
    }
  }

  const saved = writeDb(current);
  res.json({ status: 'success', user: sanitizeUser(user), data: saved });
});

// RESET TO CLEAN DEFAULTS
app.post('/api/crm/reset', (req, res) => {
  const saved = writeDb(DEFAULT_INITIAL_STATE);
  res.json({ status: 'success', data: saved });
});

async function startServer() {
  // Mount Vite in development mode or serve static files in production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CRM Central Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
