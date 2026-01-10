import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, FlatList, Alert } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../src/config/api';

const CircularProgress = ({ progress, size, strokeWidth, color, backgroundColor }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - Math.min(progress, 1) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const WaterEntryItem = ({ entry, onDelete }) => {
  const time = new Date(entry.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.entryItem}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryAmount}>{entry.amount} ml</Text>
        <Text style={styles.entryTime}>{time}</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(entry._id)}>
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const WaterScreen = ({ navigation }) => {
  const [waterData, setWaterData] = useState({ entries: [], dailyGoal: 2500, totalAmount: 0, percentComplete: 0 });
  const [weekData, setWeekData] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState('2500');
  const [loading, setLoading] = useState(true);

  const fetchWaterData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const [todayRes, weekRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/water`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/water/week`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setWaterData({
        ...todayRes.data,
        percentComplete: Math.min(Math.round((todayRes.data.totalAmount / (todayRes.data.dailyGoal || 2500)) * 100), 100)
      });
      setWeekData(weekRes.data);
      setNewGoal(todayRes.data.dailyGoal?.toString() || '2500');
    } catch (err) {
      console.log('Error fetching water data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWaterData();
    });
    return unsubscribe;
  }, [navigation]);

  const addWater = async (amount) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.post(`${API_BASE_URL}/water`, { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchWaterData();
    } catch (err) {
      console.log('Error adding water:', err);
      Alert.alert('Error', 'Failed to add water');
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.delete(`${API_BASE_URL}/water/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchWaterData();
    } catch (err) {
      console.log('Error deleting entry:', err);
    }
  };

  const updateGoal = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await axios.put(`${API_BASE_URL}/water/goal`, { dailyGoal: parseInt(newGoal) || 2500 }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowGoalModal(false);
      fetchWaterData();
    } catch (err) {
      console.log('Error updating goal:', err);
    }
  };

  const quickAddOptions = [
    { amount: 150, label: 'Small', icon: '🥤' },
    { amount: 250, label: 'Glass', icon: '🥛' },
    { amount: 350, label: 'Bottle', icon: '🍶' },
    { amount: 500, label: 'Large', icon: '💧' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Hydration</Text>
        <TouchableOpacity style={styles.goalButton} onPress={() => setShowGoalModal(true)}>
          <Text style={styles.goalButtonText}>🎯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressSection}>
          <View style={styles.progressCard}>
            <View style={styles.progressContent}>
              <CircularProgress
                progress={Math.min(waterData.percentComplete / 100, 1)}
                size={180}
                strokeWidth={14}
                color="#3b82f6"
                backgroundColor="#e5e7eb"
              />
              <View style={styles.progressOverlay}>
                <Text style={styles.progressValue}>{waterData.totalAmount}</Text>
                <Text style={styles.progressLabel}>of {waterData.dailyGoal} ml</Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Daily Goal</Text>
              <Text style={styles.progressPercent}>{waterData.percentComplete}%</Text>
              <Text style={styles.progressSubtitle}>
                {waterData.dailyGoal - waterData.totalAmount > 0
                  ? `${Math.round((waterData.dailyGoal - waterData.totalAmount) / 1000 * 10) / 10}L more to reach goal`
                  : '🎉 Goal achieved!'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.quickAddGrid}>
          {quickAddOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAddButton}
              onPress={() => addWater(option.amount)}
            >
              <Text style={styles.quickAddIcon}>{option.icon}</Text>
              <Text style={styles.quickAddAmount}>{option.amount}ml</Text>
              <Text style={styles.quickAddLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>Today's Log</Text>
            <Text style={styles.todayCount}>{waterData.entries.length} entries</Text>
          </View>
          {waterData.entries.length > 0 ? (
            <View style={styles.entriesList}>
              {[...waterData.entries].reverse().map((entry) => (
                <WaterEntryItem key={entry._id} entry={entry} onDelete={deleteEntry} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💧</Text>
              <Text style={styles.emptyText}>No water logged today</Text>
              <Text style={styles.emptySubtext}>Tap a button above to add</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekGrid}>
          {weekData.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <View style={[
                styles.weekDayCircle,
                day.isFuture && styles.weekDayFuture,
                day.percentComplete >= 100 && styles.weekDayComplete,
                day.isToday && !day.isFuture && styles.weekDayToday
              ]}>
                <Text style={[
                  styles.weekDayPercent,
                  (day.isFuture) && styles.weekDayPercentFuture,
                  (day.percentComplete >= 100) && styles.weekDayPercentComplete
                ]}>
                  {day.percentComplete}%
                </Text>
              </View>
              <Text style={styles.weekDayName}>{day.dayName}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showGoalModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            <Text style={styles.modalSubtitle}>Recommended: 2000-3000ml</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newGoal}
                onChangeText={setNewGoal}
                keyboardType="number-pad"
                placeholder="2500"
              />
              <Text style={styles.inputUnit}>ml</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowGoalModal(false)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={updateGoal}>
                <Text style={styles.modalSaveButtonText}>Save</Text>
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
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  goalButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  goalButtonText: { fontSize: 20 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  progressSection: { marginBottom: 25 },
  progressCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  progressContent: { position: 'relative', marginBottom: 20 },
  progressOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  progressValue: { fontSize: 36, fontWeight: '800', color: '#1a1a2e' },
  progressLabel: { fontSize: 14, color: '#888', marginTop: 2 },
  progressInfo: { alignItems: 'center' },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  progressPercent: { fontSize: 28, fontWeight: '800', color: '#3b82f6', marginVertical: 5 },
  progressSubtitle: { fontSize: 14, color: '#22c55e', textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 15, marginTop: 5 },
  quickAddGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  quickAddButton: { width: '47%', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  quickAddIcon: { fontSize: 28, marginBottom: 8 },
  quickAddAmount: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  quickAddLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  todaySection: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  todayTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  todayCount: { fontSize: 14, color: '#888' },
  entriesList: { marginTop: 5 },
  entryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  entryInfo: { flex: 1 },
  entryAmount: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  entryTime: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { fontSize: 20, color: '#ef4444', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 4 },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  weekDay: { alignItems: 'center', width: '12%' },
  weekDayCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  weekDayComplete: { backgroundColor: '#dcfce7' },
  weekDayToday: { borderWidth: 2, borderColor: '#3b82f6' },
  weekDayFuture: { opacity: 0.5 },
  weekDayPercent: { fontSize: 10, fontWeight: '700', color: '#666' },
  weekDayPercentComplete: { color: '#22c55e' },
  weekDayPercentFuture: { color: '#999' },
  weekDayName: { fontSize: 11, color: '#888' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 30, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fc', borderRadius: 12, paddingHorizontal: 15, marginBottom: 20 },
  input: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1a1a2e', paddingVertical: 15 },
  inputUnit: { fontSize: 18, fontWeight: '600', color: '#888' },
  modalButtons: { flexDirection: 'row', width: '100%', marginTop: 10 },
  modalCancelButton: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, marginRight: 10, backgroundColor: '#f3f4f6' },
  modalCancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  modalSaveButton: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#3b82f6' },
  modalSaveButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});

export default WaterScreen;
