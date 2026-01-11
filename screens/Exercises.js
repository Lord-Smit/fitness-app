import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../src/config/api';

const ExercisesScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await apiClient.get(`/exercises`);
        setExercises(res.data);
        setFilteredExercises(res.data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load exercises');
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    setFilteredExercises(
      exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, exercises]);

  const getTypeColor = (type) => {
    switch (type) {
      case 'strength': return '#667eea';
      case 'cardio': return '#22c55e';
      case 'flexibility': return '#f59e0b';
      case 'balance': return '#ec4899';
      default: return '#888';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Exercise Library</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.resultCount}>{filteredExercises.length} exercises found</Text>

        <View style={styles.exerciseList}>
          {filteredExercises.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.exerciseCard}
              onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item._id })}
            >
              <View style={styles.exerciseHeader}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                  <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
                </View>
              </View>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <View style={styles.muscleGroups}>
                {item.muscleGroups && item.muscleGroups.map((muscle, index) => (
                  <View key={index} style={styles.muscleBadge}>
                    <Text style={styles.muscleText}>{muscle}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
  topBarRight: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  resultCount: { fontSize: 14, color: '#888', marginBottom: 15 },
  exerciseList: { paddingBottom: 20 },
  exerciseCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  exerciseName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  muscleGroups: { flexDirection: 'row', flexWrap: 'wrap' },
  muscleBadge: { backgroundColor: '#f0f4ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, marginBottom: 8 },
  muscleText: { fontSize: 12, color: '#667eea', fontWeight: '500' },
});

export default ExercisesScreen;