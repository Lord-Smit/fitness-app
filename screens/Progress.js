import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, Image } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../src/config/api';

const ProgressScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await axios.get(`${API_BASE_URL}/workouts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkouts(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.log('Error fetching workouts:', err);
      Alert.alert('Error', 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const calculateStats = () => {
    const totalWorkouts = workouts.length;
    const totalWeight = workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0);
    const avgWeight = totalWorkouts > 0 ? totalWeight / totalWorkouts : 0;
    
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisWeek = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate >= thisWeekStart;
    }).length;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasWorkout = workouts.some(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.toDateString() === checkDate.toDateString();
      });
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);
    const totalSets = workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.length, 0), 0);
    const bestWorkout = workouts.reduce((best, w) => {
      const weight = w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0);
      return weight > best ? weight : best;
    }, 0);
    
    return { totalWorkouts, totalWeight, avgWeight, thisWeek, streak, totalExercises, totalSets, bestWorkout };
  };

  const { totalWorkouts, totalWeight, avgWeight, thisWeek, streak, totalExercises, totalSets, bestWorkout } = calculateStats();

  const chartData = {
    labels: workouts.slice(-7).map(w => new Date(w.date).toLocaleDateString().slice(0, 5)),
    datasets: [{
      data: workouts.slice(-7).map(w => w.exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0)),
    }],
  };

  const barData = (() => {
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    workouts.forEach(w => {
      const dayIndex = new Date(w.date).getDay();
      dayCounts[dayIndex]++;
    });
    return {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{ data: dayCounts }],
    };
  })();

  const generateTableData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const table = [];
    for (let week = 0; week < 4; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (week * 7 + (6 - day)));
        const hasWorkout = workouts.some(w => {
          const workoutDate = new Date(w.date);
          workoutDate.setHours(0, 0, 0, 0);
          return workoutDate.toDateString() === date.toDateString();
        });
        weekData.push({ date, hasWorkout });
      }
      table.push(weekData);
    }
    return table.reverse();
  };

  const tableData = generateTableData();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>💪 Your Progress</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.mainStatRow}>
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatValue}>{totalWorkouts}</Text>
            <Text style={styles.mainStatLabel}>Total Workouts</Text>
            <View style={styles.mainStatTrend}>
              <Text style={styles.trendUp}>↑ 12%</Text>
              <Text style={styles.trendLabel}>this month</Text>
            </View>
          </View>
          <View style={styles.mainStatCardSecondary}>
            <Text style={styles.secondaryStatValue}>{streak}</Text>
            <Text style={styles.secondaryStatLabel}>Day Streak 🔥</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>🏋️</Text>
            </View>
            <Text style={styles.statNumber}>{totalWeight.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Volume (lbs)</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📊</Text>
            </View>
            <Text style={styles.statNumber}>{avgWeight.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg Volume/Workout</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>📅</Text>
            </View>
            <Text style={styles.statNumber}>{thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>💪</Text>
            </View>
            <Text style={styles.statNumber}>{totalExercises}</Text>
            <Text style={styles.statLabel}>Total Exercises</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>🎯</Text>
            </View>
            <Text style={styles.statNumber}>{totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>⭐</Text>
            </View>
            <Text style={styles.statNumber}>{bestWorkout.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Best Workout (lbs)</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🗓️ Activity Calendar</Text>
          <Text style={styles.sectionSubtitle}>Last 4 weeks</Text>
        </View>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarRow}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
            ))}
          </View>
          {tableData.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarRow}>
              <Text style={styles.weekLabel}>W{4 - weekIndex}</Text>
              {week.map((cell, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    styles.calendarCell,
                    cell.hasWorkout && styles.calendarCellActive
                  ]}
                >
                  <Text style={[styles.calendarCellText, cell.hasWorkout && styles.calendarCellTextActive]}>
                    {cell.date.getDate()}
                  </Text>
                  {cell.hasWorkout && <View style={styles.activityDot} />}
                </View>
              ))}
            </View>
          ))}
        </View>
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotInactive]} />
            <Text style={styles.legendText}>No workout</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotActive]} />
            <Text style={styles.legendText}>Workout completed</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📈 Volume Progress</Text>
          <Text style={styles.sectionSubtitle}>Last 7 workouts</Text>
        </View>
        {workouts.length > 0 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 80}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#667eea',
                backgroundGradientTo: '#764ba2',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16, paddingTop: 10 },
                propsForDots: { r: '6', strokeWidth: '3', stroke: '#ffffff' },
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📊</Text>
            <Text style={styles.emptyStateTitle}>No Data Yet</Text>
            <Text style={styles.emptyStateSubtitle}>Complete your first workout to see your progress chart!</Text>
          </View>
          )}
        </View>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fc' },
  loadingSpinner: { width: 50, height: 50, borderRadius: 25, borderWidth: 4, borderColor: '#e0e0e0', borderTopColor: '#667eea', marginBottom: 20 },
  loadingText: { fontSize: 16, color: '#666' },
  
  topBar: { width: '100%', marginBottom: 15, alignItems: 'flex-start' },
  backButton: { backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  backButtonText: { fontSize: 14, fontWeight: '600', color: '#667eea' },
  
  header: { width: '100%', marginBottom: 25, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666' },
  
  statsContainer: { width: '100%', marginBottom: 25 },
  mainStatRow: { flexDirection: 'row', marginBottom: 15 },
  mainStatCard: { flex: 1, backgroundColor: '#667eea', borderRadius: 20, padding: 20, marginRight: 10, shadowColor: '#667eea', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  mainStatCardSecondary: { width: 100, backgroundColor: '#ffffff', borderRadius: 20, padding: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  mainStatValue: { fontSize: 42, fontWeight: '800', color: '#ffffff' },
  mainStatLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  mainStatTrend: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  trendUp: { fontSize: 12, fontWeight: '600', color: '#a8e6cf' },
  trendLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginLeft: 5 },
  secondaryStatValue: { fontSize: 32, fontWeight: '800', color: '#1a1a2e' },
  secondaryStatLabel: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 5 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '31%', backgroundColor: '#ffffff', borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statIcon: { fontSize: 20 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 },
  
  section: { width: '100%', marginBottom: 25 },
  sectionHeader: { marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  sectionSubtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  
  chartContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 15, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5, marginHorizontal: 5 },
  chart: { borderRadius: 16 },
  
  emptyState: { backgroundColor: '#ffffff', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  emptyStateEmoji: { fontSize: 60, marginBottom: 15 },
  emptyStateTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  emptyStateButton: { backgroundColor: '#667eea', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
  emptyStateButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  calendarContainer: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  calendarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  calendarDayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#888' },
  weekLabel: { width: 30, fontSize: 11, fontWeight: '600', color: '#888' },
  calendarCell: { flex: 1, height: 40, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center', marginHorizontal: 3 },
  calendarCellActive: { backgroundColor: '#667eea' },
  calendarCellText: { fontSize: 12, color: '#aaa' },
  calendarCellTextActive: { color: '#ffffff', fontWeight: '600' },
  activityDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: '#ffffff' },
  calendarLegend: { flexDirection: 'row', justifyContent: 'center', marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendDotInactive: { backgroundColor: '#f5f5f5' },
  legendDotActive: { backgroundColor: '#667eea' },
  legendText: { fontSize: 12, color: '#666' },
  
  workoutCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  workoutCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  workoutCardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  workoutCardIconText: { fontSize: 24 },
  workoutCardInfo: { flex: 1 },
  workoutCardDate: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  workoutCardExercises: { fontSize: 13, color: '#888', marginTop: 2 },
  workoutCardVolume: { alignItems: 'flex-end' },
  workoutVolumeValue: { fontSize: 22, fontWeight: '700', color: '#667eea' },
  workoutVolumeLabel: { fontSize: 12, color: '#888' },
  workoutCardExercisesList: { flexDirection: 'row', flexWrap: 'wrap' },
  exerciseBadge: { backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 6, marginBottom: 6 },
  exerciseBadgeMore: { backgroundColor: '#f0f4ff' },
  exerciseBadgeText: { fontSize: 12, color: '#666' },
});

export default ProgressScreen;