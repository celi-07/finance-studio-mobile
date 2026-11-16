import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { cloudRepository } from '../data/repository';
import { demoRepository } from '../data/demo-repository';
import { WorkspaceStore } from './workspace-store';
import { useAuth } from './auth';

const Context = createContext<WorkspaceStore>(null!);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { client, session, demo } = useAuth();
  const [store] = useState(
    () => new WorkspaceStore(demo ? demoRepository() : cloudRepository(client!, session!.user.id)),
  );
  useEffect(() => {
    void store.refresh();
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void store.refresh();
    });
    const network = NetInfo.addEventListener((state) => {
      if (state.isConnected && AppState.currentState === 'active') void store.refresh();
    });
    // Polling remains a fallback when the existing project doesn't publish Realtime tables.
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void store.refresh();
    }, 30_000);
    const channel =
      !demo && client
        ? client
            .channel('finance-mobile-' + session!.user.id)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', filter: 'user_id=eq.' + session!.user.id },
              () => {
                void store.refresh();
              },
            )
            .subscribe()
        : null;
    return () => {
      store.dispose();
      foreground.remove();
      network();
      clearInterval(timer);
      if (channel) void client!.removeChannel(channel);
    };
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useWorkspace() {
  const store = useContext(Context);
  return { ...useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot), store };
}
