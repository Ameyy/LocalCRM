/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Lead, AuditLog, NotificationItem, CrmTask } from './types';
import { 
  getStoredSession, 
  saveSession, 
  getStoredUsers, 
  getStoredLeads, 
  getStoredTasks,
  getStoredAudit, 
  getStoredNotifications,
  getNotificationsForUser,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addNoteReviewToLead,
  saveLeads, 
  bulkReassignPipelinedLeads,
  saveUsers, 
  saveTasks,
  addTask,
  updateTask,
  deleteTask,
  deleteTasks,
  deleteLeads,
  mergeLeads,
  mergeTasks,
  mergeUsers,
  mergeNotifications,
  mergeAuditLogs,
  logAudit, 
  resetDatabaseToDefaults 
} from './lib/storage';
import { syncEngine } from './lib/p2pSync';
import { fetchCrmData, syncWithServer } from './lib/api';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { FixedTableView } from './components/FixedTableView';
import { TasksView } from './components/TasksView';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationsView } from './components/NotificationsView';
import { DataImporterModal } from './components/DataImporterModal';
import { AddLeadModal } from './components/AddLeadModal';
import { AddNoteReviewModal } from './components/AddNoteReviewModal';
import { ProfileModal } from './components/ProfileModal';
import { SyncNotification } from './components/SyncNotification';
import { Lock, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredSession());
  const [users, setUsers] = useState<User[]>(() => getStoredUsers());
  const [leads, setLeads] = useState<Lead[]>(() => getStoredLeads());
  const [tasks, setTasks] = useState<CrmTask[]>(() => getStoredTasks());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredAudit());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const session = getStoredSession();
    return session ? getNotificationsForUser(session) : [];
  });

  const [currentTab, setCurrentTab] = useState<'table' | 'notifications' | 'tasks' | 'admin'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [quickNoteLead, setQuickNoteLead] = useState<Lead | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Keep ref of currentUser to use inside polling without triggering continuous re-renders
  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Anti-screenshot & Print Restriction for employee sessions
  useEffect(() => {
    if (currentUser?.role && currentUser.role !== 'admin') {
      document.body.classList.add('employee-restricted');
      const handleKeyDown = (e: KeyboardEvent) => {
        // Block Ctrl+P / Cmd+P (Print to PDF / screenshot capture)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
          e.preventDefault();
          e.stopPropagation();
          setSyncToast('Notice: Printing and database exports are restricted for employee accounts.');
          setTimeout(() => setSyncToast(null), 4000);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('employee-restricted');
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.classList.remove('employee-restricted');
    }
  }, [currentUser?.role]);

  // Refresh data from local storage
  const reloadFromStorage = useCallback(() => {
    const freshLeads = getStoredLeads();
    const freshUsers = getStoredUsers();
    const freshTasks = getStoredTasks();
    const freshAudit = getStoredAudit();
    setLeads(freshLeads);
    setUsers(freshUsers);
    setTasks(freshTasks);
    setAuditLogs(freshAudit);

    const activeUser = getStoredSession();
    if (activeUser) {
      setNotifications(getNotificationsForUser(activeUser));
    }
  }, []);

  // Multi-tab local BroadcastChannel sync listener
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event) => {
      if (event.type === 'leads_updated' || event.type === 'sync_success') {
        reloadFromStorage();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [reloadFromStorage]);

  // Live Cross-URL Server Polling (Ensures every URL/browser syncs in real-time)
  useEffect(() => {
    let isMounted = true;

    const pullServerUpdates = async () => {
      try {
        const serverData = await fetchCrmData();
        if (!serverData || !isMounted) return;

        let hasNewData = false;

        // Merge leads
        if (serverData.leads && serverData.leads.length > 0) {
          const currentLeads = getStoredLeads();
          const { merged, changesCount } = mergeLeads(currentLeads, serverData.leads);
          if (changesCount > 0) {
            saveLeads(merged);
            setLeads(merged);
            hasNewData = true;
          }
        }

        // Merge users
        if (serverData.users && serverData.users.length > 0) {
          const currentUsers = getStoredUsers();
          const { merged, changesCount } = mergeUsers(currentUsers, serverData.users);
          if (changesCount > 0) {
            saveUsers(merged);
            setUsers(merged);
            hasNewData = true;

            // If current user details changed on server, update current user session
            const me = currentUserRef.current;
            if (me) {
              const updatedMe = merged.find((u) => u.id === me.id);
              if (updatedMe && (updatedMe.name !== me.name || updatedMe.rawPassword !== me.rawPassword)) {
                saveSession(updatedMe);
                setCurrentUser(updatedMe);
              }
            }
          }
        }

        // Merge tasks
        if (serverData.tasks && serverData.tasks.length > 0) {
          const currentTasks = getStoredTasks();
          const { merged, changesCount } = mergeTasks(currentTasks, serverData.tasks);
          if (changesCount > 0) {
            saveTasks(merged);
            setTasks(merged);
            hasNewData = true;
          }
        }

        // Merge notifications
        if (serverData.notifications && serverData.notifications.length > 0) {
          const currentNotifs = getStoredNotifications();
          const merged = mergeNotifications(currentNotifs, serverData.notifications);
          if (merged.length !== currentNotifs.length) {
            localStorage.setItem('localcrm_notifications_v1', JSON.stringify(merged));
            const me = currentUserRef.current;
            if (me) {
              setNotifications(getNotificationsForUser(me));
            }
          }
        }

        if (hasNewData) {
          reloadFromStorage();
        }
      } catch {
        // Offline mode or transient network issue - safe to ignore
      }
    };

    // Initial pull
    pullServerUpdates();

    // Poll every 3.5 seconds
    const interval = setInterval(pullServerUpdates, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [reloadFromStorage]);

  // Handle document import completion (CSV, Excel, PDF, JSON)
  const handleImportComplete = (
    importedLeads: Lead[],
    mode: 'append' | 'replace',
    fileName: string
  ) => {
    const currentLeads = getStoredLeads();
    let finalLeads: Lead[] = [];

    if (mode === 'replace') {
      finalLeads = importedLeads;
    } else {
      // Append mode: avoid duplicating by matching name + company or email
      const existingKeySet = new Set(
        currentLeads.map((l) => `${l.name.toLowerCase()}_${l.company.toLowerCase()}`)
      );
      const newUnique = importedLeads.filter(
        (l) => !existingKeySet.has(`${l.name.toLowerCase()}_${l.company.toLowerCase()}`)
      );
      finalLeads = [...newUnique, ...currentLeads];
    }

    saveLeads(finalLeads);
    setLeads(finalLeads);

    if (currentUser) {
      logAudit(
        'IMPORT_DOCUMENT',
        `Imported ${importedLeads.length} record(s) from "${fileName}" (${mode.toUpperCase()} mode)`,
        currentUser,
        'deal'
      );

      // Create system notification for all dashboards
      addNotification({
        type: 'lead_imported',
        title: `Document Import: ${fileName}`,
        message: `${currentUser.name} imported ${importedLeads.length} contact(s) from "${fileName}" into the fixed table (${mode.toUpperCase()} mode).`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorAvatarColor: currentUser.avatarColor,
        targetAudience: 'all',
        metadata: {
          fileName: fileName,
          importCount: importedLeads.length,
        },
      });
    }

    syncEngine.broadcastLocalChange(currentUser);
    reloadFromStorage();
    setSyncToast(`Imported ${importedLeads.length} records from ${fileName}. Synced to Admin & Sales dashboards.`);
    setTimeout(() => setSyncToast(null), 6000);
  };

  // Handle manual Add Lead
  const handleAddLead = (leadData: Partial<Lead>) => {
    if (!currentUser) return;

    const newLead: Lead = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: leadData.name || 'New Lead',
      company: leadData.company || 'Unknown Co',
      email: leadData.email || '',
      phone: leadData.phone || '',
      value: leadData.value || 0,
      stage: leadData.stage || 'new',
      priority: leadData.priority || 'medium',
      assignedTo: leadData.assignedTo || currentUser.id,
      assignedName: leadData.assignedName || currentUser.name,
      notes: leadData.notes || '',
      tags: leadData.tags || ['Manual Entry'],
      activities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      notesLog: leadData.notes?.trim() ? [
        {
          id: 'note_' + Date.now(),
          leadId: '',
          type: 'note',
          content: leadData.notes.trim(),
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
          createdAt: new Date().toISOString(),
        }
      ] : [],
    };

    if (newLead.notesLog && newLead.notesLog.length > 0) {
      newLead.notesLog[0].leadId = newLead.id;
    }

    const currentLeads = getStoredLeads();
    const updatedLeads = [newLead, ...currentLeads];
    saveLeads(updatedLeads);
    setLeads(updatedLeads);

    logAudit('CREATE_DEAL', `Created lead "${newLead.name}" (${newLead.company})`, currentUser, 'deal');

    // Create notification: Both Admin and Sales Reps see new leads
    addNotification({
      type: 'lead_created',
      title: `New Lead: ${newLead.name}`,
      message: `${currentUser.name} added a new lead for "${newLead.company}" (Deal Value: $${(newLead.value || 0).toLocaleString()}, Priority: ${newLead.priority.toUpperCase()})`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      actorAvatarColor: currentUser.avatarColor,
      targetAudience: 'all',
      leadId: newLead.id,
      leadName: newLead.name,
      leadCompany: newLead.company,
    });

    syncEngine.broadcastLocalChange(currentUser);
    reloadFromStorage();
    setSyncToast(`Added "${newLead.name}". Synced across both Admin & Sales.`);
    setTimeout(() => setSyncToast(null), 5000);
  };

  // Handle single lead/row update
  const handleUpdateLead = (updatedLead: Lead) => {
    if (!currentUser) return;

    const currentLeads = getStoredLeads();
    const oldLead = currentLeads.find((l) => l.id === updatedLead.id);
    if (!oldLead) return;

    // Strict Enforcement: Employees can only edit lead details, NOT assigned rep
    const finalLead: Lead = currentUser.role === 'admin'
      ? updatedLead
      : {
          ...updatedLead,
          assignedTo: oldLead.assignedTo,
          assignedName: oldLead.assignedName,
        };

    const updated = currentLeads.map((l) => (l.id === finalLead.id ? finalLead : l));
    saveLeads(updated);
    setLeads(updated);

    logAudit('UPDATE_DEAL', `Edited record for "${updatedLead.name}" (${updatedLead.company})`, currentUser, 'deal');

    // Check for priority changes (Critical for Sales Rep + Admin)
    if (oldLead && oldLead.priority !== updatedLead.priority) {
      addNotification({
        type: 'priority_changed',
        title: `Priority Escalation: ${updatedLead.name}`,
        message: `${currentUser.name} changed priority from ${oldLead.priority.toUpperCase()} to ${updatedLead.priority.toUpperCase()} for "${updatedLead.name}" (${updatedLead.company}).`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorAvatarColor: currentUser.avatarColor,
        targetAudience: 'all',
        leadId: updatedLead.id,
        leadName: updatedLead.name,
        leadCompany: updatedLead.company,
        metadata: {
          oldValue: oldLead.priority,
          newValue: updatedLead.priority,
          priority: updatedLead.priority,
        },
      });
    }

    // Check for stage changes
    if (oldLead && oldLead.stage !== updatedLead.stage) {
      addNotification({
        type: 'stage_changed',
        title: `Stage Updated: ${updatedLead.name}`,
        message: `${currentUser.name} moved "${updatedLead.name}" from ${oldLead.stage.toUpperCase()} to ${updatedLead.stage.toUpperCase()}`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorAvatarColor: currentUser.avatarColor,
        targetAudience: 'all',
        leadId: updatedLead.id,
        leadName: updatedLead.name,
        leadCompany: updatedLead.company,
        metadata: {
          oldValue: oldLead.stage,
          newValue: updatedLead.stage,
        },
      });
    }

    // Check for remarks/notes change
    if (oldLead && oldLead.notes !== updatedLead.notes && updatedLead.notes) {
      addNotification({
        type: 'remark_added',
        title: `Remark on ${updatedLead.name}`,
        message: `${currentUser.name} updated remarks: "${updatedLead.notes.slice(0, 100)}${updatedLead.notes.length > 100 ? '...' : ''}"`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        targetAudience: 'all',
        leadId: updatedLead.id,
        leadName: updatedLead.name,
        leadCompany: updatedLead.company,
      });
    }

    syncEngine.broadcastLocalChange(currentUser);
    reloadFromStorage();
  };

  // Handle 1-Click bulk reassignment of pipelined leads (Admin only)
  const handleBulkReassignPipelinedLeads = async (
    targetUserId: string,
    options?: {
      leadIds?: string[];
      stage?: string;
      fromUserId?: string;
      pipelinedOnly?: boolean;
      customTargetName?: string;
    }
  ) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Access Denied: Bulk pipeline reassignment is exclusively reserved for Administrators.');
      return;
    }

    const targetUser = users.find((u) => u.id === targetUserId || u.employeeId === targetUserId);
    const targetName = options?.customTargetName || targetUser?.name || 'Assigned Representative';

    // 1. Update locally in persistent storage and component state
    const { updatedLeads, count } = bulkReassignPipelinedLeads(targetUserId, targetName, currentUser, options);
    setLeads(updatedLeads);

    // 2. Sync to backend API endpoint
    try {
      await fetch('/api/crm/leads/bulk-reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({
          targetUserId,
          targetUserName: targetName,
          leadIds: options?.leadIds,
          stage: options?.stage,
          fromUserId: options?.fromUserId,
          pipelinedOnly: options?.pipelinedOnly !== false,
        }),
      });
    } catch (err) {
      console.warn('Backend sync completed offline-first:', err);
    }

    // 3. Broadcast sync to all active views & browser windows
    syncEngine.broadcastLocalChange(currentUser);
    reloadFromStorage();

    // 4. Instant toast notification
    setSyncToast(`⚡ 1-Click Assignment: Successfully transferred ${count} pipelined leads to ${targetName}.`);
    setTimeout(() => setSyncToast(null), 5500);

    return count;
  };

  // Handle delete lead (strictly Admin only)
  const handleDeleteLead = (leadId: string) => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin') {
      setSyncToast('Permission Denied: Only Administrators can delete leads.');
      setTimeout(() => setSyncToast(null), 4000);
      return;
    }

    const currentLeads = getStoredLeads();
    const target = currentLeads.find((l) => l.id === leadId);
    const updated = currentLeads.filter((l) => l.id !== leadId);
    saveLeads(updated);
    setLeads(updated);

    if (target) {
      logAudit('DELETE_DEAL', `Removed lead "${target.name}" (${target.company})`, currentUser, 'deal');
      addNotification({
        type: 'deal_updated',
        title: `Lead Removed: ${target.name}`,
        message: `${currentUser.name} removed "${target.name}" (${target.company}) from the table.`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        targetAudience: 'admin_only',
      });
    }

    syncEngine.broadcastLocalChange(currentUser);
    reloadFromStorage();
    setSyncToast(`Lead "${target?.name || 'record'}" removed successfully.`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  // Handle bulk delete leads (strictly Admin only)
  const handleBulkDeleteLeads = (leadIds: string[]) => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin') {
      setSyncToast('Permission Denied: Only Administrators can delete leads.');
      setTimeout(() => setSyncToast(null), 4000);
      return;
    }
    if (!leadIds || leadIds.length === 0) return;

    const count = deleteLeads(leadIds);
    logAudit('DELETE_DEAL', `Bulk deleted ${count} leads from CRM`, currentUser, 'deal');
    addNotification({
      type: 'deal_updated',
      title: `Bulk Leads Removed: ${count} leads`,
      message: `${currentUser.name} deleted ${count} leads in bulk from the CRM table.`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      targetAudience: 'admin_only',
    });

    syncEngine.broadcastLocalChange(currentUser);
    reloadFromStorage();
    setSyncToast(`Successfully deleted ${count} leads.`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Handle adding notes/remarks/reviews
  const handleAddNoteReview = (
    leadId: string,
    type: 'note' | 'remark' | 'review',
    content: string,
    rating?: number
  ) => {
    if (!currentUser) return;

    const result = addNoteReviewToLead(leadId, type, content, rating, currentUser);
    if (!result) return;

    reloadFromStorage();
    syncEngine.broadcastLocalChange(currentUser);

    const typeLabel = type === 'review' ? 'Client Review' : type === 'remark' ? 'Remark' : 'Note';
    setSyncToast(`Added ${typeLabel} to ${result.updatedLead.name}. Alert sent to Admin & Sales.`);
    setTimeout(() => setSyncToast(null), 5000);
  };

  // Handle Tasks
  const handleAddTask = (taskData: Omit<CrmTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    // Employees can create tasks for themselves, but only Admin can assign tasks to other employees
    const finalTaskData = currentUser.role === 'admin'
      ? taskData
      : {
          ...taskData,
          assignedTo: currentUser.id,
          assignedName: currentUser.name,
        };

    addTask(finalTaskData, currentUser);
    reloadFromStorage();
    syncEngine.broadcastLocalChange(currentUser);
    setSyncToast(`Assigned task "${finalTaskData.title}" to ${finalTaskData.assignedName}.`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<CrmTask>) => {
    if (!currentUser) return;
    // Employees cannot reassign tasks to other users
    const safeUpdates = currentUser.role === 'admin'
      ? updates
      : { ...updates, assignedTo: undefined, assignedName: undefined };

    updateTask(taskId, safeUpdates, currentUser);
    reloadFromStorage();
    syncEngine.broadcastLocalChange(currentUser);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin') {
      setSyncToast('Permission Denied: Only Administrators can delete tasks.');
      setTimeout(() => setSyncToast(null), 4000);
      return;
    }
    const currentTasks = getStoredTasks();
    const taskToDelete = currentTasks.find((t) => t.id === taskId);
    deleteTask(taskId);
    if (taskToDelete) {
      logAudit('DELETE_TASK', `Removed task "${taskToDelete.title}" assigned to ${taskToDelete.assignedName}`, currentUser, 'task');
      addNotification({
        type: 'task_updated',
        title: `Task Removed: ${taskToDelete.title}`,
        message: `${currentUser.name} deleted task "${taskToDelete.title}" assigned to ${taskToDelete.assignedName}.`,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        targetAudience: 'admin_only',
      });
    }
    reloadFromStorage();
    syncEngine.broadcastLocalChange(currentUser);
    setSyncToast('Task deleted successfully.');
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleBulkDeleteTasks = (taskIds: string[]) => {
    if (!currentUser) return;
    if (currentUser.role !== 'admin') {
      setSyncToast('Permission Denied: Only Administrators can delete tasks.');
      setTimeout(() => setSyncToast(null), 4000);
      return;
    }
    if (!taskIds || taskIds.length === 0) return;

    const count = deleteTasks(taskIds);
    logAudit('DELETE_TASK', `Bulk deleted ${count} tasks`, currentUser, 'task');
    addNotification({
      type: 'task_updated',
      title: `Bulk Tasks Removed: ${count} tasks`,
      message: `${currentUser.name} deleted ${count} tasks in bulk.`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      targetAudience: 'admin_only',
    });
    reloadFromStorage();
    syncEngine.broadcastLocalChange(currentUser);
    setSyncToast(`Successfully deleted ${count} tasks.`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Handle Profile Edits (sales person or admin editing their own name, email, or password)
  const handleSaveProfile = (updates: { name: string; email?: string; password?: string }) => {
    if (!currentUser) return;

    const oldName = currentUser.name;
    const currentUsers = getStoredUsers();

    const updatedUser: User = {
      ...currentUser,
      name: updates.name,
      email: updates.email || currentUser.email,
      passwordHash: updates.password || currentUser.passwordHash,
      rawPassword: updates.password || currentUser.rawPassword,
    };

    // Update in users array
    const updatedUsers = currentUsers.map((u) => (u.id === currentUser.id ? updatedUser : u));
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    // Update session
    saveSession(updatedUser);
    setCurrentUser(updatedUser);

    // If name changed, update all assigned leads & tasks for consistency
    if (oldName !== updates.name) {
      const currentLeads = getStoredLeads();
      const updatedLeads = currentLeads.map((l) =>
        l.assignedTo === currentUser.id ? { ...l, assignedName: updates.name } : l
      );
      saveLeads(updatedLeads);
      setLeads(updatedLeads);

      const currentTasks = getStoredTasks();
      const updatedTasks = currentTasks.map((t) =>
        t.assignedTo === currentUser.id ? { ...t, assignedName: updates.name } : t
      );
      saveTasks(updatedTasks);
      setTasks(updatedTasks);

      addNotification({
        type: 'deal_updated',
        title: `Profile Name Updated`,
        message: `${oldName} changed their display name to "${updates.name}" (${currentUser.employeeId || currentUser.username}).`,
        actorId: currentUser.id,
        actorName: updates.name,
        actorRole: currentUser.role,
        targetAudience: 'all',
      });
    }

    logAudit('UPDATE_USER', `User updated profile name to "${updates.name}"`, updatedUser, 'admin');

    syncEngine.broadcastLocalChange(updatedUser);
    reloadFromStorage();
    setSyncToast(`Profile updated. Display name is now "${updates.name}".`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Handle Mark Notification as Read
  const handleMarkAsRead = (notificationId: string) => {
    if (!currentUser) return;
    markNotificationAsRead(notificationId, currentUser.id);
    setNotifications(getNotificationsForUser(currentUser));
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    markAllNotificationsAsRead(currentUser.id);
    setNotifications(getNotificationsForUser(currentUser));
  };

  // Switch active user (strictly Admin only)
  const handleSwitchUser = (user: User) => {
    if (currentUser?.role !== 'admin') {
      return;
    }
    saveSession(user);
    setCurrentUser(user);
    setNotifications(getNotificationsForUser(user));
    if (user.role !== 'admin' && currentTab === 'admin') {
      setCurrentTab('table');
    }
  };

  // Admin user management: Add User / Employee (strictly Admin only)
  const handleAddUser = (userData: Partial<User> & { password?: string }) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Only admin can create employee accounts');
      return;
    }
    const currentUsers = getStoredUsers();
    const newUser: User = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      employeeId: userData.employeeId || `EMP-${String(currentUsers.length + 1).padStart(3, '0')}`,
      username: userData.username || 'user',
      name: userData.name || 'New Staff',
      role: userData.role || 'sales',
      email: userData.email || `${userData.username}@localcrm.internal`,
      avatarColor: userData.role === 'admin' ? 'bg-amber-600' : 'bg-emerald-600',
      active: true,
      createdAt: new Date().toISOString(),
      passwordHash: userData.password || 'password123',
      rawPassword: userData.password || 'password123',
    };

    const updatedUsers = [...currentUsers, newUser];
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    if (currentUser) {
      logAudit(
        'CREATE_USER',
        `Created employee ID ${newUser.employeeId} for ${newUser.name} (@${newUser.username})`,
        currentUser,
        'admin'
      );
    }
    syncEngine.broadcastLocalChange(currentUser);
    setSyncToast(`Created employee ${newUser.name} (${newUser.employeeId}).`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Admin user management: Update User (strictly Admin only)
  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Only admin can update employee accounts');
      return;
    }
    const currentUsers = getStoredUsers();
    const updatedUsers = currentUsers.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    if (currentUser) {
      logAudit('UPDATE_USER', `Updated settings for user ${userId}`, currentUser, 'admin');
    }
    syncEngine.broadcastLocalChange(currentUser);
  };

  // Admin user management: Remove / Delete Employee (strictly Admin only)
  const handleDeleteUser = (userId: string) => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Only admin can delete employee accounts');
      return;
    }
    if (userId === 'user_admin') {
      alert('Cannot delete the primary Administrator account (Amey Kulkarni).');
      return;
    }
    if (currentUser && userId === currentUser.id) {
      alert('Cannot delete the currently logged in account.');
      return;
    }
    const currentUsers = getStoredUsers();
    const target = currentUsers.find((u) => u.id === userId);
    const updatedUsers = currentUsers.filter((u) => u.id !== userId);
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    if (currentUser && target) {
      logAudit(
        'DELETE_USER',
        `Removed employee "${target.name}" (${target.employeeId || target.username})`,
        currentUser,
        'admin'
      );
    }
    syncEngine.broadcastLocalChange(currentUser);
    setSyncToast(`Removed employee ${target?.name || ''}.`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleResetDatabase = () => {
    if (currentUser?.role !== 'admin') {
      console.warn('Unauthorized: Only admin can reset database');
      return;
    }
    resetDatabaseToDefaults();
    reloadFromStorage();
    if (currentUser) {
      logAudit('RESET_DATABASE', 'Reset database to clean default state with Amey Kulkarni', currentUser, 'admin');
    }
    syncEngine.broadcastLocalChange(currentUser);
  };

  const handleLogout = () => {
    if (currentUser) {
      logAudit('USER_LOGOUT', `Logged out on local machine`, currentUser, 'auth');
    }
    saveSession(null);
    setCurrentUser(null);
    setCurrentTab('table');
  };

  // If not authenticated, show login screen with quick test credentials
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          saveSession(user);
          setCurrentUser(user);
          reloadFromStorage();
        }}
      />
    );
  }

  const unreadCount = notifications.filter((n) => !n.readBy.includes(currentUser.id)).length;
  const openTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        allUsers={users}
        currentTab={currentTab}
        unreadNotificationsCount={unreadCount}
        openTasksCount={openTasksCount}
        onSelectTab={(tab) => {
          if (tab === 'admin' && currentUser?.role !== 'admin') {
            setCurrentTab('table');
            return;
          }
          setCurrentTab(tab);
        }}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
      />

      {/* Main App Content */}
      <main className="flex-1">
        {currentTab === 'table' && (
          <FixedTableView
            leads={leads}
            users={users}
            currentUser={currentUser}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onBulkDeleteLeads={handleBulkDeleteLeads}
            onOpenImporter={() => setIsImporterOpen(true)}
            onOpenAddLead={() => setIsAddLeadOpen(true)}
            onAddNoteReview={handleAddNoteReview}
            onBulkReassignPipelinedLeads={handleBulkReassignPipelinedLeads}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksView
            currentUser={currentUser}
            users={users}
            leads={leads}
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onBulkDeleteTasks={handleBulkDeleteTasks}
          />
        )}

        {currentTab === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            currentUser={currentUser}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onNavigateToLead={(leadId) => {
              const target = leads.find((l) => l.id === leadId);
              if (target) {
                setSearchQuery(target.name);
              }
              setCurrentTab('table');
            }}
            onOpenAddNote={(leadId) => {
              const target = leads.find((l) => l.id === leadId);
              if (target) {
                setQuickNoteLead(target);
              }
            }}
          />
        )}

        {currentTab === 'admin' && currentUser.role === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            users={users}
            leads={leads}
            tasks={tasks}
            auditLogs={auditLogs}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onBulkDeleteTasks={handleBulkDeleteTasks}
            onResetDatabase={handleResetDatabase}
            onBulkReassignPipelinedLeads={handleBulkReassignPipelinedLeads}
          />
        )}

        {currentTab === 'admin' && currentUser.role !== 'admin' && (
          <div className="max-w-md mx-auto my-20 p-8 bg-neutral-900 border border-neutral-800 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Admin Access Restricted</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Employee accounts cannot access admin dashboards, employee rosters, or system configurations. You have access to your personal profile, fixed tables, and assigned tasks.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setCurrentTab('table')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Go to Leads Table
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition"
              >
                My Profile &amp; Password
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Profile Edit Modal (Allows Sales Rep & Admin to change their display name and password) */}
      <ProfileModal
        currentUser={currentUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogout}
      />

      {/* Universal Document Importer Modal (CSV, Excel, PDF, JSON) */}
      <DataImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportComplete={handleImportComplete}
        users={users}
        currentUser={currentUser}
      />

      {/* Add New Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        users={users}
        currentUser={currentUser}
        onAddLead={handleAddLead}
      />

      {/* Quick Note/Review Modal (from Notifications View or Row) */}
      <AddNoteReviewModal
        isOpen={!!quickNoteLead}
        onClose={() => setQuickNoteLead(null)}
        lead={quickNoteLead}
        currentUser={currentUser}
        onSubmit={handleAddNoteReview}
      />

      {/* Real-time Notification Toast */}
      <SyncNotification message={syncToast} onDismiss={() => setSyncToast(null)} />
    </div>
  );
}
