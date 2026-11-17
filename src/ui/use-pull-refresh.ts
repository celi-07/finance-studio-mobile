import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../state/workspace';

export function usePullRefresh() {
  const { store } = useWorkspace();
  const [refreshing, setRefreshing] = useState(false);
  const active = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const onRefresh = useCallback(() => {
    if (active.current) return;
    active.current = true;
    setRefreshing(true);
    // Commit the controlled native spinner even when local demo data resolves immediately.
    void Promise.all([
      store.refresh(),
      new Promise<void>((resolve) => setTimeout(resolve, 300)),
    ]).finally(() => {
      active.current = false;
      if (mounted.current) setRefreshing(false);
    });
  }, [store]);
  return { refreshing, onRefresh };
}
