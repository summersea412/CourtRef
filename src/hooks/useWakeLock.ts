import { useEffect, useRef } from 'react';

type WakeLockSentinelLike = { released: boolean; release: () => Promise<void> };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };

export function useWakeLock(enabled: boolean): void {
  const sentinel = useRef<WakeLockSentinelLike | null>(null);
  useEffect(() => {
    const browserNavigator = navigator as WakeLockNavigator;
    if (!enabled || !browserNavigator.wakeLock) return undefined;
    let disposed = false;
    const request = async () => { try { const next = await browserNavigator.wakeLock?.request('screen'); if (!disposed) sentinel.current = next ?? null; } catch { sentinel.current = null; } };
    const onVisibility = () => { if (document.visibilityState === 'visible' && !disposed && !sentinel.current) void request(); };
    void request(); document.addEventListener('visibilitychange', onVisibility);
    return () => { disposed = true; document.removeEventListener('visibilitychange', onVisibility); const current = sentinel.current; sentinel.current = null; if (current && !current.released) void current.release().catch(() => undefined); };
  }, [enabled]);
}
