import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/shared/redux/store';
import { OnboardingScreen } from './src/features/user/presentation/screens/OnboardingScreen';
import { DashboardScreen } from './src/features/coaching/presentation/screens/DashboardScreen';
import { WorkoutScreen } from './src/features/tracking/presentation/screens/WorkoutScreen';
import { RunSummaryScreen } from './src/features/tracking/presentation/screens/RunSummaryScreen';
import { RootStackParamList } from './src/shared/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <Provider store={store}>
      <View style={styles.container}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Onboarding"
            screenOptions={{
              headerStyle: { 
                backgroundColor: '#0F0F12', 
                borderBottomWidth: 1, 
                borderColor: 'rgba(255,255,255,0.05)' 
              },
              headerTintColor: '#FFF',
              headerTitleStyle: { fontWeight: '800', letterSpacing: 0.5 },
              cardStyle: { backgroundColor: '#0F0F12' },
            }}
          >
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ 
                title: 'RunnaCoach', 
                headerLeft: () => null,
                gestureEnabled: false
              }} 
            />
            <Stack.Screen 
              name="ActiveWorkout" 
              component={WorkoutScreen} 
              options={{ 
                title: 'Tracking Session', 
                headerLeft: () => null,
                gestureEnabled: false
              }} 
            />
            <Stack.Screen 
              name="RunSummary" 
              component={RunSummaryScreen} 
              options={{ 
                title: 'Workout Details', 
                headerLeft: () => null,
                gestureEnabled: false
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
});
