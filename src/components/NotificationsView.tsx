import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Star, 
  MessageSquare, 
  FileText, 
  Flame, 
  UploadCloud, 
  DollarSign, 
  ShieldAlert, 
  ArrowRight, 
  Filter, 
  Search,
  ExternalLink,
  PlusCircle,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { NotificationItem, User, NotificationType } from '../types';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  currentUser: User;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToLead?: (leadId: string) => void;
  onOpenAddNote?: (leadId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToLead,
  onOpenAddNote,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'notes_remarks' | 'reviews' | 'priority' | 'data'>('all');
  const [search, setSearch] = useState('');

  const unreadCount = notifications.filter((n) => !n.readBy.includes(currentUser.id)).length;

  const filtered = notifications.filter((n) => {
    // Category filter
    if (filterType === 'notes_remarks' && n.type !== 'note_added' && n.type !== 'remark_added') return false;
    if (filterType === 'reviews' && n.type !== 'review_added') return false;
    if (filterType === 'priority' && n.type !== 'priority_changed') return false;
    if (filterType === 'data' && n.type !== 'lead_imported' && n.type !== 'lead_created') return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.leadName && n.leadName.toLowerCase().includes(q)) ||
        (n.leadCompany && n.leadCompany.toLowerCase().includes(q)) ||
        n.actorName.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'priority_changed':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'review_added':
        return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />;
      case 'remark_added':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'note_added':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'lead_imported':
        return <UploadCloud className="w-4 h-4 text-emerald-400" />;
      case 'lead_created':
        return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'stage_changed':
      case 'value_changed':
        return <DollarSign className="w-4 h-4 text-purple-400" />;
      case 'admin_action':
        return <ShieldAlert className="w-4 h-4 text-neutral-400" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'priority_changed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">Priority Alert</span>;
      case 'review_added':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20">Review</span>;
      case 'remark_added':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">Remark</span>;
      case 'note_added':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Note</span>;
      case 'lead_imported':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Import Batch</span>;
      case 'lead_created':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">New Lead</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300">Update</span>;
    }
  };

  return (
    <div id="notifications-feed-container" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Perspective Info Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Notification &amp; Activity Stream</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {currentUser.role === 'admin' ? (
                  <span className="text-amber-300 font-medium">
                    Admin Scope: Viewing all organization events (imports, leads, priority escalations, notes, reviews, &amp; changes).
                  </span>
                ) : (
                  <span className="text-emerald-300 font-medium">
                    Sales Rep Scope: Filtered stream focusing on priority updates, notes, remarks, reviews, and new leads.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterType === 'all'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('notes_remarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filterType === 'notes_remarks'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3 h-3 text-sky-400" />
              <span>Notes &amp; Remarks</span>
            </button>
            <button
              onClick={() => setFilterType('reviews')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filterType === 'reviews'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400" />
              <span>Reviews</span>
            </button>
            <button
              onClick={() => setFilterType('priority')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filterType === 'priority'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Priority Alerts</span>
            </button>
            <button
              onClick={() => setFilterType('data')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filterType === 'data'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <UploadCloud className="w-3 h-3 text-emerald-400" />
              <span>Imports &amp; Leads</span>
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs placeholder:text-neutral-600 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto mb-3">
              <Bell className="w-6 h-6 opacity-40" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-200">No notifications found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
              {filterType !== 'all' 
                ? 'Try clearing your filter or selecting "All" to view available notifications.'
                : 'When you or colleagues import documents, update priorities, or add notes and reviews, they will appear here in real time.'}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isUnread = !item.readBy.includes(currentUser.id);
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition relative ${
                  isUnread
                    ? 'bg-neutral-900/90 border-neutral-700/90 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon container */}
                    <div className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getIconForType(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {getTypeBadge(item.type)}
                        <h4 className="font-semibold text-sm text-white truncate">{item.title}</h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Unread" />
                        )}
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed break-words">{item.message}</p>

                      {/* Snippet / Rating banner if available */}
                      {item.metadata?.reviewRating && (
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg w-fit text-xs text-amber-300 font-medium">
                          <span className="flex text-amber-400">{'★'.repeat(item.metadata.reviewRating)}</span>
                          <span>Rating Score: {item.metadata.reviewRating}/5</span>
                        </div>
                      )}

                      {/* Lead association & author info */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-neutral-800/60 text-[11px] text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-4 h-4 rounded-full ${item.actorAvatarColor || 'bg-neutral-700'} flex items-center justify-center text-[9px] text-white uppercase font-bold`}
                          >
                            {item.actorName.slice(0, 1)}
                          </div>
                          <span>
                            By <strong className="text-neutral-200">{item.actorName}</strong> ({item.actorRole})
                          </span>
                        </div>

                        {item.leadName && (
                          <span className="inline-flex items-center gap-1 text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                            Target: <strong className="text-white">{item.leadName}</strong> {item.leadCompany ? `(${item.leadCompany})` : ''}
                          </span>
                        )}

                        <span className="text-neutral-500 ml-auto">
                          {new Date(item.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start">
                    {item.leadId && onNavigateToLead && (
                      <button
                        onClick={() => onNavigateToLead(item.leadId!)}
                        title="View Lead in Fixed Table"
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1 text-xs px-2"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">View Lead</span>
                      </button>
                    )}

                    {item.leadId && onOpenAddNote && (
                      <button
                        onClick={() => onOpenAddNote(item.leadId!)}
                        title="Add Note/Reply"
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1 text-xs px-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span className="hidden sm:inline">Reply</span>
                      </button>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => onMarkAsRead(item.id)}
                        title="Mark as Read"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
