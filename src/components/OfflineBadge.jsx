/**
 * @file Connectivity badge + manual "Senkronize Et" action. Shows the current
 * online/offline state and, when offline games are pending, a button to push
 * them (spec PHASE 9 UI).
 */

import { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { storageService } from '../services/storageService.js';
import { syncAllOfflineGames } from '../services/syncService.js';
import { toast } from '../store/toastStore.js';

export default function OfflineBadge() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const pending = storageService.getUnsyncedGames().length;

  const handleSync = async () => {
    setSyncing(true);
    setProgress(0);
    const res = await syncAllOfflineGames(({ done, total }) =>
      setProgress(total ? Math.round((done / total) * 100) : 100),
    );
    setSyncing(false);
    toast.success(
      `Senkronizasyon tamam: ${res.synced} oyun` +
        (res.flagged ? `, ${res.flagged} inceleme kuyruğunda` : ''),
    );
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow ${
          isOnline ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
        }`}
        title={isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
      >
        <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-200' : 'bg-rose-200'}`} />
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>

      {isOnline && pending > 0 && (
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-timur-950 shadow hover:bg-gold-400 disabled:opacity-60"
        >
          {syncing ? `Gönderiliyor… ${progress}%` : `Senkronize Et (${pending})`}
        </button>
      )}
    </div>
  );
}
