import { useState } from 'react';
import {
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../state/auth';
import {
  Body,
  Brand,
  Button,
  ErrorNote,
  GoogleMark,
  Input,
  Panel,
  Title,
  useSubmission,
} from '../ui/primitives';

export function AuthScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [passwordMode, setPasswordMode] = useState(true);
  const task = useSubmission();
  const [retryAfter, setRetryAfter] = useState(0);
  const pendingEmail = auth.session?.user.email ?? sentTo;
  const verifying = !!auth.session || !!sentTo;
  const mode = process.env.EXPO_PUBLIC_AUTH_MODE ?? 'google';
  async function send() {
    const target = auth.session?.user.email ?? email.trim();
    if (!/^\S+@\S+\.\S+$/.test(target)) throw Error('Enter your email address.');
    if (Date.now() < retryAfter) throw Error('Wait a minute before requesting another code.');
    const { error } = await auth.client!.auth.signInWithOtp({
      email: target,
      options: { shouldCreateUser: false },
    });
    if (error) throw Error('Couldn’t send your code. Check your email or try again later.');
    setSentTo(target);
    setRetryAfter(Date.now() + 60_000);
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}
        >
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', gap: 26 }}>
            <Panel tone="orchid" style={{ padding: 24, gap: 20, borderRadius: 24 }}>
              <Brand />
              <View style={{ gap: 8, marginTop: 8 }}>
                <Title size={28}>
                  {verifying ? 'Verify your email' : 'Sign in to Finance Studio'}
                </Title>
                <Body muted>
                  {verifying
                    ? 'One more step to protect your records.'
                    : 'Manage your finances in one place.'}
                </Body>
              </View>
              {!!auth.error && <ErrorNote>{auth.error}</ErrorNote>}
              {!auth.client ? (
                <Body muted>
                  {auth.error ||
                    'Explore the fictional demo. Add the website’s Supabase settings to connect your real account.'}
                </Body>
              ) : verifying ? (
                <>
                  <Body muted>
                    Enter the code sent to {pendingEmail}. This is the same email verification used
                    by the website. Check your spam or junk folder if it has not arrived.
                  </Body>
                  <Input
                    label="Email code"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={10}
                  />
                  <Button
                    busy={task.busy}
                    onPress={() =>
                      task.run(async () => {
                        if (!/^\d{6,10}$/.test(code.trim()))
                          throw Error('Enter the code from your email.');
                        const { error } = await auth.client!.auth.verifyOtp({
                          email: pendingEmail!,
                          token: code.trim(),
                          type: 'email',
                        });
                        if (error)
                          throw Error(
                            'That code expired or is incorrect. Request another code and try again.',
                          );
                      })
                    }
                  >
                    Verify and continue
                  </Button>
                  <Button secondary disabled={task.busy} onPress={() => task.run(send)}>
                    {sentTo ? 'Resend code' : 'Send verification code'}
                  </Button>
                  <Button
                    quiet
                    disabled={task.busy}
                    onPress={() =>
                      task.run(async () => {
                        await auth.signOut();
                        setSentTo('');
                        setCode('');
                      })
                    }
                  >
                    Back to sign in
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                  {passwordMode && (
                    <Input
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="current-password"
                      textContentType="password"
                      autoCapitalize="none"
                    />
                  )}
                  {mode !== 'email' && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Continue with Google"
                      accessibilityState={{ disabled: task.busy, busy: task.busy }}
                      disabled={task.busy}
                      onPress={() => task.run(() => auth.oauth('google'))}
                      style={({ pressed }) => ({
                        minHeight: 50,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#747775',
                        backgroundColor: '#ffffff',
                        flexDirection: 'row',
                        gap: 12,
                        alignItems: 'center',
                        opacity: task.busy ? 0.5 : pressed ? 0.75 : 1,
                      })}
                    >
                      {task.busy ? (
                        <ActivityIndicator color="#1f1f1f" size="small" />
                      ) : (
                        <GoogleMark />
                      )}
                      <Body color="#1f1f1f" style={{ flex: 1, textAlign: 'center' }}>
                        Continue with Google
                      </Body>
                      <View style={{ width: 20 }} />
                    </Pressable>
                  )}
                  {(mode === 'oauth' || mode === 'transition') && (
                    <Button
                      secondary
                      disabled={task.busy}
                      onPress={() => task.run(() => auth.oauth('apple'))}
                    >
                      Continue with Apple
                    </Button>
                  )}
                  <Button
                    icon={ArrowRight}
                    busy={task.busy}
                    onPress={() =>
                      task.run(async () => {
                        if (!passwordMode) return send();
                        if (!/^\S+@\S+\.\S+$/.test(email.trim()))
                          throw Error('Enter your email address.');
                        if (!password) throw Error('Enter your password.');
                        const { error } = await auth.client!.auth.signInWithPassword({
                          email: email.trim(),
                          password,
                        });
                        if (error) throw Error('Couldn’t sign in. Check your email and password.');
                      })
                    }
                  >
                    {passwordMode ? 'Sign in' : 'Email me a sign-in code'}
                  </Button>
                  {
                    <Button
                      quiet
                      disabled={task.busy}
                      onPress={() => setPasswordMode(!passwordMode)}
                    >
                      {passwordMode ? 'Use an email code' : 'Use a password'}
                    </Button>
                  }
                </>
              )}
              {!verifying && auth.client && (
                <Button
                  quiet
                  disabled={task.busy}
                  onPress={() =>
                    task.run(async () => {
                      await WebBrowser.openBrowserAsync('https://finance-studio.whiteeorangee.com');
                    })
                  }
                >
                  Create an account or reset your password on the website
                </Button>
              )}
              {!!task.error && <ErrorNote>{task.error}</ErrorNote>}
            </Panel>
            <Button quiet disabled={task.busy} onPress={auth.enterDemo}>
              Explore the demo
            </Button>
            <Body muted size={11} style={{ textAlign: 'center' }}>
              Your existing sheets. Your existing accounts. The same Finance Studio.
            </Body>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
