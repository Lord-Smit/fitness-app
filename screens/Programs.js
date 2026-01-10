import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../src/config/api';

const { width } = Dimensions.get('window');

const getTypeIcon = (type) => {
  switch (type) {
    case 'full-body': return '💪';
    case 'push-pull-leg': return '🏋️';
    case 'upper-lower': return '🎯';
    default: return '📋';
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'full-body': return '#22c55e';
    case 'push-pull-leg': return '#f97316';
    case 'upper-lower': return '#8b5cf6';
    default: return '#667eea';
  }
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'easy': return '#22c55e';
    case 'medium': return '#f59e0b';
    case 'hard': return '#ef4444';
    default: return '#667eea';
  }
};

const ProgramsScreen = ({ navigation }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeProgram, setActiveProgram] = useState(null);

  const difficulties = [
    { key: 'all', label: 'All' },
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' }
  ];

  const programTypes = [
    { key: 'all', label: 'All Types' },
    { key: 'full-body', label: 'Full Body' },
    { key: 'push-pull-leg', label: 'Push-Pull-Leg' },
    { key: 'upper-lower', label: 'Upper/Lower' }
  ];

  useEffect(() => {
    fetchPrograms();
    checkActiveProgram();
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [selectedDifficulty, selectedType]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/programs`, {
        params: { difficulty: selectedDifficulty, type: selectedType }
      });
      setPrograms(res.data.programs);
    } catch (err) {
      Alert.alert('Error', 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveProgram = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await axios.get(`${API_BASE_URL}/user-programs/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveProgram(res.data);
      }
    } catch (err) {
      console.log('Error:', err);
    }
  };

  const startProgram = async (programId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Login Required', 'Please login to start a program');
        return;
      }

      if (activeProgram) {
        Alert.alert(
          'Program Active',
          'You have an active program. Cancel it to start a new one?',
          [{ text: 'Cancel', style: 'cancel' }, { text: 'Replace', onPress: () => confirmStart(programId, token) }]
        );
        return;
      }

      confirmStart(programId, token);
    } catch (err) {
      Alert.alert('Error', 'Failed to start program');
    }
  };

  const confirmStart = async (programId, token) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/user-programs/start`,
        { programId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveProgram(res.data);
      Alert.alert('Success', 'Program started!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to start');
    }
  };

  const renderProgramCard = ({ item }) => {
    const typeColor = getTypeColor(item.type);
    const diffColor = getDifficultyColor(item.difficulty);
    const cardWidth = (width - 48) / 2;

    return (
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }]}
        onPress={() => navigation.navigate('ProgramDetail', { programId: item._id })}
        activeOpacity={0.85}
      >
        <View style={[styles.cardTop, { backgroundColor: typeColor }]}>
          <Text style={styles.cardIcon}>{getTypeIcon(item.type)}</Text>
          <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
        </View>
        
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
          
          <View style={styles.cardMeta}>
            <Text style={styles.metaText}>{item.daysPerWeek} days/wk</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.durationWeeks} weeks</Text>
          </View>
          
          <View style={[styles.typeTag, { backgroundColor: typeColor + '15' }]}>
            <Text style={[styles.typeTagText, { color: typeColor }]}>
              {item.type.replace('-', ' ')}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.cardBtn, { backgroundColor: typeColor }]}
          onPress={(e) => { e.stopPropagation(); startProgram(item._id); }}
        >
          <Text style={styles.cardBtnText}>Start</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading && programs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuBtnText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programs</Text>
        <TouchableOpacity 
          style={styles.myPlanBtn} 
          onPress={() => navigation.navigate('My Program')}
        >
          <Text style={styles.myPlanBtnText}>My Plan</Text>
        </TouchableOpacity>
      </View>

      {activeProgram && (
        <TouchableOpacity 
          style={styles.activeBanner}
          onPress={() => navigation.navigate('My Program')}
        >
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerIcon}>📋</Text>
            <View>
              <Text style={styles.bannerTitle}>Active Program</Text>
              <Text style={styles.bannerSubtitle}>{activeProgram.program?.name}</Text>
            </View>
          </View>
          <Text style={styles.bannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
      >
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>Difficulty</Text>
          <View style={styles.diffTabs}>
            {difficulties.map((diff) => {
              const isActive = selectedDifficulty === diff.key;
              const color = getDifficultyColor(diff.key);
              return (
                <TouchableOpacity
                  key={diff.key}
                  style={[styles.diffTab, isActive && { backgroundColor: color }]}
                  onPress={() => setSelectedDifficulty(diff.key)}
                >
                  <Text style={[styles.diffTabText, isActive && { color: '#fff' }]}>{diff.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeRow}>
              {programTypes.map((type) => {
                const isActive = selectedType === type.key;
                const typeColor = getTypeColor(type.key);
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[styles.typeChip, isActive && { backgroundColor: typeColor, borderColor: typeColor }]}
                    onPress={() => setSelectedType(type.key)}
                  >
                    <View style={[styles.typeDot, { backgroundColor: isActive ? '#fff' : typeColor }]} />
                    <Text style={[styles.typeChipText, isActive && { color: '#fff' }]}>{type.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{programs.length} programs</Text>
        </View>

        {programs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No programs found</Text>
            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={() => { setSelectedDifficulty('all'); setSelectedType('all'); }}
            >
              <Text style={styles.resetBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {programs.map((item) => (
              <View key={item._id} style={styles.cardWrapper}>
                {renderProgramCard({ item })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: { fontSize: 22 },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: '#1a1a2e', textAlign: 'center' },
  myPlanBtn: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myPlanBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bannerIcon: { fontSize: 28, marginRight: 12 },
  bannerTitle: { fontSize: 12, color: '#888' },
  bannerSubtitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  bannerArrow: { fontSize: 20, color: '#667eea', fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10 },
  diffTabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  diffTab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  diffTabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  typeDot: { width: 8, height: 8, borderRadius: 4 },
  typeChipText: { fontSize: 14, color: '#666' },
  resultsHeader: { marginBottom: 15 },
  resultsCount: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardWrapper: { width: '48%', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 },
  cardTop: { height: 90, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardIcon: { fontSize: 44 },
  diffDot: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 8, lineHeight: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 13, color: '#888' },
  metaDot: { marginHorizontal: 6, color: '#ccc' },
  typeTag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  typeTagText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardBtn: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, paddingVertical: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  cardBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 16 },
  resetBtn: { backgroundColor: '#667eea', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  resetBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  bottomSpacer: { height: 20 },
});

export default ProgramsScreen;
