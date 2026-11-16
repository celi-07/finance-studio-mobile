import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../state/auth';
import {
  Body,
  Brand,
  Button,
  ErrorNote,
  Glyph,
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
  const [passwordMode, setPasswordMode] = useState(false);
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
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: 22, justifyContent: 'center' }}
        >
          <View style={{ width: '100%', maxWidth: 480, alignSelf: 'center', gap: 26 }}>
            <Brand />
            <View style={{ gap: 9 }}>
              <Body muted size={13}>
                YOUR MONEY, IN PERSPECTIVE
              </Body>
              <Title size={39}>A clearer view of{'\n'}your finances.</Title>
              <Body muted>
                Income, spending, reimbursements and investments. One familiar studio, wherever you
                go.
              </Body>
            </View>
            <Panel tone="orchid">
              <Glyph icon={verifying ? ShieldCheck : Mail} tone="orchid" />
              <Title size={23}>
                {verifying ? 'Verify your email' : 'Welcome to Finance Studio'}
              </Title>
              {auth.error && <ErrorNote>{auth.error}</ErrorNote>}
              {!auth.client ? (
                <Body muted>
                  {auth.error ||
                    'Explore the fictional demo. Add the website’s Supabase settings to connect your real account.'}
                </Body>
              ) : verifying ? (
                <>
                  <Body muted>
                    Enter the code sent to {pendingEmail}. This is the same email verification used
                    by the website.
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
                  <Body muted>Sign in with the account you use on the website.</Body>
                  {mode !== 'email' && (
                    <Button
                      secondary
                      busy={task.busy}
                      onPress={() => task.run(() => auth.oauth('google'))}
                    >
                      Continue with Google
                    </Button>
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
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  {passwordMode && (
                    <Input
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete="current-password"
                    />
                  )}
                  <Button
                    icon={ArrowRight}
                    busy={task.busy}
                    onPress={() =>
                      task.run(async () => {
                        if (!passwordMode) return send();
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
                  {mode !== 'oauth' && (
                    <Button
                      quiet
                      disabled={task.busy}
                      onPress={() => setPasswordMode(!passwordMode)}
                    >
                      {passwordMode ? 'Use an email code' : 'Use a password'}
                    </Button>
                  )}
                </>
              )}
              {task.error && <ErrorNote>{task.error}</ErrorNote>}
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
