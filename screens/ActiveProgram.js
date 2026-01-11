import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../src/config/api';

const ActiveProgramScreen = ({ navigation }) => {
  const [userProgram, setUserProgram] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchActiveProgram();
    }, [])
  );

  const fetchActiveProgram = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await apiClient.get(`/user-programs/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data) {
        setUserProgram(res.data);
        const programRes = await apiClient.get(`/programs/${res.data.program._id}`);
        setProgram(programRes.data);
      }
    } catch (err) {
      console.log('Error fetching active program:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDay = async (dayNumber, isRestDay) => {
    if (completing) return;
    
    try {
      setCompleting(true);
      const token = await AsyncStorage.getItem('token');
      
      await axios.post(
        '/user-programs/${userProgram._id}/complete-day`,
        { dayNumber, skipped: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (isRestDay) {
        Alert.alert('Day Complete', 'Rest day marked as complete!');
      } else {
        Alert.alert('Great Job!', 'Workout marked as complete!');
      }

      fetchActiveProgram();
    } catch (err) {
      console.log('Error completing day:', err);
      if (err.response?.data?.msg === 'Day already completed') {
        Alert.alert('Already Done', 'This day has already been completed');
      } else {
        Alert.alert('Error', 'Failed to mark day as complete');
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelProgram = () => {
    Alert.alert(
      'Cancel Program',
      'Are you sure you want to cancel this program? Your progress will be lost.',
      [
        { text: 'Keep Program', style: 'cancel' },
        { text: 'Cancel Program', style: 'destructive', onPress: confirmCancel }
      ]
    );
  };

  const confirmCancel = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await apiClient.delete(`/user-programs/${userProgram._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProgram(null);
      setProgram(null);
      Alert.alert('Program Cancelled', 'You can start a new program anytime.');
    } catch (err) {
      console.log('Error cancelling program:', err);
      Alert.alert('Error', 'Failed to cancel program');
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      timeZone: 'Asia/Kolkata'
    });
  };

  const getCompletedDaysSet = () => {
    return new Set(userProgram?.completedDays?.map(d => d.dayNumber) || []);
  };

  const completedSet = getCompletedDaysSet();
  const progressPercent = program ? Math.round((completedSet.size / program.days.length) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!userProgram || !program) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
            <Text style={styles.menuButtonText}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>My Program</Text>
          <View style={styles.topBarRight} />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No Active Program</Text>
          <Text style={styles.emptySubtitle}>Start a program to see your schedule here</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Programs')}
          >
            <Text style={styles.browseButtonText}>Browse Programs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentDay = userProgram.currentDay;
  const todayDayData = program.days.find(d => d.dayNumber === currentDay);
  const isTodayComplete = completedSet.has(currentDay);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>My Program</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelProgram}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.programHeader}>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programDate}>{getTodayDate()}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
          <Text style={styles.progressStats}>
            {completedSet.size} of {program.days.length} sessions completed
          </Text>
        </View>

        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>Today's Session</Text>
          <View style={styles.todayHeader}>
            <View style={styles.todayInfo}>
              <Text style={styles.todayDayNumber}>Day {currentDay}</Text>
              <Text style={styles.todayName}>{todayDayData?.dayName || 'Workout'}</Text>
            </View>
            {isTodayComplete ? (
              <View style={styles.completeBadge}>
                <Text style={styles.completeBadgeText}>✓ Complete</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleCompleteDay(currentDay, todayDayData?.dayType === 'rest')}
                disabled={completing}
              >
                <Text style={styles.completeButtonText}>
                  {completing ? 'Saving...' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {todayDayData?.dayType === 'rest' ? (
            <View style={styles.restDayInfo}>
              <Text style={styles.restIcon}>😴</Text>
              <Text style={styles.restText}>Rest Day</Text>
              <Text style={styles.restTip}>{todayDayData?.notes || 'Use this day to recover and prepare for tomorrow'}</Text>
            </View>
          ) : (
            <View style={styles.todayExercises}>
              <Text style={styles.exercisesTitle}>Today's Exercises</Text>
              {todayDayData?.exercises?.map((exercise, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <View style={styles.exerciseOrder}>
                    <Text style={styles.orderNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.sets} sets × {exercise.reps} reps • {exercise.rest} rest
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.weekSection}>
          <Text style={styles.weekTitle}>This Week</Text>
          <View style={styles.weekGrid}>
            {program.days.slice(0, 7).map((day) => {
              const isCompleted = completedSet.has(day.dayNumber);
              const isCurrent = day.dayNumber === currentDay;
              return (
                <View key={day.dayNumber} style={styles.dayCell}>
                  <Text style={styles.dayCellNumber}>{day.dayNumber}</Text>
                  <View style={[
                    styles.dayCellIndicator,
                    isCompleted && styles.dayCellComplete,
                    isCurrent && !isCompleted && styles.dayCellCurrent
                  ]}>
                    {isCompleted ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={[styles.dayCellLabel, isCurrent && styles.dayCellLabelCurrent]}>
                    {day.dayName.split(' ')[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Full Schedule</Text>
        <FlatList
          data={program.days}
          keyExtractor={(item) => item._id || item.dayNumber.toString()}
          renderItem={({ item }) => {
            const isCompleted = completedSet.has(item.dayNumber);
            const isCurrent = item.dayNumber === currentDay;
            const isPast = item.dayNumber < currentDay && !isCompleted;
            const isRest = item.dayType === 'rest';

            return (
              <View style={[
                styles.scheduleItem,
                isCompleted && styles.scheduleItemComplete,
                isCurrent && styles.scheduleItemCurrent,
                isPast && !isCompleted && styles.scheduleItemPast
              ]}>
                <View style={styles.scheduleLeft}>
                  <View style={[
                    styles.scheduleStatus,
                    isCompleted && styles.scheduleStatusComplete,
                    isCurrent && styles.scheduleStatusCurrent,
                    isRest && styles.scheduleStatusRest
                  ]}>
                    {isCompleted ? <Text style={styles.statusIcon}>✓</Text> : isCurrent ? <Text style={styles.statusIcon}>▶</Text> : null}
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={[styles.scheduleDay, isCompleted && styles.scheduleDayComplete]}>
                      Day {item.dayNumber}
                    </Text>
                    <Text style={styles.scheduleName}>{item.dayName}</Text>
                  </View>
                </View>
                <View style={styles.scheduleRight}>
                  {isCompleted && <Text style={styles.scheduleDate}>{formatDate(item.completedAt)}</Text>}
                  {!isCompleted && isCurrent && (
                    <TouchableOpacity
                      style={styles.smallCompleteButton}
                      onPress={() => handleCompleteDay(item.dayNumber, isRest)}
                    >
                      <Text style={styles.smallCompleteText}>Complete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          scrollEnabled={false}
          contentContainerStyle={styles.scheduleList}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#ffffff' },
  menuButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fc', alignItems: 'center', justifyContent: 'center' },
  menuButtonText: { fontSize: 20 },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  topBarRight: { width: 60 },
  cancelButton: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  cancelButtonText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  emptySubtitle: { fontSize: 16, color: '#888', marginBottom: 25, textAlign: 'center' },
  browseButton: { backgroundColor: '#667eea', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  browseButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  programHeader: { alignItems: 'center', marginBottom: 20 },
  programName: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', textAlign: 'center' },
  programDate: { fontSize: 14, color: '#888', marginTop: 5 },
  progressCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  progressPercent: { fontSize: 24, fontWeight: '800', color: '#667eea' },
  progressBarContainer: { marginBottom: 12 },
  progressBar: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#667eea', borderRadius: 6 },
  progressStats: { fontSize: 14, color: '#888', textAlign: 'center' },
  todayCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5, borderWidth: 2, borderColor: '#667eea' },
  todayLabel: { fontSize: 14, color: '#888', marginBottom: 10, fontWeight: '600' },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  todayInfo: { flex: 1 },
  todayDayNumber: { fontSize: 14, color: '#667eea', fontWeight: '600' },
  todayName: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  completeBadge: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  completeBadgeText: { fontSize: 14, color: '#22c55e', fontWeight: '700' },
  completeButton: { backgroundColor: '#667eea', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  completeButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  restDayInfo: { alignItems: 'center', padding: 20, backgroundColor: '#f0fdf4', borderRadius: 12 },
  restIcon: { fontSize: 40, marginBottom: 8 },
  restText: { fontSize: 18, fontWeight: '700', color: '#22c55e', marginBottom: 5 },
  restTip: { fontSize: 14, color: '#666', textAlign: 'center' },
  todayExercises: { marginTop: 10 },
  exercisesTitle: { fontSize: 14, color: '#888', marginBottom: 12, fontWeight: '600' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  exerciseOrder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  orderNumber: { fontSize: 14, fontWeight: '700', color: '#667eea' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 2 },
  exerciseMeta: { fontSize: 13, color: '#888' },
  weekSection: { marginBottom: 25 },
  weekTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 15 },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  dayCell: { alignItems: 'center', width: '14%' },
  dayCellNumber: { fontSize: 12, color: '#888', marginBottom: 8 },
  dayCellIndicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dayCellComplete: { backgroundColor: '#22c55e' },
  dayCellCurrent: { borderWidth: 2, borderColor: '#667eea', backgroundColor: '#ffffff' },
  checkMark: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
  dayCellLabel: { fontSize: 10, color: '#888' },
  dayCellLabelCurrent: { color: '#667eea', fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 15 },
  scheduleList: { paddingBottom: 20 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  scheduleItemComplete: { backgroundColor: '#f0fdf4' },
  scheduleItemCurrent: { borderWidth: 2, borderColor: '#667eea' },
  scheduleItemPast: { opacity: 0.6 },
  scheduleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  scheduleStatus: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  scheduleStatusComplete: { backgroundColor: '#22c55e' },
  scheduleStatusCurrent: { backgroundColor: '#667eea' },
  scheduleStatusRest: { backgroundColor: '#dbeafe' },
  statusIcon: { fontSize: 16, color: '#ffffff', fontWeight: '700' },
  scheduleInfo: { flex: 1 },
  scheduleDay: { fontSize: 12, color: '#888', marginBottom: 2 },
  scheduleDayComplete: { color: '#22c55e' },
  scheduleName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  scheduleRight: { alignItems: 'flex-end' },
  scheduleDate: { fontSize: 12, color: '#888' },
  smallCompleteButton: { backgroundColor: '#667eea', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  smallCompleteText: { fontSize: 12, fontWeight: '600', color: '#ffffff' }
});

export default ActiveProgramScreen;
