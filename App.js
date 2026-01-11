import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NetworkProvider } from './src/context/NetworkContext';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import HomeScreen from './screens/Home';
import LogWorkoutScreen from './screens/LogWorkout';
import ProgressScreen from './screens/Progress';
import ExercisesScreen from './screens/Exercises';
import ProfileScreen from './screens/Profile';
import BMICalculatorScreen from './screens/BMICalculator';
import ProgramsScreen from './screens/Programs';
import ProgramDetailScreen from './screens/ProgramDetail';
import ActiveProgramScreen from './screens/ActiveProgram';
import ExerciseDetailScreen from './screens/ExerciseDetail';
import WaterScreen from './screens/Water';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>💪 YouFit</Text>
      </View>
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>
      <View style={styles.drawerFooter}>
        <Text style={styles.drawerVersion}>Version 1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={CustomDrawerContent}
      screenOptions={{
        drawerStyle: styles.drawerStyle,
        drawerLabelStyle: styles.drawerLabel,
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{ drawerLabel: '🏠 Dashboard' }}
      />
      <Drawer.Screen
        name="Log Workout"
        component={LogWorkoutScreen}
        options={{ drawerLabel: '🏋️ Log Workout' }}
      />

      <Drawer.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ drawerLabel: '📊 Progress' }}
      />

      <Drawer.Screen
        name="Exercises"
        component={ExercisesScreen}
        options={{ drawerLabel: '💪 Exercises' }}
      />
      <Drawer.Screen
        name="BMI Calculator"
        component={BMICalculatorScreen}
        options={{ drawerLabel: '⚖️ BMI Calculator' }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ drawerLabel: '👤 Profile' }}
      />

      <Drawer.Screen
        name="Programs"
        component={ProgramsScreen}
        options={{ drawerLabel: '📋 Programs' }}
      />

      <Drawer.Screen
        name="My Program"
        component={ActiveProgramScreen}
        options={{ drawerLabel: '🎯 My Program' }}
      />

      <Drawer.Screen
        name="Water"
        component={WaterScreen}
        options={{ drawerLabel: '💧 Hydration' }}
      />

    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: { flex: 1 },
  drawerHeader: { padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  drawerHeaderText: { fontSize: 26, fontWeight: '800', color: '#667eea' },
  drawerItems: { paddingTop: 10 },
  drawerStyle: { backgroundColor: '#ffffff', width: 280 },
  drawerLabel: { fontSize: 16, fontWeight: '600', marginLeft: -10 },
  drawerFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 'auto' },
  drawerVersion: { fontSize: 12, color: '#888', textAlign: 'center' },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setInitialRoute(token ? 'Main' : 'Login');
      setIsLoading(false);
    };
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' }}>
        <Text style={{ fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NetworkProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Main" component={DrawerNavigator} />
              <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
              <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </NetworkProvider>
  );
}
