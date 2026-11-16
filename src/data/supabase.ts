import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import { readCloudConfig } from '../domain/ledger-cloud-config';
import { sessionStorage } from './secure-storage';
import { websitePublishableKey, websiteSupabaseUrl } from './public-config';

export function createConnection() {
  const overridden =
    process.env.EXPO_PUBLIC_SUPABASE_URL !== undefined ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== undefined;
  const config = readCloudConfig(
    overridden ? process.env.EXPO_PUBLIC_SUPABASE_URL : websiteSupabaseUrl,
    overridden ? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY : websitePublishableKey,
  );
  return config
    ? createClient(config.url, config.key, {
        auth: {
          storage: sessionStorage,
          lock: processLock,
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
}
