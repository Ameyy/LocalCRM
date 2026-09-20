import { SyncPacket, Lead, User, AuditLog, NotificationItem, CrmTask } from '../types';
import { 
  getDeviceId, 
  getDeviceName, 
  getStoredLeads, 
  getStoredUsers, 
  getStoredTasks,
  getStoredAudit, 
  getStoredNotifications,
  saveLeads, 
  saveUsers, 
  saveTasks,
  saveNotifications,
  mergeLeads, 
  mergeUsers, 
  mergeTasks,
  mergeAuditLogs,
  mergeNotifications
} from './storage';
import { syncWithServer } from './api';

type SyncListener = (event: {
  type: 'leads_updated' | 'sync_success';
  payload?: any;
}) => void;

class LocalSyncEngine {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();
  private tabId: string = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

  constructor() {
    this.initBroadcastChannel();
    this.initStorageListener();
  }

  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('LOCAL_CRM_OFFLINE_SYNC');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingBroadcast(event.data);
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported in this environment', err);
    }
  }

  private initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (
          event.key === 'localcrm_leads_v1' ||
          event.key === 'localcrm_notifications_v1' ||
          event.key === 'localcrm_users_v1' ||
          event.key === 'localcrm_tasks_v1' ||
          event.key === 'localcrm_audit_v1'
        ) {
          this.emit({ type: 'leads_updated', payload: { source: 'storage_event', key: event.key } });
        }
      });
    }
  }

  public subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: { type: 'leads_updated' | 'sync_success'; payload?: any }) {
    this.listeners.forEach((fn) => fn(event));
  }

  public createSyncPacket(currentUser?: User | null): SyncPacket {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      senderDeviceId: getDeviceId(),
      senderName: getDeviceName(),
      leads: getStoredLeads(),
      users: getStoredUsers(),
      tasks: getStoredTasks(),
      auditLogs: getStoredAudit(),
      notifications: getStoredNotifications(),
    };
  }

  /**
   * Broadcast local state change to all local browser tabs / windows and backend server
   */
  public broadcastLocalChange(currentUser?: User | null) {
    const packet = this.createSyncPacket(currentUser);
    
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'LOCAL_SYNC_PACKET',
        senderTabId: this.tabId,
        packet,
      });
    }

    // Also push to persistent backend API so other URLs/devices get the updates instantly
    syncWithServer({
      leads: packet.leads,
      users: packet.users,
      tasks: packet.tasks,
      notifications: packet.notifications,
      auditLogs: packet.auditLogs,
    }).catch(() => {
      // offline fallback
    });

    this.emit({ type: 'leads_updated', payload: { source: 'local' } });
  }

  private handleIncomingBroadcast(data: any) {
    if (!data || !data.packet) return;
    // Don't loop back message sent by this specific tab
    if (data.senderTabId === this.tabId) return;

    this.applyIncomingPacket(data.packet, `BroadcastChannel (${data.packet.senderName || 'Peer Tab'})`);
  }

  /**
   * Apply incoming data packet with Last-Write-Wins (LWW) conflict resolution
   */
  public applyIncomingPacket(packet: SyncPacket, sourceDescription: string): { changes: number } {
    const localLeads = getStoredLeads();
    const localUsers = getStoredUsers();
    const localTasks = getStoredTasks();
    const localAudit = getStoredAudit();
    const localNotifs = getStoredNotifications();

    const { merged: mergedLeads, changesCount: leadChanges } = mergeLeads(localLeads, packet.leads || []);
    const { merged: mergedUsers, changesCount: userChanges } = mergeUsers(localUsers, packet.users || []);
    const { merged: mergedTasks, changesCount: taskChanges } = mergeTasks(localTasks, packet.tasks || []);
    const mergedAudit = mergeAuditLogs(localAudit, packet.auditLogs || []);
    const mergedNotifs = mergeNotifications(localNotifs, packet.notifications || []);

    if (leadChanges > 0 || userChanges > 0 || taskChanges > 0) {
      saveLeads(mergedLeads);
      saveUsers(mergedUsers);
      saveTasks(mergedTasks);
    }

    localStorage.setItem('localcrm_audit_v1', JSON.stringify(mergedAudit));
    saveNotifications(mergedNotifs);

    const totalChanges = leadChanges + userChanges + taskChanges;

    this.emit({
      type: 'sync_success',
      payload: {
        source: sourceDescription,
        senderName: packet.senderName,
        changesCount: totalChanges,
        timestamp: new Date().toISOString(),
      },
    });

    this.emit({ type: 'leads_updated', payload: { source: sourceDescription } });

    return { changes: totalChanges };
  }

  public exportSyncBundle(currentUser?: User | null): string {
    const packet = this.createSyncPacket(currentUser);
    const jsonStr = JSON.stringify(packet, null, 2);
    
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `local-crm-data-${dateStr}.crmpack`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return `local-crm-data-${dateStr}.crmpack`;
  }

  public async importSyncBundleFile(file: File): Promise<{ changes: number }> {
    const text = await file.text();
    const packet: SyncPacket = JSON.parse(text);
    if (!packet || !Array.isArray(packet.leads)) {
      throw new Error('Invalid CRM data bundle format');
    }
    return this.applyIncomingPacket(packet, `File Import (${file.name})`);
  }
}

export const syncEngine = new LocalSyncEngine();

