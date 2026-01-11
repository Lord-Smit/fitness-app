import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { API_BASE_URL } from '../src/config/api';

const CircularProgress = ({ progress, size, strokeWidth, color, backgroundColor }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

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

const HomeScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState({ workouts: 0, volume: 0, exercises: 0, weeklyWorkouts: 0 });
  const [lastBMI, setLastBMI] = useState(null);
  const [dailyStats, setDailyStats] = useState({ calories: 0, streak: 0, monthlyWorkouts: 0, activeMinutes: 0 });
  const [waterData, setWaterData] = useState({ totalAmount: 0, dailyGoal: 2500, percentComplete: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const weeklyGoal = 5;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const bmiData = await AsyncStorage.getItem('lastBMI');
      if (bmiData) {
        setLastBMI(JSON.parse(bmiData));
      }
      if (token) {
        try {
          const waterRes = await apiClient.get('/water', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWaterData({
            totalAmount: waterRes.data.totalAmount || 0,
            dailyGoal: waterRes.data.dailyGoal || 2500,
            percentComplete: Math.min(Math.round(((waterRes.data.totalAmount || 0) / (waterRes.data.dailyGoal || 2500)) * 100), 100)
          });
        } catch (waterErr) {
          console.log('Error fetching water data:', waterErr.message);
        }

        const res = await apiClient.get('/workouts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const weeklyWorkouts = data.filter(w => new Date(w.date) >= startOfWeek).length;
        const monthlyWorkouts = data.filter(w => new Date(w.date) >= startOfMonth).length;

        const todayWorkouts = data.filter(w => {
          const workoutDate = new Date(w.date);
          return workoutDate.toDateString() === today.toDateString();
        });

        const todayCalories = todayWorkouts.reduce((sum, w) => {
          const volume = w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0);
          return sum + Math.round(volume * 0.15);
        }, 0);

        const todayMinutes = todayWorkouts.reduce((sum, w) => {
          return sum + w.exercises.length * 5;
        }, 0);

        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const hasWorkout = data.some(w => {
            const workoutDate = new Date(w.date);
            return workoutDate.toDateString() === checkDate.toDateString();
          });
          if (hasWorkout) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }

        setWorkouts(data.slice(0, 5));
        setStats({
          workouts: data.length,
          volume: data.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + e.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0), 0), 0),
          exercises: data.reduce((sum, w) => sum + w.exercises.length, 0),
          weeklyWorkouts,
        });
        setDailyStats({
          calories: todayCalories,
          streak,
          monthlyWorkouts,
          activeMinutes: todayMinutes,
        });
      }
    } catch (err) {
      console.log('Error fetching data:', err);
      const errorMsg = err.code === 'ECONNABORTED'
        ? 'Server is waking up (cold start). Please wait and try again in 30 seconds.'
        : err.response?.data?.error || 'Failed to load data. Check your connection.';
      Alert.alert('Connection Issue', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBMIColor = (category) => {
    switch (category) {
      case 'Underweight': return '#3b82f6';
      case 'Normal Weight': return '#22c55e';
      case 'Overweight': return '#f59e0b';
      case 'Obese': return '#ef4444';
      default: return '#888';
    }
  };

  const weeklyProgress = Math.min(stats.weeklyWorkouts / weeklyGoal, 1);

  const statCards = [
    {
      title: 'Calories Burned',
      value: dailyStats.calories.toString(),
      unit: 'kcal',
      icon: '🔥',
      color: '#f97316',
      bgColor: '#fff7ed'
    },
    {
      title: 'Day Streak',
      value: dailyStats.streak.toString(),
      unit: 'days',
      icon: '⚡',
      color: '#eab308',
      bgColor: '#fefce8'
    },
    {
      title: 'This Month',
      value: dailyStats.monthlyWorkouts.toString(),
      unit: 'workouts',
      icon: '📅',
      color: '#22c55e',
      bgColor: '#f0fdf4'
    },
    {
      title: 'Active Time',
      value: dailyStats.activeMinutes.toString(),
      unit: 'min',
      icon: '⏱️',
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Fitness Dashboard</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.waterQuickButton} onPress={async () => {
            const token = await AsyncStorage.getItem('token');
            if (token) {
              await apiClient.post('/water', { amount: 250 }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchData();
            }
          }}>
            <Text style={styles.waterQuickButtonText}>💧</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Log Workout')}>
            <Text style={styles.actionButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>💪</Text>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>Ready to crush your goals today?</Text>
        </View>

        {lastBMI && (
          <View style={styles.bmiCard}>
            <View style={styles.bmiHeader}>
              <Text style={styles.bmiIcon}>⚖️</Text>
              <Text style={styles.bmiTitle}>Your BMI</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BMI Calculator')}>
                <Text style={styles.updateLink}>Update</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bmiContent}>
              <View style={styles.bmiValueContainer}>
                <Text style={styles.bmiValue}>{lastBMI.value}</Text>
                <Text style={styles.bmiLabel}>BMI Score</Text>
              </View>
              <View style={styles.bmiCategoryContainer}>
                <View style={[styles.bmiCategoryBadge, { backgroundColor: getBMIColor(lastBMI.category) + '20' }]}>
                  <Text style={[styles.bmiCategoryText, { color: getBMIColor(lastBMI.category) }]}>{lastBMI.category}</Text>
                </View>
                <Text style={styles.bmiDate}>Last updated: {new Date(lastBMI.date).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.waterCard} onPress={() => navigation.navigate('Water')}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterIcon}>💧</Text>
            <Text style={styles.waterTitle}>Hydration</Text>
            <Text style={styles.waterLink}>Track</Text>
          </View>
          <View style={styles.waterContent}>
            <View style={styles.waterInfo}>
              <Text style={styles.waterAmount}>{waterData.totalAmount} ml</Text>
              <Text style={styles.waterGoal}>of {waterData.dailyGoal} ml goal</Text>
            </View>
            <View style={styles.waterProgressBar}>
              <View style={[styles.waterProgressFill, { width: `${Math.min(waterData.percentComplete, 100)}%` }]} />
            </View>
            <Text style={styles.waterPercent}>{waterData.percentComplete}%</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Weekly Goal</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressContent}>
              <CircularProgress
                progress={weeklyProgress}
                size={140}
                strokeWidth={12}
                color="#667eea"
                backgroundColor="#e5e7eb"
              />
              <View style={styles.progressOverlay}>
                <Text style={styles.progressValue}>{stats.weeklyWorkouts}</Text>
                <Text style={styles.progressLabel}>of {weeklyGoal}</Text>
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Workouts This Week</Text>
              <Text style={styles.progressSubtitle}>
                {weeklyGoal - stats.weeklyWorkouts > 0
                  ? `${weeklyGoal - stats.weeklyWorkouts} more to reach your goal!`
                  : '🎉 Goal achieved!'}
              </Text>
              <View style={styles.goalIndicator}>
                <View style={[styles.goalDot, styles.goalDotActive]} />
                <Text style={styles.goalDotLabel}>{stats.weeklyWorkouts} completed</Text>
              </View>
              <View style={styles.goalIndicator}>
                <View style={[styles.goalDot, styles.goalDotInactive]} />
                <Text style={styles.goalDotLabel}>{weeklyGoal - stats.weeklyWorkouts} remaining</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.workouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.volume.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.exercises}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Stats Overview</Text>
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <View key={index} style={[styles.statCardNew, { backgroundColor: card.bgColor }]}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardIcon}>{card.icon}</Text>
                <Text style={[styles.statCardTitle, { color: card.color }]}>{card.title}</Text>
              </View>
              <View style={styles.statCardValueRow}>
                <Text style={[styles.statCardValue, { color: card.color }]}>{card.value}</Text>
                <Text style={styles.statCardUnit}>{card.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        <FlatList
          data={workouts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const volume = item.exercises.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0);
            return (
              <View style={styles.workoutItem}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutDate}>{new Date(item.date).toDateString()}</Text>
                  <Text style={styles.workoutDetail}>{item.exercises?.length || 0} exercises</Text>
                </View>
                <Text style={styles.workoutVolume}>{volume.toLocaleString()} lbs</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No workouts yet. Start logging!</Text>}
          scrollEnabled={false}
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
  topBarTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  waterQuickButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  waterQuickButtonText: { fontSize: 20 },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', shadowColor: '#667eea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionButtonText: { fontSize: 24, color: '#ffffff', fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  welcomeCard: { backgroundColor: '#667eea', borderRadius: 24, padding: 25, alignItems: 'center', marginBottom: 20, shadowColor: '#667eea', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  welcomeEmoji: { fontSize: 50, marginBottom: 10 },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 5 },
  welcomeSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  bmiCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  bmiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  bmiIcon: { fontSize: 24 },
  bmiTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', flex: 1, marginLeft: 10 },
  updateLink: { fontSize: 14, color: '#667eea', fontWeight: '600' },
  bmiContent: { flexDirection: 'row', alignItems: 'center' },
  bmiValueContainer: { marginRight: 20 },
  bmiValue: { fontSize: 36, fontWeight: '800', color: '#1a1a2e' },
  bmiLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  bmiCategoryContainer: { flex: 1 },
  bmiCategoryBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  bmiCategoryText: { fontSize: 14, fontWeight: '700' },
  bmiDate: { fontSize: 12, color: '#888' },
  progressSection: { marginBottom: 25 },
  progressCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 25, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  progressContent: { position: 'relative', marginRight: 20 },
  progressOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  progressValue: { fontSize: 32, fontWeight: '800', color: '#1a1a2e' },
  progressLabel: { fontSize: 14, color: '#888' },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 5 },
  progressSubtitle: { fontSize: 14, color: '#667eea', marginBottom: 15 },
  goalIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  goalDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  goalDotActive: { backgroundColor: '#667eea' },
  goalDotInactive: { backgroundColor: '#e5e7eb' },
  goalDotLabel: { fontSize: 13, color: '#666' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 15, alignItems: 'center', width: '31%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#667eea' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 3, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  statCardNew: { width: '47%', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statCardIcon: { fontSize: 18, marginRight: 8 },
  statCardTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  statCardValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  statCardValue: { fontSize: 28, fontWeight: '800' },
  statCardUnit: { fontSize: 12, color: '#666', marginLeft: 4 },
  workoutItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  workoutInfo: { flex: 1 },
  workoutDate: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  workoutDetail: { fontSize: 13, color: '#888', marginTop: 3 },
  workoutVolume: { fontSize: 16, fontWeight: '700', color: '#667eea' },
  waterCard: { backgroundColor: '#eff6ff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  waterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  waterIcon: { fontSize: 24 },
  waterTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', flex: 1, marginLeft: 10 },
  waterLink: { fontSize: 14, color: '#3b82f6', fontWeight: '600' },
  waterContent: {},
  waterInfo: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  waterAmount: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  waterGoal: { fontSize: 14, color: '#888', marginLeft: 8 },
  waterProgressBar: { height: 8, backgroundColor: '#dbeafe', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  waterProgressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  waterPercent: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  emptyText: { textAlign: 'center', fontSize: 15, color: '#999', marginTop: 10, marginBottom: 20 },
});

export default HomeScreen;