var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);

// src/server/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
    if (!supabaseUrl) {
      const err = new Error("Supabase configuration error: SUPABASE_URL environment variable is missing.");
      err.code = "MISSING_SUPABASE_URL";
      throw err;
    }
    if (!supabaseKey) {
      const err = new Error("Supabase configuration error: SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY environment variables are missing.");
      err.code = "MISSING_SUPABASE_KEY";
      throw err;
    }
    supabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return supabaseClient;
}
var writeQueue = Promise.resolve();
function queueStateOperation(operation) {
  const resultPromise = writeQueue.then(operation, operation);
  writeQueue = resultPromise.then(() => {
  }, () => {
  });
  return resultPromise;
}
async function readCrmStateFromSupabase(defaultState) {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase.from("crm_state").select("data").eq("id", "main").maybeSingle();
    if (error) {
      if (error.code === "42501") {
        console.error(
          '[Supabase RLS Error] Row-Level Security blocked access to "crm_state". Please provide SUPABASE_SERVICE_ROLE_KEY in your server environment variables.'
        );
      } else {
        console.error("[Supabase Read Error]", error.message || error);
      }
      throw new Error(`Database read failed: ${error.message || "Supabase error"}`);
    }
    if (!data || !data.data) {
      console.warn('[Supabase] No "main" state record found. Initializing with default state...');
      await writeCrmStateToSupabase(defaultState);
      return defaultState;
    }
    const state = data.data;
    if (!Array.isArray(state.users) || state.users.length === 0) {
      state.users = defaultState.users || [];
    }
    if (!Array.isArray(state.leads)) state.leads = [];
    if (!Array.isArray(state.tasks)) state.tasks = defaultState.tasks || [];
    if (!Array.isArray(state.notifications)) state.notifications = [];
    if (!Array.isArray(state.auditLogs)) state.auditLogs = [];
    return state;
  } catch (err) {
    console.error("[Supabase Error] Unable to read crm_state:", err.message || err);
    throw err;
  }
}
async function writeCrmStateToSupabase(state) {
  const supabase = getSupabaseClient();
  state.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  state.version = (state.version || 1) + 1;
  try {
    const { data, error } = await supabase.from("crm_state").update({
      data: state,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", "main").select("data").maybeSingle();
    if (error) {
      if (error.code === "42501") {
        console.error(
          '[Supabase RLS Error] Row-Level Security blocked write to "crm_state". Please set SUPABASE_SERVICE_ROLE_KEY in your server environment variables.'
        );
      } else {
        console.error("[Supabase Write Error]", error.message || error);
      }
      throw new Error(`Database write failed: ${error.message || "Supabase error"}`);
    }
    if (!data) {
      const { error: upsertError } = await supabase.from("crm_state").upsert({
        id: "main",
        data: state,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (upsertError) {
        console.error("[Supabase Upsert Error]", upsertError.message || upsertError);
        throw new Error(`Database upsert failed: ${upsertError.message}`);
      }
    }
    return state;
  } catch (err) {
    console.error("[Supabase Error] Unable to write crm_state:", err.message || err);
    throw err;
  }
}

// server.ts
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id, x-user-role");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var DEFAULT_INITIAL_STATE = {
  version: 1,
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  users: [
    {
      id: "user_admin",
      employeeId: "EMP-001",
      username: "admin",
      name: "Amey Kulkarni",
      role: "admin",
      designation: "CRM Administrator",
      department: "Management",
      phone: "+1 (555) 010-0001",
      email: "ameykulkarni1993@gmail.com",
      avatarColor: "bg-amber-600",
      active: true,
      createdAt: "2026-01-15T09:00:00.000Z",
      passwordHash: "admin123",
      passwordChangedAt: "2026-01-15T09:00:00.000Z",
      requiresPasswordReset: false
    },
    {
      id: "user_sales",
      employeeId: "EMP-002",
      username: "sales",
      name: "Sarah Jenkins",
      role: "employee",
      designation: "Sales Representative",
      department: "Sales & Inquiries",
      phone: "+1 (555) 010-0002",
      email: "sarah.j@localcrm.internal",
      avatarColor: "bg-emerald-600",
      active: true,
      createdAt: "2026-02-01T10:30:00.000Z",
      passwordHash: "sales123",
      passwordChangedAt: "2026-02-01T10:30:00.000Z",
      requiresPasswordReset: false,
      permissions: {
        canViewLeads: true,
        canCreateLeads: true,
        canViewTasks: true,
        canViewFollowUps: true,
        canViewProgress: true,
        canExportData: false
      }
    }
  ],
  leads: [
    {
      id: "lead_1",
      name: "Marcus Vance",
      company: "Apex Industrial Tech",
      email: "marcus@apextech.example",
      phone: "+1 (555) 234-5678",
      stage: "proposal",
      value: 48e3,
      priority: "high",
      assignedTo: "user_sales",
      assignedName: "Sarah Jenkins",
      notes: "Interested in enterprise offline fleet licensing. Proposal sent for 120 seats.",
      notesLog: [
        {
          id: "nl_1",
          leadId: "lead_1",
          type: "remark",
          content: "Procurement requested additional ISO-27001 offline security certification.",
          authorId: "user_admin",
          authorName: "Amey Kulkarni",
          authorRole: "admin",
          createdAt: "2026-09-17T14:30:00.000Z"
        },
        {
          id: "nl_2",
          leadId: "lead_1",
          type: "review",
          content: "High-value deal with great close probability. Excellent discovery work by sales team.",
          rating: 5,
          authorId: "user_admin",
          authorName: "Amey Kulkarni",
          authorRole: "admin",
          createdAt: "2026-09-18T16:00:00.000Z"
        }
      ],
      tags: ["Enterprise", "Fleet", "Q3 Deal"],
      activities: [
        {
          id: "act_1_1",
          leadId: "lead_1",
          type: "meeting",
          description: "Demo presentation with procurement team.",
          performedBy: "user_sales",
          performedByName: "Sarah Jenkins",
          timestamp: "2026-09-15T14:30:00.000Z"
        },
        {
          id: "act_1_2",
          leadId: "lead_1",
          type: "stage_change",
          description: "Advanced to Proposal Sent ($48,000).",
          performedBy: "user_sales",
          performedByName: "Sarah Jenkins",
          timestamp: "2026-09-17T11:00:00.000Z"
        }
      ],
      createdAt: "2026-09-10T08:00:00.000Z",
      updatedAt: "2026-09-17T11:00:00.000Z",
      version: 3
    },
    {
      id: "lead_2",
      name: "Elena Rostova",
      company: "Nordic Wave Logistics",
      email: "elena@nordicwavelog.example",
      phone: "+1 (555) 876-5432",
      stage: "qualified",
      value: 29500,
      priority: "medium",
      assignedTo: "user_sales",
      assignedName: "Sarah Jenkins",
      notes: "Needs local multi-device sync for warehouse dispatchers with patchy internet.",
      notesLog: [
        {
          id: "nl_3",
          leadId: "lead_2",
          type: "note",
          content: "Checked warehouse blueprint; 4 dispatch terminals run purely offline during harbor shifts.",
          authorId: "user_sales",
          authorName: "Sarah Jenkins",
          authorRole: "sales",
          createdAt: "2026-09-18T10:15:00.000Z"
        }
      ],
      tags: ["Logistics", "Maritime", "Sync"],
      activities: [
        {
          id: "act_2_1",
          leadId: "lead_2",
          type: "call",
          description: "Technical discovery call with logistics director.",
          performedBy: "user_sales",
          performedByName: "Sarah Jenkins",
          timestamp: "2026-09-18T10:00:00.000Z"
        }
      ],
      createdAt: "2026-09-12T14:00:00.000Z",
      updatedAt: "2026-09-18T10:15:00.000Z",
      version: 2
    },
    {
      id: "lead_3",
      name: "David Chen",
      company: "Solaria Solar Systems",
      email: "d.chen@solariapower.example",
      phone: "+1 (555) 432-1098",
      stage: "won",
      value: 65e3,
      priority: "high",
      assignedTo: "user_sales",
      assignedName: "Sarah Jenkins",
      notes: "Signed contract for annual CRM subscription and field team rollout.",
      notesLog: [
        {
          id: "nl_4",
          leadId: "lead_3",
          type: "review",
          content: "Contract terms verified and approved. Customer requested fast 48-hr kickoff.",
          rating: 5,
          authorId: "user_admin",
          authorName: "Amey Kulkarni",
          authorRole: "admin",
          createdAt: "2026-09-19T16:10:00.000Z"
        }
      ],
      tags: ["Renewable", "Contract Signed"],
      activities: [
        {
          id: "act_3_1",
          leadId: "lead_3",
          type: "stage_change",
          description: "Deal closed won! Contract signed.",
          performedBy: "user_sales",
          performedByName: "Sarah Jenkins",
          timestamp: "2026-09-19T16:00:00.000Z"
        }
      ],
      createdAt: "2026-08-20T10:00:00.000Z",
      updatedAt: "2026-09-19T16:00:00.000Z",
      version: 4
    },
    {
      id: "lead_4",
      name: "Rachel Adams",
      company: "Pinnacle Health Labs",
      email: "radams@pinnaclelabs.example",
      phone: "+1 (555) 345-6789",
      stage: "contacted",
      value: 18e3,
      priority: "low",
      assignedTo: "user_admin",
      assignedName: "Amey Kulkarni",
      notes: "Introductory email sent. Follow-up scheduled for next Tuesday.",
      notesLog: [],
      tags: ["Healthcare"],
      activities: [
        {
          id: "act_4_1",
          leadId: "lead_4",
          type: "email",
          description: "Sent product overview and security compliance sheet.",
          performedBy: "user_admin",
          performedByName: "Amey Kulkarni",
          timestamp: "2026-09-19T13:45:00.000Z"
        }
      ],
      createdAt: "2026-09-18T11:20:00.000Z",
      updatedAt: "2026-09-19T13:45:00.000Z",
      version: 1
    },
    {
      id: "lead_5",
      name: "Omar Farooq",
      company: "Caspian Freight",
      email: "omar@caspianfreight.example",
      phone: "+1 (555) 901-2345",
      stage: "new",
      value: 34e3,
      priority: "medium",
      assignedTo: "user_sales",
      assignedName: "Sarah Jenkins",
      notes: "Submitted contact form from remote offshore maritime station.",
      notesLog: [],
      tags: ["Maritime", "Inbound"],
      activities: [],
      createdAt: "2026-09-20T02:15:00.000Z",
      updatedAt: "2026-09-20T02:15:00.000Z",
      version: 1
    }
  ],
  tasks: [
    {
      id: "task_1",
      title: "Follow up on Fleet Licensing proposal",
      description: "Schedule ISO-27001 offline security certification review with Marcus Vance.",
      assignedTo: "user_sales",
      assignedName: "Sarah Jenkins",
      assignedBy: "user_admin",
      assignedByName: "Amey Kulkarni",
      leadId: "lead_1",
      leadName: "Marcus Vance (Apex Industrial Tech)",
      dueDate: "2026-09-24",
      priority: "urgent",
      status: "in_progress",
      notes: "Procurement requested technical compliance checklist.",
      createdAt: "2026-09-18T14:00:00.000Z",
      updatedAt: "2026-09-19T09:30:00.000Z"
    },
    {
      id: "task_2",
      title: "Solaria Solar onboarding kickoff",
      description: "Send onboarding documentation and configure field team offline sync profiles.",
      assignedTo: "user_sales",
      assignedName: "Sarah Jenkins",
      assignedBy: "user_admin",
      assignedByName: "Amey Kulkarni",
      leadId: "lead_3",
      leadName: "David Chen (Solaria Solar Systems)",
      dueDate: "2026-09-22",
      priority: "high",
      status: "pending",
      notes: "Customer requested kickoff within 48 hours of contract signing.",
      createdAt: "2026-09-19T16:30:00.000Z",
      updatedAt: "2026-09-19T16:30:00.000Z"
    },
    {
      id: "task_3",
      title: "Verify offline dispatch requirements",
      description: "Confirm the 4 harbor terminal hardware specs with Elena Rostova.",
      assignedTo: "user_sales",
      assignedName: "Sarah Jenkins",
      assignedBy: "user_admin",
      assignedByName: "Amey Kulkarni",
      leadId: "lead_2",
      leadName: "Elena Rostova (Nordic Wave Logistics)",
      dueDate: "2026-09-26",
      priority: "medium",
      status: "pending",
      notes: "Dispatch terminals require zero-internet local sync.",
      createdAt: "2026-09-20T03:00:00.000Z",
      updatedAt: "2026-09-20T03:00:00.000Z"
    }
  ],
  notifications: [
    {
      id: "notif_init_1",
      type: "priority_changed",
      title: "Priority Escalated to HIGH",
      message: "Amey Kulkarni set priority to HIGH for Marcus Vance (Apex Industrial Tech).",
      leadId: "lead_1",
      leadName: "Marcus Vance",
      leadCompany: "Apex Industrial Tech",
      actorId: "user_admin",
      actorName: "Amey Kulkarni",
      actorRole: "admin",
      actorAvatarColor: "bg-amber-600",
      timestamp: "2026-09-19T10:00:00.000Z",
      metadata: {
        priority: "high"
      },
      targetAudience: "all",
      readBy: []
    },
    {
      id: "notif_init_2",
      type: "review_added",
      title: "Admin Review Added",
      message: 'Amey Kulkarni reviewed Marcus Vance: "High-value deal with great close probability."',
      leadId: "lead_1",
      leadName: "Marcus Vance",
      leadCompany: "Apex Industrial Tech",
      actorId: "user_admin",
      actorName: "Amey Kulkarni",
      actorRole: "admin",
      actorAvatarColor: "bg-amber-600",
      timestamp: "2026-09-18T16:00:00.000Z",
      metadata: {
        reviewRating: 5,
        noteSnippet: "High-value deal with great close probability. Excellent discovery work by sales team."
      },
      targetAudience: "all",
      readBy: []
    },
    {
      id: "notif_init_3",
      type: "remark_added",
      title: "New Remark Added",
      message: "Amey Kulkarni added remark on Apex Industrial Tech regarding ISO-27001 offline security certification.",
      leadId: "lead_1",
      leadName: "Marcus Vance",
      leadCompany: "Apex Industrial Tech",
      actorId: "user_admin",
      actorName: "Amey Kulkarni",
      actorRole: "admin",
      actorAvatarColor: "bg-amber-600",
      timestamp: "2026-09-17T14:30:00.000Z",
      metadata: {
        noteSnippet: "Procurement requested additional ISO-27001 offline security certification."
      },
      targetAudience: "all",
      readBy: []
    }
  ],
  auditLogs: [
    {
      id: "audit_init_1",
      action: "SYSTEM_BOOT",
      details: "Connected CRM Cloud Database Server online with Supabase synchronization",
      userId: "system",
      userName: "Central Server",
      timestamp: "2026-09-20T05:00:00.000Z",
      category: "sync"
    },
    {
      id: "audit_init_2",
      action: "USER_LOGIN",
      details: "Admin Amey Kulkarni authenticated",
      userId: "user_admin",
      userName: "Amey Kulkarni",
      timestamp: "2026-09-20T05:01:00.000Z",
      category: "auth"
    }
  ]
};
async function readDb() {
  return readCrmStateFromSupabase(DEFAULT_INITIAL_STATE);
}
async function writeDb(data) {
  return writeCrmStateToSupabase(data);
}
function getCaller(req, currentUsers) {
  const callerId = req.headers["x-user-id"] || req.query.userId;
  const callerRoleHeader = req.headers["x-user-role"] || req.query.userRole;
  const user = currentUsers?.find((u) => u.id === callerId || u.username === callerId || u.employeeId === callerId);
  const role = user ? user.role : callerRoleHeader === "admin" ? "admin" : "employee";
  return {
    id: user?.id || callerId,
    user,
    role: role === "sales" ? "employee" : role,
    isAdmin: user ? user.role === "admin" : callerRoleHeader === "admin"
  };
}
function sanitizeUser(u) {
  if (!u) return null;
  const { passwordHash, rawPassword, ...safe } = u;
  return {
    ...safe,
    hasPassword: Boolean(passwordHash || rawPassword),
    requiresPasswordReset: Boolean(u.requiresPasswordReset),
    passwordChangedAt: u.passwordChangedAt || u.createdAt
  };
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    storage: "supabase",
    serverTime: (/* @__PURE__ */ new Date()).toISOString()
  });
});
function verifyUserPassword(entered, storedHashOrPlain) {
  if (!storedHashOrPlain) return false;
  const cleanEntered = entered.trim();
  if (cleanEntered === storedHashOrPlain) return true;
  let h = 3735928559;
  for (let i = 0; i < cleanEntered.length; i++) {
    h = Math.imul(h ^ cleanEntered.charCodeAt(i), 2654435761);
  }
  const fallbackHash = "h_" + ((h ^ h >>> 16) >>> 0).toString(16);
  if (fallbackHash === storedHashOrPlain) return true;
  return false;
}
app.post("/api/crm/auth/login", async (req, res) => {
  try {
    const { username, password, loginMode } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Username and password are required"
      });
    }
    const cleanUsername = String(username).trim().toLowerCase();
    let authenticatedUser = null;
    const result = await queueStateOperation(async () => {
      const current = await readDb();
      const users = current.users || [];
      const user = users.find((u) => {
        const uName = String(u.username || "").toLowerCase();
        const empId = String(u.employeeId || "").toLowerCase();
        const email = String(u.email || "").toLowerCase();
        return uName === cleanUsername || empId === cleanUsername || email === cleanUsername;
      });
      if (!user) {
        return {
          errorStatus: 404,
          message: loginMode === "admin" ? "Admin account not found. Please check your Administrator ID." : "Employee User ID not found. Contact your Administrator to generate your credentials."
        };
      }
      if (user.active === false) {
        return {
          errorStatus: 403,
          message: `Account for ${user.name} is deactivated. Please contact Administrator Amey Kulkarni.`
        };
      }
      if (loginMode === "admin" && user.role !== "admin") {
        return {
          errorStatus: 403,
          message: "Access Denied: This User ID does not have Administrator privileges. Please use Employee Login."
        };
      }
      const storedHash = user.passwordHash || user.rawPassword;
      const isMatch = verifyUserPassword(password, storedHash);
      if (!isMatch) {
        return {
          errorStatus: 401,
          message: "Incorrect password. Please verify your credentials."
        };
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      user.lastLogin = now;
      if (!current.auditLogs) current.auditLogs = [];
      current.auditLogs.unshift({
        id: "audit_login_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        action: "USER_LOGIN",
        details: `Signed in to CRM (${user.role}) from web client`,
        userId: user.id,
        userName: user.name,
        timestamp: now,
        category: "auth"
      });
      current.auditLogs = current.auditLogs.slice(0, 300);
      await writeDb(current);
      authenticatedUser = user;
      return { success: true };
    });
    if ("errorStatus" in result && result.errorStatus) {
      return res.status(result.errorStatus).json({
        status: "error",
        message: result.message
      });
    }
    res.json({
      status: "success",
      user: sanitizeUser(authenticatedUser)
    });
  } catch (err) {
    console.error("Error in POST /api/crm/auth/login:", err);
    res.status(503).json({
      status: "error",
      message: "Unable to connect to the CRM database. Please check your connection and try again."
    });
  }
});
app.get("/api/crm/data", async (req, res) => {
  try {
    const current = await readDb();
    const caller = getCaller(req, current.users || []);
    if (!caller.isAdmin && caller.id) {
      const filteredLeads = (current.leads || []).filter(
        (l) => !l.deleted && (l.assignedTo === caller.id || l.assignedTo === caller.user?.id)
      );
      const filteredTasks = (current.tasks || []).filter(
        (t) => t.assignedTo === caller.id || t.assignedTo === caller.user?.id
      );
      const filteredAudit = (current.auditLogs || []).filter(
        (a) => a.userId === caller.id || a.userId === caller.user?.id
      );
      return res.json({
        status: "success",
        data: {
          version: current.version,
          updatedAt: current.updatedAt,
          leads: filteredLeads,
          tasks: filteredTasks,
          users: (current.users || []).map(sanitizeUser),
          notifications: (current.notifications || []).slice(-50),
          auditLogs: filteredAudit.slice(-50)
        },
        serverTime: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({
      status: "success",
      data: {
        ...current,
        users: (current.users || []).map(sanitizeUser)
      },
      serverTime: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("Error in GET /api/crm/data:", err);
    res.status(503).json({
      status: "error",
      error: "Database unavailable",
      message: err.message || "Unable to retrieve CRM state from Supabase"
    });
  }
});
app.post("/api/crm/sync", async (req, res) => {
  try {
    const incoming = req.body;
    const saved = await queueStateOperation(async () => {
      const current = await readDb();
      if (incoming.leads && Array.isArray(incoming.leads)) {
        const leadMap = /* @__PURE__ */ new Map();
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
        const taskMap = /* @__PURE__ */ new Map();
        for (const t of current.tasks || []) taskMap.set(t.id, t);
        for (const t of incoming.tasks) taskMap.set(t.id, t);
        current.tasks = Array.from(taskMap.values());
      }
      if (incoming.users && Array.isArray(incoming.users)) {
        const userMap = /* @__PURE__ */ new Map();
        for (const u of current.users || []) userMap.set(u.id, u);
        for (const u of incoming.users) {
          const ex = userMap.get(u.id);
          const merged = { ...ex, ...u };
          if (!u.passwordHash && ex?.passwordHash) {
            merged.passwordHash = ex.passwordHash;
          }
          userMap.set(u.id, merged);
        }
        current.users = Array.from(userMap.values());
      }
      if (incoming.notifications && Array.isArray(incoming.notifications)) {
        const notifMap = /* @__PURE__ */ new Map();
        for (const n of current.notifications || []) notifMap.set(n.id, n);
        for (const n of incoming.notifications) notifMap.set(n.id, n);
        current.notifications = Array.from(notifMap.values()).slice(-200);
      }
      if (incoming.auditLogs && Array.isArray(incoming.auditLogs)) {
        const auditMap = /* @__PURE__ */ new Map();
        for (const a of current.auditLogs || []) auditMap.set(a.id, a);
        for (const a of incoming.auditLogs) auditMap.set(a.id, a);
        current.auditLogs = Array.from(auditMap.values()).slice(-300);
      }
      return writeDb(current);
    });
    res.json({
      status: "success",
      data: {
        ...saved,
        users: (saved.users || []).map(sanitizeUser)
      }
    });
  } catch (err) {
    console.error("Error in POST /api/crm/sync:", err);
    res.status(503).json({
      status: "error",
      error: "Sync failed",
      message: err.message || "Unable to sync CRM state with Supabase"
    });
  }
});
app.post("/api/crm/leads", async (req, res) => {
  try {
    const { leads, lead, action } = req.body;
    const result = await queueStateOperation(async () => {
      const current = await readDb();
      const caller = getCaller(req, current.users || []);
      if (Array.isArray(leads)) {
        if (!caller.isAdmin) {
          return { error: "Unauthorized: Batch lead replacement requires Admin role", status: 403 };
        }
        current.leads = leads;
      } else if (lead) {
        if (!current.leads) current.leads = [];
        const index = current.leads.findIndex((l) => l.id === lead.id);
        if (index >= 0) {
          const existing = current.leads[index];
          if (!caller.isAdmin && existing.assignedTo && existing.assignedTo !== caller.id) {
            return { error: "Access denied: You are not authorized to modify another employee's lead", status: 403 };
          }
          if (action === "delete") {
            if (!caller.isAdmin) {
              return { error: "Unauthorized: Only administrator can delete leads", status: 403 };
            }
            current.leads[index].deleted = true;
            current.leads[index].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          } else {
            current.leads[index] = { ...existing, ...lead, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
          }
        } else {
          const newLead = {
            ...lead,
            assignedTo: caller.isAdmin ? lead.assignedTo || caller.id : caller.id,
            assignedName: caller.isAdmin ? lead.assignedName || caller.user?.name : caller.user?.name || "Employee",
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          current.leads.unshift(newLead);
        }
      }
      const saved = await writeDb(current);
      return { saved };
    });
    if ("error" in result && result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ status: "success", data: result.saved });
  } catch (err) {
    console.error("Error in POST /api/crm/leads:", err);
    res.status(503).json({
      status: "error",
      error: "Lead update failed",
      message: err.message || "Unable to update lead in Supabase"
    });
  }
});
app.post("/api/crm/leads/bulk-reassign", async (req, res) => {
  try {
    const { targetUserId, targetUserName, leadIds, stage, fromUserId, pipelinedOnly = true } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: "targetUserId is required" });
    }
    const result = await queueStateOperation(async () => {
      const current = await readDb();
      const caller = getCaller(req, current.users || []);
      if (!caller.isAdmin) {
        return { error: "Unauthorized: Bulk lead reassignment requires Admin role", status: 403 };
      }
      const targetUser = (current.users || []).find((u) => u.id === targetUserId || u.employeeId === targetUserId);
      const finalTargetName = targetUserName || targetUser?.name || "Assigned Representative";
      let reassignedCount = 0;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      current.leads = (current.leads || []).map((lead) => {
        if (lead.deleted) return lead;
        if (Array.isArray(leadIds) && leadIds.length > 0) {
          if (!leadIds.includes(lead.id)) return lead;
        } else {
          if (pipelinedOnly && (lead.stage === "won" || lead.stage === "lost")) {
            return lead;
          }
          if (stage && stage !== "all" && lead.stage !== stage) {
            return lead;
          }
          if (fromUserId && fromUserId !== "all" && lead.assignedTo !== fromUserId) {
            return lead;
          }
        }
        reassignedCount++;
        const prevAssignee = lead.assignedName || "Previous Rep";
        const activities = lead.activities || [];
        activities.unshift({
          id: "act_reassign_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          leadId: lead.id,
          type: "stage_change",
          description: `1-Click Reassigned from ${prevAssignee} to ${finalTargetName} by Admin`,
          performedBy: caller.id,
          performedByName: caller.user?.name || "Administrator",
          timestamp: now
        });
        return {
          ...lead,
          assignedTo: targetUserId,
          assignedName: finalTargetName,
          updatedAt: now,
          version: (lead.version || 1) + 1,
          activities
        };
      });
      if (!current.auditLogs) current.auditLogs = [];
      current.auditLogs.unshift({
        id: "audit_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        action: "BULK_REASSIGN_PIPELINE",
        details: `Admin ${caller.user?.name || "Admin"} reassigned ${reassignedCount} pipelined leads to ${finalTargetName}`,
        userId: caller.id,
        userName: caller.user?.name || "Administrator",
        timestamp: now,
        category: "deal"
      });
      if (!current.notifications) current.notifications = [];
      current.notifications.unshift({
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        type: "deal_updated",
        title: `\u26A1 Bulk Pipeline Reassignment: ${reassignedCount} Leads`,
        message: `Admin ${caller.user?.name || "Admin"} reassigned ${reassignedCount} pipelined leads to ${finalTargetName}.`,
        actorId: caller.id,
        actorName: caller.user?.name || "Administrator",
        actorRole: "admin",
        targetAudience: "all",
        timestamp: now,
        readBy: []
      });
      const saved = await writeDb(current);
      return { reassignedCount, finalTargetName, saved };
    });
    if ("error" in result && result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({
      status: "success",
      reassignedCount: result.reassignedCount,
      targetUserId,
      targetUserName: result.finalTargetName,
      data: result.saved
    });
  } catch (err) {
    console.error("Error in POST /api/crm/leads/bulk-reassign:", err);
    res.status(503).json({
      status: "error",
      error: "Reassignment failed",
      message: err.message || "Unable to reassign leads in Supabase"
    });
  }
});
app.post("/api/crm/tasks", async (req, res) => {
  try {
    const { task, action, taskId } = req.body;
    const result = await queueStateOperation(async () => {
      const current = await readDb();
      const caller = getCaller(req, current.users || []);
      if (!current.tasks) current.tasks = [];
      if (action === "delete" && taskId) {
        if (!caller.isAdmin) {
          return { error: "Unauthorized: Only administrator can delete tasks", status: 403 };
        }
        current.tasks = current.tasks.filter((t) => t.id !== taskId);
      } else if (task) {
        const index = current.tasks.findIndex((t) => t.id === task.id);
        if (index >= 0) {
          const existing = current.tasks[index];
          if (!caller.isAdmin && existing.assignedTo !== caller.id) {
            return { error: "Access denied: You can only update tasks assigned to you", status: 403 };
          }
          current.tasks[index] = { ...existing, ...task, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
        } else {
          if (!caller.isAdmin) {
            return { error: "Unauthorized: Only administrator can create new tasks", status: 403 };
          }
          current.tasks.unshift(task);
        }
      }
      const saved = await writeDb(current);
      return { saved };
    });
    if ("error" in result && result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ status: "success", data: result.saved });
  } catch (err) {
    console.error("Error in POST /api/crm/tasks:", err);
    res.status(503).json({
      status: "error",
      error: "Task operation failed",
      message: err.message || "Unable to update task in Supabase"
    });
  }
});
app.post("/api/crm/users", async (req, res) => {
  try {
    const { user, userId, action, updates } = req.body;
    const result = await queueStateOperation(async () => {
      const current = await readDb();
      const caller = getCaller(req, current.users || []);
      if (!caller.isAdmin) {
        return { error: "Unauthorized: Only administrator can manage employee accounts", status: 403 };
      }
      if (!current.users) current.users = [];
      if (action === "delete" && userId) {
        if (userId === "user_admin") {
          return { error: "Cannot delete primary admin account", status: 403 };
        }
        current.users = current.users.filter((u) => u.id !== userId);
      } else if (action === "update" && userId && updates) {
        const index = current.users.findIndex((u) => u.id === userId);
        if (index >= 0) {
          current.users[index] = { ...current.users[index], ...updates };
        }
      } else if (user) {
        const index = current.users.findIndex((u) => u.id === user.id);
        if (index >= 0) {
          current.users[index] = { ...current.users[index], ...user };
        } else {
          current.users.push(user);
        }
      }
      const saved = await writeDb(current);
      return { saved };
    });
    if ("error" in result) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({
      status: "success",
      data: {
        ...result.saved,
        users: (result.saved.users || []).map(sanitizeUser)
      }
    });
  } catch (err) {
    console.error("Error in POST /api/crm/users:", err);
    res.status(503).json({
      status: "error",
      error: "User management failed",
      message: err.message || "Unable to update user accounts in Supabase"
    });
  }
});
app.post("/api/crm/reset-password", async (req, res) => {
  try {
    const { userId, temporaryPassword } = req.body;
    if (!userId || !temporaryPassword) {
      return res.status(400).json({ error: "Target userId and temporaryPassword are required" });
    }
    const result = await queueStateOperation(async () => {
      const current = await readDb();
      const caller = getCaller(req, current.users || []);
      if (!caller.isAdmin) {
        return { error: "Unauthorized: Only administrator can reset employee passwords", status: 403 };
      }
      const targetUser = (current.users || []).find((u) => u.id === userId);
      if (!targetUser) {
        return { error: "Employee account not found", status: 404 };
      }
      targetUser.passwordHash = temporaryPassword.trim();
      targetUser.requiresPasswordReset = true;
      targetUser.passwordChangedAt = (/* @__PURE__ */ new Date()).toISOString();
      const saved = await writeDb(current);
      return { targetUser, saved };
    });
    if ("error" in result && result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({
      status: "success",
      message: "Temporary password generated successfully",
      temporaryPassword,
      user: sanitizeUser(result.targetUser),
      data: result.saved
    });
  } catch (err) {
    console.error("Error in POST /api/crm/reset-password:", err);
    res.status(503).json({
      status: "error",
      error: "Password reset failed",
      message: err.message || "Unable to reset employee password in Supabase"
    });
  }
});
app.post("/api/crm/profile", async (req, res) => {
  try {
    const { userId, name, password } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    const result = await queueStateOperation(async () => {
      const current = await readDb();
      const user = (current.users || []).find((u) => u.id === userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }
      const oldName = user.name;
      if (name && name.trim()) {
        user.name = name.trim();
      }
      if (password && password.trim()) {
        user.passwordHash = password.trim();
        user.requiresPasswordReset = false;
        user.passwordChangedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (name && name.trim() && name.trim() !== oldName) {
        if (current.leads) {
          current.leads.forEach((l) => {
            if (l.assignedTo === userId) {
              l.assignedName = name.trim();
            }
          });
        }
        if (current.tasks) {
          current.tasks.forEach((t) => {
            if (t.assignedTo === userId) {
              t.assignedName = name.trim();
            }
          });
        }
      }
      const saved = await writeDb(current);
      return { user, saved };
    });
    if ("error" in result && result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.json({ status: "success", user: sanitizeUser(result.user), data: result.saved });
  } catch (err) {
    console.error("Error in POST /api/crm/profile:", err);
    res.status(503).json({
      status: "error",
      error: "Profile update failed",
      message: err.message || "Unable to update profile in Supabase"
    });
  }
});
app.post("/api/crm/reset", async (req, res) => {
  try {
    const saved = await queueStateOperation(async () => {
      return writeDb(JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE)));
    });
    res.json({ status: "success", data: saved });
  } catch (err) {
    console.error("Error in POST /api/crm/reset:", err);
    res.status(503).json({
      status: "error",
      error: "Reset failed",
      message: err.message || "Unable to reset CRM database in Supabase"
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CRM Central Server running on http://0.0.0.0:${PORT} [Supabase Persistence]`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
