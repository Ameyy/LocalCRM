import { Lead, User, CrmTask, NotificationItem, AuditLog } from '../types';

export interface ServerCrmData {
  version: number;
  updatedAt: string;
  users: User[];
  leads: Lead[];
  tasks: CrmTask[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
}

export async function fetchServerData(): Promise<{ success: boolean; data?: ServerCrmData; error?: string }> {
  try {
    const res = await fetch('/api/crm/data', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return {
        success: false,
        error: errJson?.message || `Server responded with HTTP ${res.status}`,
      };
    }
    const json = await res.json();
    return { success: true, data: json.data || null };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unable to connect to the CRM database.',
    };
  }
}

export const fetchCrmData = fetchServerData;

export async function loginUserApi(
  username: string,
  password: string,
  loginMode: 'employee' | 'admin'
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await fetch('/api/crm/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, loginMode }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status !== 'success') {
      return {
        success: false,
        message: json.message || 'Unable to sign in. Please check your credentials.',
      };
    }

    return { success: true, user: json.user };
  } catch (err: any) {
    return {
      success: false,
      message: 'Unable to connect to the CRM database. Please check your connection and try again.',
    };
  }
}

export async function syncWithServer(data: {
  leads?: Lead[];
  users?: User[];
  tasks?: CrmTask[];
  notifications?: NotificationItem[];
  auditLogs?: AuditLog[];
}): Promise<ServerCrmData | null> {
  try {
    const res = await fetch('/api/crm/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
}

export async function saveLeadToServer(lead: Lead, action?: 'delete'): Promise<boolean> {
  try {
    await fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead, action }),
    });
    return true;
  } catch (err) {
    return false;
  }
}

export async function saveTaskToServer(task: CrmTask, action?: 'delete', taskId?: string): Promise<boolean> {
  try {
    await fetch('/api/crm/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, action, taskId }),
    });
    return true;
  } catch (err) {
    return false;
  }
}

export async function saveUserToServer(user?: User, action?: 'delete' | 'update', userId?: string, updates?: Partial<User>): Promise<boolean> {
  try {
    await fetch('/api/crm/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, action, userId, updates }),
    });
    return true;
  } catch (err) {
    return false;
  }
}

export async function updateSelfProfileOnServer(userId: string, name: string, password?: string): Promise<{ success: boolean; user?: User }> {
  try {
    const res = await fetch('/api/crm/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name, password }),
    });
    if (!res.ok) return { success: false };
    const json = await res.json();
    return { success: true, user: json.user };
  } catch (err) {
    return { success: false };
  }
}

export async function resetServerDatabase(): Promise<boolean> {
  try {
    await fetch('/api/crm/reset', { method: 'POST' });
    return true;
  } catch (err) {
    return false;
  }
}
