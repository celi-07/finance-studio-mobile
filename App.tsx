import 'react-native-url-polyfill/auto';
import 'core-js/actual/map/group-by';
import 'core-js/actual/array/to-sorted';
import 'core-js/actual/array/to-reversed';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { routeLabels } from './src/ui/layout';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import { StudioTabBar } from './src/components/StudioTabBar';
import { BrandedSplash } from './src/components/BrandedSplash';

void SplashScreen.preventAutoHideAsync().catch(() => {});

const Tabs = createBottomTabNavigator();
function Studio() {
  const t = useTheme();
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
        tabBar={(props) => <StudioTabBar {...props} />}
        screenOptions={({ navigation, route }) => ({
          headerShown: false,
          title: routeLabels[route.name as keyof typeof routeLabels],
          sceneStyle: {
            backgroundColor: 'transparent',
            ...(Platform.OS === 'web' && !navigation.isFocused() ? { display: 'none' } : {}),
          },
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
function Root({ fontsReady }: { fontsReady: boolean }) {
  const t = useTheme();
  const auth = useAuth();
  useEffect(() => {
    if (fontsReady && auth.ready) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, auth.ready]);
  if (!fontsReady || !auth.ready) return <BrandedSplash fontsReady={fontsReady} />;
  return (
    <LinearGradient
      colors={[t.dark ? '#352954' : '#ddd1f7', t.canvas, t.dark ? '#194044' : '#d0ebe6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {auth.demo || auth.verified ? (
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
  const [loaded, fontError] = useFonts({
    FinanceRegular: require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    FinanceBold: require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
  });
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Root fontsReady={loaded || !!fontError} />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
