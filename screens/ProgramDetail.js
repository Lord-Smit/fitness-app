import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Alert, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../src/config/api';

const { height } = Dimensions.get('window');

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy': return '#22c55e';
    case 'medium': return '#f59e0b';
    case 'hard': return '#ef4444';
    default: return '#667eea';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'full-body': return '💪';
    case 'push-pull-leg': return '🏋️';
    case 'upper-lower': return '🎯';
    default: return '📋';
  }
};

const ProgramDetailScreen = ({ route, navigation }) => {
  const { programId } = route.params;
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const scrollViewRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchProgram();
    }, [programId])
  );

  const fetchProgram = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/programs/${programId}`);
      setProgram(res.data);
    } catch (err) {
      console.log('Error fetching program:', err);
      Alert.alert('Error', 'Failed to load program');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProgram = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Login Required', 'Please login to start a program');
        return;
      }

      const res = await axios.post(
        '/user-programs/start`,
        { programId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Program Started!', 'Check "My Program" to see your schedule.', [
        { text: 'View My Program', onPress: () => navigation.replace('My Program') },
        { text: 'OK', style: 'cancel' }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to start program');
    }
  };

  const renderExercise = ({ item, index }) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseIndex}>
        <Text style={styles.exerciseIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.exerciseTags}>
          <View style={styles.tag}><Text style={styles.tagText}>{item.sets} sets</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{item.reps} reps</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{item.rest}</Text></View>
        </View>
      </View>
      {item.matchedExercise && <View style={styles.matchedBadge}><Text style={styles.matchedText}>✓</Text></View>}
    </View>
  );

  const renderDay = ({ item, index }) => {
    const isRest = item.dayType === 'rest';
    return (
      <View style={[styles.dayCard, isRest && styles.dayCardRest]}>
        <View style={styles.dayHeader}>
          <View style={styles.dayLeft}>
            <View style={[styles.dayBadge, isRest && styles.dayBadgeRest]}>
              <Text style={[styles.dayBadgeText, isRest && styles.dayBadgeTextRest]}>{item.dayNumber}</Text>
            </View>
            <View>
              <Text style={styles.dayTitle}>{item.dayName}</Text>
              <Text style={styles.daySubtitle}>{isRest ? '🛌 Rest & Recovery' : `${item.exercises?.length || 0} exercises`}</Text>
            </View>
          </View>
          <View style={[styles.dayTypeTag, isRest && styles.dayTypeTagRest]}>
            <Text style={[styles.dayTypeText, isRest && styles.dayTypeTextRest]}>{isRest ? 'REST' : 'WORKOUT'}</Text>
          </View>
        </View>

        {!isRest && item.exercises && item.exercises.length > 0 && (
          <View style={styles.exerciseList}>
            {item.exercises.slice(0, 4).map((ex, idx) => (
              <View key={idx} style={styles.miniExercise}>
                <Text style={styles.miniBullet}>•</Text>
                <Text style={styles.miniName}>{ex.name}</Text>
                <Text style={styles.miniSets}>{ex.sets}×{ex.reps}</Text>
              </View>
            ))}
            {item.exercises.length > 4 && <Text style={styles.moreText}>+ {item.exercises.length - 4} more</Text>}
          </View>
        )}

        {isRest && item.notes && <Text style={styles.restNote}>{item.notes}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading program...</Text>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Program not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accentColor = getDifficultyColor(program.difficulty);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Program Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        scrollEnabled={true}
        removeClippedSubviews={false}
      >
        <View style={[styles.hero, { borderBottomColor: accentColor }]}>
          <Text style={styles.heroIcon}>{getTypeIcon(program.type)}</Text>
          <Text style={styles.heroTitle}>{program.name}</Text>
          <View style={styles.heroBadges}>
            <View style={[styles.badge, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>{program.difficulty.toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#667eea15' }]}>
              <Text style={[styles.badgeText, { color: '#667eea' }]}>{program.type.replace('-', ' ').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accentColor }]}>{program.daysPerWeek}</Text>
            <Text style={styles.statLabel}>days/week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accentColor }]}>{program.durationWeeks}</Text>
            <Text style={styles.statLabel}>weeks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accentColor }]}>{program.totalDays}</Text>
            <Text style={styles.statLabel}>sessions</Text>
          </View>
        </View>

        <Text style={styles.description}>{program.description}</Text>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === 'schedule' && { backgroundColor: accentColor }]} onPress={() => setActiveTab('schedule')}>
            <Text style={[styles.tabText, activeTab === 'schedule' && { color: '#fff' }]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'exercises' && { backgroundColor: accentColor }]} onPress={() => setActiveTab('exercises')}>
            <Text style={[styles.tabText, activeTab === 'exercises' && { color: '#fff' }]}>Exercises</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'schedule' ? (
          <View style={styles.scheduleList}>
            {program.days.map((day, idx) => (
              <View key={idx}>{renderDay({ item: day, index: idx })}</View>
            ))}
          </View>
        ) : (
          <View style={styles.exercisesList}>
            {program.days.filter(d => d.dayType === 'workout').map((day, idx) => (
              <View key={idx} style={styles.exerciseGroup}>
                <Text style={styles.groupTitle}>{day.dayName}</Text>
                {day.exercises.map((ex, exIdx) => (
                  <View key={exIdx} style={styles.exerciseWrapper}>{renderExercise({ item: ex, index: exIdx })}</View>
                ))}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={[styles.startBtn, { backgroundColor: accentColor }]} onPress={handleStartProgram}>
          <Text style={styles.startBtnText}>Start Program</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fc', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: '#666' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1a1a2e', textAlign: 'center' },
  headerSpacer: { width: 40 },
  scrollView: { flex: 1, backgroundColor: '#f8f9fc' },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fc' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fc' },
  errorText: { fontSize: 18, color: '#ef4444', marginBottom: 15 },
  backLink: { fontSize: 16, color: '#667eea', fontWeight: '600' },
  hero: { backgroundColor: '#fff', padding: 24, alignItems: 'center', borderBottomWidth: 3, marginBottom: 16 },
  heroIcon: { fontSize: 56, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 16 },
  heroBadges: { flexDirection: 'row', gap: 10 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 10 },
  description: { fontSize: 15, color: '#666', lineHeight: 22, paddingHorizontal: 20, marginBottom: 20, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 6, marginHorizontal: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  tab: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#888' },
  scheduleList: { paddingHorizontal: 16 },
  dayCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderLeftWidth: 3, borderLeftColor: '#667eea' },
  dayCardRest: { borderLeftColor: '#22c55e', backgroundColor: '#f0fdf4' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dayLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dayBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dayBadgeRest: { backgroundColor: '#22c55e' },
  dayBadgeText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  dayBadgeTextRest: { color: '#fff' },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  daySubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  dayTypeTag: { backgroundColor: '#f0f4ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dayTypeTagRest: { backgroundColor: '#dcfce7' },
  dayTypeText: { fontSize: 11, fontWeight: '700', color: '#667eea' },
  dayTypeTextRest: { color: '#22c55e' },
  exerciseList: { backgroundColor: '#f8f9fc', borderRadius: 12, padding: 12, marginTop: 8 },
  miniExercise: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  miniBullet: { color: '#667eea', marginRight: 8, fontSize: 14 },
  miniName: { flex: 1, fontSize: 14, color: '#1a1a2e' },
  miniSets: { fontSize: 13, color: '#888' },
  moreText: { fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 4 },
  restNote: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  exercisesList: { paddingHorizontal: 16 },
  exerciseGroup: { marginBottom: 20 },
  groupTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#e5e7eb' },
  exerciseWrapper: { marginBottom: 10 },
  exerciseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  exerciseIndex: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exerciseIndexText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  exerciseContent: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  exerciseTags: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: '#f0f4ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, color: '#667eea', fontWeight: '500' },
  matchedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  matchedText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  startBtn: { marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  bottomSpacer: { height: 20 },
});

export default ProgramDetailScreen;
