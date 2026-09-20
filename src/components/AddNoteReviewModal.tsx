import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Star, 
  FileText, 
  CheckCircle2, 
  User, 
  Sparkles,
  Send
} from 'lucide-react';
import { Lead, User as UserType } from '../types';

interface AddNoteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  currentUser: UserType;
  onSubmit: (leadId: string, type: 'note' | 'remark' | 'review', content: string, rating?: number) => void;
}

export const AddNoteReviewModal: React.FC<AddNoteReviewModalProps> = ({
  isOpen,
  onClose,
  lead,
  currentUser,
  onSubmit,
}) => {
  const [entryType, setEntryType] = useState<'note' | 'remark' | 'review'>('note');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit(lead.id, entryType, content.trim(), entryType === 'review' ? rating : undefined);
    setContent('');
    onClose();
  };

  const existingEntries = lead.notesLog || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="note-review-modal" 
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">Add Note, Remark or Review</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Synced
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Target: <span className="text-white font-medium">{lead.name}</span> ({lead.company})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Entry Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Entry Type
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setEntryType('note')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition ${
                  entryType === 'note'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Note</span>
              </button>

              <button
                type="button"
                onClick={() => setEntryType('remark')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition ${
                  entryType === 'remark'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Remark</span>
              </button>

              <button
                type="button"
                onClick={() => setEntryType('review')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition ${
                  entryType === 'review'
                    ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Review</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {entryType === 'note' && 'Notes are stored and notified to team members for day-to-day context.'}
              {entryType === 'remark' && 'Remarks highlight observations, client statements, or important flags.'}
              {entryType === 'review' && 'Reviews allow rating the deal quality and leaving administrative feedback.'}
            </p>
          </div>

          {/* Review Rating Stars */}
          {entryType === 'review' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
              <label className="block text-xs font-semibold text-amber-300 mb-1.5">
                Rating / Deal Assessment
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-neutral-600 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-neutral-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-400 ml-2">
                  {rating} of 5 Stars ({rating >= 4 ? 'High Quality' : rating === 3 ? 'Moderate' : 'Needs Attention'})
                </span>
              </div>
            </div>
          )}

          {/* Textarea */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                {entryType === 'review' ? 'Review Comments' : entryType === 'remark' ? 'Remark Text' : 'Note Content'}
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  entryType === 'review'
                    ? 'e.g., Reviewed contract terms. Close probability is 85%. Client requests priority shipping SLA...'
                    : entryType === 'remark'
                    ? 'e.g., Key stakeholder mentioned budget approval is expected by Thursday afternoon...'
                    : 'e.g., Followed up regarding customized pricing for their multi-location deployment...'
                }
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden placeholder:text-neutral-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Posting as <strong>{currentUser.name}</strong> ({currentUser.role === 'admin' ? 'Admin' : 'Sales Rep'})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post &amp; Notify</span>
                </button>
              </div>
            </div>
          </form>

          {/* Previous Notes & Reviews History */}
          {existingEntries.length > 0 && (
            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Previous Activity &amp; Remarks ({existingEntries.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {existingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            entry.type === 'review'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : entry.type === 'remark'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {entry.type}
                        </span>
                        <span className="font-semibold text-white">{entry.authorName}</span>
                        <span className="text-[10px] text-neutral-500 capitalize">({entry.authorRole})</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                        {entry.rating && (
                          <span className="flex items-center text-amber-400 font-bold">
                            {'★'.repeat(entry.rating)}
                          </span>
                        )}
                        <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-neutral-300 pl-1">{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
