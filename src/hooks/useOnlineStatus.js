/**
 * @file `useOnlineStatus` — reactive browser connectivity flag used by the
 * offline badge and the auto-sync trigger (spec PHASE 9).
 */

import { useEffect, useState } from 'react';

/**
 * @returns {boolean} true when the browser reports an online connection.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
