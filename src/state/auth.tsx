import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createConnection } from '../data/supabase';
import { readVerificationClaims } from '../domain/ledger-auth';

WebBrowser.maybeCompleteAuthSession();
type Auth = {
  client: SupabaseClient | null;
  session: Session | null;
  ready: boolean;
  verified: boolean;
  demo: boolean;
  enterDemo: () => void;
  leaveDemo: () => void;
  error: string;
  signOut: () => Promise<void>;
  oauth: (provider: 'google' | 'apple') => Promise<void>;
};
const Context = createContext<Auth>(null!);
export const useAuth = () => useContext(Context);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [connection] = useState(() => {
    try {
      return { client: createConnection(), error: '' };
    } catch (e) {
      return { client: null, error: (e as Error).message };
    }
  });
  const client = connection.client;
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!client);
  const [error, setError] = useState(connection.error);
  const [demo, setDemo] = useState(false);
  const oauthBusy = useRef(false);
  const consumed = useRef(new Set<string>());
  const redirectTo = Linking.createURL('auth/callback');

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    let authEvent = false;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      authEvent = true;
      setSession(next);
      setReady(true);
    });
    client.auth
      .getSession()
      .then(({ data, error: issue }) => {
        if (!mounted) return;
        if (issue) setError('Couldn’t restore your session. Please sign in again.');
        if (!authEvent) setSession(data.session);
        setReady(true);
      })
      .catch(() => {
        if (mounted) {
          setError('Couldn’t restore your session.');
          setReady(true);
        }
      });
    const refresh = (state: string) =>
      state === 'active' ? client.auth.startAutoRefresh() : client.auth.stopAutoRefresh();
    refresh(AppState.currentState ?? 'active');
    const app = AppState.addEventListener('change', refresh);
    return () => {
      mounted = false;
      subscription.unsubscribe();
      app.remove();
      client.auth.stopAutoRefresh();
    };
  }, [client]);

  async function finishOAuth(url: string) {
    if (!client) return;
    const incoming = new URL(url);
    const expected = new URL(redirectTo);
    if (
      incoming.protocol !== expected.protocol ||
      incoming.host !== expected.host ||
      incoming.pathname !== expected.pathname
    )
      return;
    if (incoming.searchParams.get('error'))
      throw Error('Sign-in was interrupted. Please try again.');
    const code = incoming.searchParams.get('code');
    if (!code || consumed.current.has(code)) return;
    consumed.current.add(code);
    const { error: issue } = await client.auth.exchangeCodeForSession(code);
    if (issue) throw Error('Couldn’t finish sign-in. Please start again.');
  }
  useEffect(() => {
    if (!client) return;
    const finish = (url: string) => {
      void finishOAuth(url).catch((e) => setError(e.message));
    };
    void Linking.getInitialURL()
      .then((url) => {
        if (url) finish(url);
      })
      .catch(() => {});
    const listener = Linking.addEventListener('url', ({ url }) => finish(url));
    return () => listener.remove();
  }, [client]);

  return (
    <Context.Provider
      value={{
        client,
        session,
        ready,
        error,
        demo,
        verified: !!session && !!readVerificationClaims(session.access_token)?.verified,
        enterDemo: () => setDemo(true),
        leaveDemo: () => setDemo(false),
        signOut: async () => {
          if (!client) return;
          const { error: issue } = await client.auth.signOut({ scope: 'local' });
          if (issue) throw Error('Couldn’t sign out. Please try again.');
          setSession(null);
        },
        oauth: async (provider) => {
          if (!client || oauthBusy.current) return;
          oauthBusy.current = true;
          try {
            const { data, error: issue } = await client.auth.signInWithOAuth({
              provider,
              options: { redirectTo, skipBrowserRedirect: true },
            });
            if (issue || !data.url)
              throw Error('Couldn’t start sign-in. Check that this provider is enabled.');
            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
            if (result.type === 'success') await finishOAuth(result.url);
          } finally {
            oauthBusy.current = false;
          }
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
