import React from 'react';
import { Provider } from 'react-redux';
import { store, useAppSelector } from './src/shared/redux/store';
import { LoginScreen } from './src/features/user/presentation/screens/LoginScreen';
import { SignUpScreen } from './src/features/user/presentation/screens/SignUpScreen';
import { OnboardingScreen } from './src/features/user/presentation/screens/OnboardingScreen';
import { DashboardScreen } from './src/features/coaching/presentation/screens/DashboardScreen';
import { WorkoutScreen } from './src/features/tracking/presentation/screens/WorkoutScreen';
import { RunSummaryScreen } from './src/features/tracking/presentation/screens/RunSummaryScreen';
import { StatusBar, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}

function AppContent() {
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : !user ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="ActiveWorkout" component={WorkoutScreen} />
            <Stack.Screen name="RunSummary" component={RunSummaryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

