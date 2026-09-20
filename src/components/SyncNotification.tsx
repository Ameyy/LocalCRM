import React from 'react';
import { CheckCircle2, Radio, X } from 'lucide-react';

interface SyncNotificationProps {
  message: string | null;
  onDismiss: () => void;
}

export const SyncNotification: React.FC<SyncNotificationProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      id="sync-live-toast"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 py-2.5 px-4 rounded-xl bg-neutral-900 border border-emerald-500/40 text-neutral-100 shadow-2xl animate-bounce-short"
    >
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <Radio className="w-3.5 h-3.5 animate-pulse" />
      </div>
      <div className="text-xs">
        <span className="font-semibold text-emerald-400">Local Peer Sync</span>
        <p className="text-neutral-300 text-[11px]">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-neutral-500 hover:text-white p-1 rounded-md transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
