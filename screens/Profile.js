import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../src/config/api';

import { useNetwork } from '../src/context/NetworkContext';
import { addToQueue } from '../src/services/OfflineQueue';

const ProfileScreen = ({ navigation }) => {
  const { isConnected } = useNetwork();
  const [user, setUser] = useState({});
  const [stats, setStats] = useState({ workouts: 0, streak: 0, volume: 0, memberSince: null });
  const [bodyMetrics, setBodyMetrics] = useState({ weight: '', height: '', bodyFat: '' });
  const [goals, setGoals] = useState({ weeklyWorkouts: 5, weeklyProgress: 0, waterPercent: 0, activeProgram: null });
  const [editing, setEditing] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [settings, setSettings] = useState({
    useMetricUnits: true,
    enableNotifications: true,
    enableDarkMode: false,
  });

  useEffect(() => {
    loadSettings();
    fetchUserData();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.log('Error loading settings:', err);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem('userSettings', JSON.stringify(updated));
    } catch (err) {
      console.log('Error saving settings:', err);
    }
  };

  const fetchUserData = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    try {
      const [userRes, workoutsRes, waterRes, activeProgramRes] = await Promise.all([
        apiClient.get(`/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get(`/workouts`, { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get(`/water`, { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get(`/user-programs/active`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
      ]);

      const userData = userRes.data;
      const workouts = workoutsRes.data;
      const waterData = waterRes.data;
      const activeProgram = activeProgramRes.data;

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= startOfWeek).length;

      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const hasWorkout = workouts.some(w => new Date(w.date).toDateString() === checkDate.toDateString());
        if (hasWorkout) streak++;
        else if (i > 0) break;
      }

      const totalVolume = workouts.reduce((sum, w) =>
        sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0);

      const memberSince = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';

      setUser(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setStats({
        workouts: workouts.length,
        streak,
        volume: totalVolume,
        memberSince
      });
      setBodyMetrics({
        weight: userData.profile?.weight?.toString() || '',
        height: userData.profile?.height?.toString() || '',
        bodyFat: userData.profile?.bodyFat?.toString() || ''
      });
      setGoals({
        weeklyWorkouts: 5,
        weeklyProgress: Math.min(weeklyWorkouts / 5, 1),
        waterPercent: Math.min(Math.round((waterData.totalAmount / (waterData.dailyGoal || 2500)) * 100), 100),
        activeProgram: activeProgram
      });
    } catch (err) {
      console.log('Error fetching user data:', err);
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const saveProfile = async () => {
    if (!isConnected) {
      // We can queue simple profile updates
      await addToQueue({
        method: 'put',
        url: '/auth/me',
        data: { name, email }
      });
      setEditing(false);
      Alert.alert('Saved Offline', 'Profile changes saved locally and will sync when online.');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    try {
      const res = await apiClient.put(`/auth/me`, { name, email }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to update profile');
    }
  };

  const saveBodyMetrics = async () => {
    const metricsData = {
      weight: bodyMetrics.weight ? parseFloat(bodyMetrics.weight) : null,
      height: bodyMetrics.height ? parseFloat(bodyMetrics.height) : null,
      bodyFat: bodyMetrics.bodyFat ? parseFloat(bodyMetrics.bodyFat) : null,
    };

    if (!isConnected) {
      await addToQueue({
        method: 'put',
        url: '/auth/me',
        data: metricsData
      });
      setEditingMetrics(false);
      Alert.alert('Saved Offline', 'Body metrics saved locally and will sync when online.');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    try {
      const res = await apiClient.put(`/auth/me`, metricsData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setEditingMetrics(false);
      Alert.alert('Success', 'Body metrics updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update body metrics');
    }
  };

  const changePassword = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'Cannot change password while offline.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (passwords.new.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const token = await AsyncStorage.getItem('token');
    try {
      await apiClient.put(`/auth/password`, {
        currentPassword: passwords.current,
        newPassword: passwords.new
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
      Alert.alert('Success', 'Password changed successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to change password');
    }
  };

  const deleteAccount = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'Cannot delete account while offline.');
      return;
    }
    Alert.alert('Delete Account', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await AsyncStorage.getItem('token');
          try {
            await apiClient.delete(`/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            await AsyncStorage.removeItem('token');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (err) {
            Alert.alert('Error', 'Failed to delete account');
          }
        }
      }
    ]);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const formatVolume = (vol) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Profile</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
          </View>

          {editing ? (
            <View style={styles.editProfileContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
              />
              <View style={styles.editButtonsRow}>
                <TouchableOpacity style={styles.saveButtonSmall} onPress={saveProfile}>
                  <Text style={styles.saveButtonTextSmall}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButtonSmall} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelButtonTextSmall}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{user.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user.email || ''}</Text>
              <TouchableOpacity style={styles.editProfileLink} onPress={() => setEditing(true)}>
                <Text style={styles.editProfileLinkText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.memberSince}>Member since {stats.memberSince}</Text>
        </View>

        <Text style={styles.sectionHeader}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.workouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatVolume(stats.volume)}</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Body Metrics</Text>
        <View style={styles.metricsCard}>
          {editingMetrics ? (
            <View style={styles.editMetricsContainer}>
              <Text style={styles.sectionTitle}>Edit Body Metrics</Text>
              <TextInput
                style={styles.input}
                placeholder={`Weight (${settings.useMetricUnits ? 'kg' : 'lbs'})`}
                value={bodyMetrics.weight}
                onChangeText={(v) => setBodyMetrics({ ...bodyMetrics, weight: v })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder={`Height (${settings.useMetricUnits ? 'cm' : 'in'})`}
                value={bodyMetrics.height}
                onChangeText={(v) => setBodyMetrics({ ...bodyMetrics, height: v })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Body Fat % (optional)"
                value={bodyMetrics.bodyFat}
                onChangeText={(v) => setBodyMetrics({ ...bodyMetrics, bodyFat: v })}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.saveButton} onPress={saveBodyMetrics}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingMetrics(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Weight</Text>
                  <Text style={styles.metricValue}>{bodyMetrics.weight || '--'} {settings.useMetricUnits ? 'kg' : 'lbs'}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Height</Text>
                  <Text style={styles.metricValue}>{bodyMetrics.height || '--'} {settings.useMetricUnits ? 'cm' : 'in'}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Body Fat</Text>
                  <Text style={styles.metricValue}>{bodyMetrics.bodyFat || '--'}%</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editMetricsButton} onPress={() => setEditingMetrics(true)}>
                <Text style={styles.editMetricsButtonText}>Update Metrics</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.sectionHeader}>Goals Overview</Text>
        <View style={styles.goalsCard}>
          <View style={styles.goalRow}>
            <Text style={styles.goalIcon}>🏋️</Text>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Weekly Workouts</Text>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: `${Math.min(goals.weeklyProgress * 100, 100)}%`, backgroundColor: '#667eea' }]} />
              </View>
            </View>
            <Text style={styles.goalValue}>{Math.round(goals.weeklyProgress * 100)}%</Text>
          </View>
          <View style={styles.goalDivider} />
          <View style={styles.goalRow}>
            <Text style={styles.goalIcon}>💧</Text>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Daily Hydration</Text>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, { width: `${Math.min(goals.waterPercent, 100)}%`, backgroundColor: '#3b82f6' }]} />
              </View>
            </View>
            <Text style={styles.goalValue}>{goals.waterPercent}%</Text>
          </View>
          {goals.activeProgram && (
            <>
              <View style={styles.goalDivider} />
              <View style={styles.goalRow}>
                <Text style={styles.goalIcon}>📋</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>Active Program</Text>
                  <Text style={styles.goalSubtitle}>{goals.activeProgram.program?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('My Program')}>
                  <Text style={styles.goalLink}>View</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <Text style={styles.sectionHeader}>Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📏</Text>
              <Text style={styles.settingText}>Metric Units</Text>
            </View>
            <Switch
              value={settings.useMetricUnits}
              onValueChange={(v) => saveSettings({ useMetricUnits: v })}
              trackColor={{ false: '#e5e7eb', true: '#667eea' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={(v) => saveSettings({ enableNotifications: v })}
              trackColor={{ false: '#e5e7eb', true: '#667eea' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🌙</Text>
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={settings.enableDarkMode}
              onValueChange={(v) => saveSettings({ enableDarkMode: v })}
              trackColor={{ false: '#e5e7eb', true: '#667eea' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.sectionHeader}>Account Security</Text>
        <View style={styles.securityCard}>
          <TouchableOpacity style={styles.securityRow} onPress={() => setShowPasswordModal(true)}>
            <Text style={styles.securityIcon}>🔐</Text>
            <Text style={styles.securityText}>Change Password</Text>
            <Text style={styles.securityArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.securityDivider} />
          <TouchableOpacity style={[styles.securityRow, styles.dangerRow]} onPress={() => setShowDeleteModal(true)}>
            <Text style={[styles.securityIcon, styles.dangerIcon]}>🗑️</Text>
            <Text style={[styles.securityText, styles.dangerText]}>Delete Account</Text>
            <Text style={[styles.securityArrow, styles.dangerArrow]}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={passwords.current}
              onChangeText={(v) => setPasswords({ ...passwords, current: v })}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={passwords.new}
              onChangeText={(v) => setPasswords({ ...passwords, new: v })}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={passwords.confirm}
              onChangeText={(v) => setPasswords({ ...passwords, confirm: v })}
              secureTextEntry
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={changePassword}>
                <Text style={styles.modalSaveButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#ffffff' },
  menuButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fc', alignItems: 'center', justifyContent: 'center' },
  menuButtonText: { fontSize: 20 },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  topBarRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 25, width: '100%' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginBottom: 15, shadowColor: '#667eea', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#ffffff' },
  userName: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 5 },
  userEmail: { fontSize: 14, color: '#888' },
  editProfileLink: { marginTop: 10, padding: 8 },
  editProfileLinkText: { color: '#667eea', fontWeight: '600' },
  editProfileContainer: { width: '80%', alignItems: 'center' },
  editButtonsRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  saveButtonSmall: { backgroundColor: '#667eea', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20 },
  saveButtonTextSmall: { color: '#fff', fontWeight: 'bold' },
  cancelButtonSmall: { backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 20 },
  cancelButtonTextSmall: { color: '#666', fontWeight: 'bold' },
  memberSince: { fontSize: 12, color: '#888', marginTop: 15 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, marginTop: 10 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, alignItems: 'center', width: '31%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#667eea' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  metricsCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
  metricLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  editMetricsButton: { marginTop: 15, paddingVertical: 12, alignItems: 'center', backgroundColor: '#f8f9fc', borderRadius: 12 },
  editMetricsButtonText: { fontSize: 14, fontWeight: '600', color: '#667eea' },
  editMetricsContainer: {},
  goalsCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  goalRow: { flexDirection: 'row', alignItems: 'center' },
  goalIcon: { fontSize: 24, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  goalSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  goalProgressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  goalProgressFill: { height: '100%', borderRadius: 3 },
  goalValue: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginLeft: 12 },
  goalLink: { fontSize: 14, fontWeight: '600', color: '#667eea' },
  goalDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 15 },
  settingsCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { fontSize: 20, marginRight: 12 },
  settingText: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  settingDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 15 },
  securityCard: { backgroundColor: '#ffffff', borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  securityRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  dangerRow: {},
  securityIcon: { fontSize: 20, marginRight: 12 },
  securityText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  securityArrow: { fontSize: 18, color: '#888' },
  securityDivider: { height: 1, backgroundColor: '#e5e7eb' },
  dangerIcon: { color: '#ef4444' },
  dangerText: { color: '#ef4444' },
  dangerArrow: { color: '#ef4444' },
  logoutButton: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
  versionText: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#f8f9fc', borderRadius: 12, padding: 15, fontSize: 16, color: '#1a1a2e', marginBottom: 12 },
  saveButton: { backgroundColor: '#667eea', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, shadowColor: '#667eea', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  cancelButton: { backgroundColor: '#f8f9fc', borderRadius: 16, padding: 16, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 15, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 25, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', marginTop: 10 },
  modalCancelButton: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, marginRight: 10, backgroundColor: '#f3f4f6' },
  modalCancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  modalSaveButton: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#667eea' },
  modalSaveButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});

export default ProfileScreen;
