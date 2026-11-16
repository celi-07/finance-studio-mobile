import 'react-native-url-polyfill/auto';
import 'core-js/actual/map/group-by';
import 'core-js/actual/array/to-sorted';
import 'core-js/actual/array/to-reversed';
import { ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  ChartNoAxesCombined,
  HandCoins,
  PanelsTopLeft,
  ReceiptText,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native';
import { ThemeProvider, useTheme } from './src/ui/theme';
import { AuthProvider, useAuth } from './src/state/auth';
import { WorkspaceProvider } from './src/state/workspace';
import { FinanceProvider } from './src/state/finance';
import { AuthScreen } from './src/screens/AuthScreen';
import { Overview } from './src/screens/Overview';
import { Transactions } from './src/screens/Transactions';
import { Reimbursements } from './src/screens/Reimbursements';
import { Investments } from './src/screens/Investments';
import { Assistant } from './src/screens/Assistant';
import { Settings } from './src/screens/Settings';
import { Editors } from './src/components/Editors';

const Tabs = createBottomTabNavigator();
function Studio() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const icons = {
    Overview: PanelsTopLeft,
    Transactions: ReceiptText,
    Reimbursements: HandCoins,
    Investments: ChartNoAxesCombined,
    Assistant: Sparkles,
    Settings: SlidersHorizontal,
  };
  const labels = {
    Overview: 'Overview',
    Transactions: 'Entries',
    Reimbursements: 'Claims',
    Investments: 'Invest',
    Assistant: 'Assistant',
    Settings: 'Settings',
  };
  return (
    <NavigationContainer
      theme={{
        ...(t.dark ? DarkTheme : DefaultTheme),
        colors: {
          ...(t.dark ? DarkTheme : DefaultTheme).colors,
          background: 'transparent',
          text: t.ink,
          primary: t.accent,
          card: t.surface,
          border: t.line,
        },
      }}
    >
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarLabel: labels[route.name as keyof typeof labels],
          tabBarIcon: ({ color, size }) => {
            const Icon = icons[route.name as keyof typeof icons];
            return <Icon color={color} size={Math.min(size, 21)} strokeWidth={1.7} />;
          },
          tabBarActiveTintColor: t.accent,
          tabBarInactiveTintColor: t.ink,
          tabBarActiveBackgroundColor: t.dark ? '#ffffff18' : '#ffffff88',
          tabBarItemStyle: { borderRadius: 15, paddingVertical: 4, marginHorizontal: 1 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
          tabBarStyle: {
            position: 'absolute',
            left: 9,
            right: 9,
            bottom: Math.max(9, insets.bottom),
            height: 65,
            paddingBottom: 5,
            paddingTop: 5,
            paddingHorizontal: 4,
            borderRadius: 22,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: t.strongLine,
            overflow: 'hidden',
            elevation: 8,
            backgroundColor: 'transparent',
            maxWidth: 650,
            marginHorizontal: 'auto',
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={[t.navStart, t.navEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          ),
        })}
      >
        <Tabs.Screen name="Overview" component={Overview} />
        <Tabs.Screen name="Transactions" component={Transactions} />
        <Tabs.Screen name="Reimbursements" component={Reimbursements} />
        <Tabs.Screen name="Investments" component={Investments} />
        <Tabs.Screen name="Assistant" component={Assistant} />
        <Tabs.Screen name="Settings" component={Settings} />
      </Tabs.Navigator>
      <Editors />
    </NavigationContainer>
  );
}
function Root() {
  const t = useTheme();
  const auth = useAuth();
  return (
    <LinearGradient
      colors={[t.dark ? '#352954' : '#ddd1f7', t.canvas, t.dark ? '#194044' : '#d0ebe6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {!auth.ready ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : auth.demo || auth.verified ? (
        <WorkspaceProvider key={auth.demo ? 'demo' : auth.session!.user.id}>
          <FinanceProvider>
            <Studio />
          </FinanceProvider>
        </WorkspaceProvider>
      ) : (
        <AuthScreen />
      )}
    </LinearGradient>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
