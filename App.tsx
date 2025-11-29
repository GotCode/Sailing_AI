import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import SailingScreen from './src/screens/SailingScreenEnhanced';
import RouteScreen from './src/screens/RouteScreenEnhanced';
import PolarScreen from './src/screens/PolarScreen';
import WeatherMonitorScreen from './src/screens/WeatherMonitorScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { initializeWindyService } from './src/services/windyService';

const WINDY_API_KEY_STORAGE = 'windy_api_key';

const Tab = createBottomTabNavigator();

function AuthNavigator() {
  const [showRegister, setShowRegister] = useState(false);

  return showRegister ? (
    <RegisterScreen onNavigateToLogin={() => setShowRegister(false)} />
  ) : (
    <LoginScreen onNavigateToRegister={() => setShowRegister(true)} />
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: '#0066CC',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Sailing"
        component={SailingScreen}
        options={{
          title: 'Lagoon 440 Sailing',
          tabBarLabel: 'Sailing',
        }}
      />
      <Tab.Screen
        name="Route"
        component={RouteScreen}
        options={{
          title: 'Route Management',
          tabBarLabel: 'Route',
        }}
      />
      <Tab.Screen
        name="Polar"
        component={PolarScreen}
        options={{
          title: 'Polar Diagram',
          tabBarLabel: 'Polar',
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherMonitorScreen}
        options={{
          title: 'Weather Monitor',
          tabBarLabel: 'Weather Monitor',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);

  // Load saved Windy API key on app start
  useEffect(() => {
    const loadWindyApiKey = async () => {
      try {
        const storedApiKey = await AsyncStorage.getItem(WINDY_API_KEY_STORAGE);
        if (storedApiKey) {
          initializeWindyService(storedApiKey);
          console.log('Windy API key loaded from storage');
        }
      } catch (err) {
        console.error('Failed to load Windy API key:', err);
      } finally {
        setApiKeyLoaded(true);
      }
    };

    loadWindyApiKey();
  }, []);

  if (isLoading || !apiKeyLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
