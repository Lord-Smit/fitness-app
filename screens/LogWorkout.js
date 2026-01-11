import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../src/config/api';

const LogWorkoutScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const steps = [
    { title: 'Start', icon: '🏋️' },
    { title: 'Select', icon: '💪' },
    { title: 'Configure', icon: '⚙️' },
    { title: 'Review', icon: '✅' }
  ];

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await apiClient.get(`/exercises`);
        setExercises(res.data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load exercises');
      }
    };
    fetchExercises();
  }, []);

  const filteredExercises = exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleExercise = (exercise) => {
    const isSelected = selectedExercises.some(s => s.exercise === exercise._id);
    if (isSelected) {
      setSelectedExercises(selectedExercises.filter(s => s.exercise !== exercise._id));
    } else {
      setSelectedExercises([...selectedExercises, { exercise: exercise._id, sets: [{ reps: 10, weight: 0 }] }]);
    }
  };

  const updateSet = (index, setIndex, field, value) => {
    const updated = [...selectedExercises];
    const numValue = parseInt(value) || 0;
    updated[index].sets[setIndex][field] = field === 'reps' ? Math.max(1, numValue) : numValue;
    setSelectedExercises(updated);
  };

  const updateNumSets = (index, num) => {
    const updated = [...selectedExercises];
    const currentSets = updated[index].sets.length;
    if (num > currentSets) {
      for (let i = currentSets; i < num; i++) {
        updated[index].sets.push({ reps: 10, weight: 0 });
      }
    } else if (num < currentSets) {
      updated[index].sets = updated[index].sets.slice(0, num);
    }
    setSelectedExercises(updated);
  };

  const validateWorkout = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one exercise');
      return false;
    }
    for (const ex of selectedExercises) {
      if (!ex.sets || ex.sets.length === 0) {
        Alert.alert('Validation Error', 'Each exercise must have at least one set');
        return false;
      }
      for (const set of ex.sets) {
        if (!set.reps || set.reps <= 0) {
          Alert.alert('Validation Error', 'All sets must have reps greater than 0');
          return false;
        }
      }
    }
    return true;
  };

  const saveWorkout = async () => {
    if (!validateWorkout()) return;
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        setSaving(false);
        return;
      }
      
      const workoutData = {
        exercises: selectedExercises.map((ex) => ({
          exercise: ex.exercise,
          sets: ex.sets.map(set => ({
            reps: parseInt(set.reps) || 0,
            weight: parseInt(set.weight) || 0
          }))
        })),
        notes: notes,
        date: new Date()
      };
      
      console.log('=== SAVING WORKOUT ===');
      console.log('Token exists:', !!token);
      console.log('Workout data:', JSON.stringify(workoutData, null, 2));
      
      const response = await apiClient.post(`/workouts`, workoutData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      console.log('=== WORKOUT SAVED SUCCESSFULLY ===');
      console.log('Response:', response.data);
      
      setSelectedExercises([]);
      setNotes('');
      setSearchQuery('');
      setCurrentStep(0);
      
      Alert.alert('🎉 Success!', 'Workout logged successfully!', [
        { 
          text: 'View Progress', 
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }, { name: 'Progress' }]
            });
          }
        }
      ]);
    } catch (err) {
      console.log('=== SAVE ERROR ===');
      console.log('Error status:', err.response?.status);
      console.log('Error data:', err.response?.data);
      console.log('Error message:', err.message);
      Alert.alert('Error', err.response?.data?.msg || err.message || 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={[styles.stepCircle, index <= currentStep && styles.stepCircleActive]}>
            <Text style={[styles.stepIcon, index <= currentStep && styles.stepIconActive]}>{step.icon}</Text>
          </View>
          <Text style={[styles.stepLabel, index <= currentStep && styles.stepLabelActive]}>{step.title}</Text>
        </View>
      ))}
      <View style={styles.stepLine}>
        <View style={[styles.stepLineFill, { width: `${(currentStep / (steps.length - 1)) * 100}%` }]} />
      </View>
    </View>
  );

  const renderStartStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.startCard}>
        <Text style={styles.startEmoji}>💪</Text>
        <Text style={styles.startTitle}>Log Your Workout</Text>
        <Text style={styles.startSubtitle}>Track your progress and reach your fitness goals</Text>
        
        <TouchableOpacity style={styles.mainButton} onPress={() => setCurrentStep(1)}>
          <Text style={styles.mainButtonText}>Start New Workout</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert('Coming Soon', 'Templates feature coming soon!')}>
          <Text style={styles.secondaryButtonText}>📋 Use Template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSelectStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Exercises</Text>
        <Text style={styles.sectionSubtitle}>{selectedExercises.length} exercise(s) selected</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isSelected = selectedExercises.some(s => s.exercise === item._id);
          return (
            <TouchableOpacity
              key={item._id}
              style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
              onPress={() => toggleExercise(item)}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseIcon}>🏋️</Text>
                <View>
                  <Text style={[styles.exerciseName, isSelected && styles.exerciseNameSelected]}>{item.name}</Text>
                  <Text style={styles.exerciseType}>{item.type}</Text>
                </View>
              </View>
              <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.exerciseList}
      />

      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity style={styles.backButtonSmall} onPress={() => setCurrentStep(0)}>
          <Text style={styles.backButtonTextSmall}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.continueButton, selectedExercises.length === 0 && styles.mainButtonDisabled]} 
          onPress={() => setCurrentStep(2)}
          disabled={selectedExercises.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfigureStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Configure Sets</Text>
        <Text style={styles.sectionSubtitle}>Enter your reps and weight</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.configureScrollContent}
      >
        {selectedExercises.map((item, index) => {
          const exerciseInfo = exercises.find(e => e._id === item.exercise);
          return (
            <View key={index} style={styles.configureCard}>
              <View style={styles.configureHeader}>
                <View style={styles.configureHeaderLeft}>
                  <Text style={styles.configureIcon}>💪</Text>
                  <Text style={styles.configureName}>{exerciseInfo?.name || 'Exercise'}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => {
                    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
                  }}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.setsHeader}>
                <Text style={styles.inputLabel}>Sets</Text>
                <View style={styles.setsControls}>
                  <TouchableOpacity 
                    style={styles.setAdjustButton}
                    onPress={() => updateNumSets(index, Math.max(1, item.sets.length - 1))}
                  >
                    <Text style={styles.setAdjustText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.setsCount}>{item.sets.length}</Text>
                  <TouchableOpacity 
                    style={styles.setAdjustButton}
                    onPress={() => updateNumSets(index, item.sets.length + 1)}
                  >
                    <Text style={styles.setAdjustText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.columnHeaders}>
                <Text style={[styles.columnHeader, { width: 43 }]}>Set</Text>
                <Text style={[styles.columnHeader, { width: 96 }]}>Reps</Text>
                <Text style={[styles.columnHeader, { width: 96 }]}>Weight (lbs)</Text>
              </View>

              {item.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <View style={styles.setNumberSmall}>
                    <Text style={styles.setNumberText}>{setIndex + 1}</Text>
                  </View>
                  <TextInput
                    style={styles.setInputSmall}
                    placeholder="10"
                    value={set.reps.toString()}
                    onChangeText={(value) => updateSet(index, setIndex, 'reps', value)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.setInputSmall}
                    placeholder="0"
                    value={set.weight.toString()}
                    onChangeText={(value) => updateSet(index, setIndex, 'weight', value)}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </View>
          );
        })}
        <View style={styles.scrollSpacer} />
      </ScrollView>

      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity style={styles.backButtonSmall} onPress={() => setCurrentStep(1)}>
          <Text style={styles.backButtonTextSmall}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.continueButton} onPress={() => setCurrentStep(3)}>
          <Text style={styles.continueButtonText}>Review →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Review Workout</Text>
        <Text style={styles.sectionSubtitle}>Everything looks good?</Text>
      </View>

      <View style={styles.reviewScroll}>
        {selectedExercises.map((item, index) => {
          const exerciseInfo = exercises.find(e => e._id === item.exercise);
          const totalVolume = item.sets.reduce((sum, set) => sum + (set.reps || 0) * (set.weight || 0), 0);
          return (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewIcon}>💪</Text>
                <Text style={styles.reviewName}>{exerciseInfo?.name || 'Exercise'}</Text>
                <Text style={styles.reviewVolume}>{totalVolume.toLocaleString()} lbs</Text>
              </View>
              <View style={styles.reviewSets}>
                {item.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.reviewSetBadge}>
                    <Text style={styles.reviewSetText}>Set {setIndex + 1}: {set.reps} × {set.weight}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did it feel? Any notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Exercises</Text>
            <Text style={styles.summaryValue}>{selectedExercises.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Sets</Text>
            <Text style={styles.summaryValue}>{selectedExercises.reduce((sum, ex) => sum + ex.sets.length, 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Volume</Text>
            <Text style={[styles.summaryValue, styles.summaryValueHighlight]}>
              {selectedExercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.reps || 0) * (set.weight || 0), 0), 0).toLocaleString()} lbs
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity style={styles.backButtonSmall} onPress={() => setCurrentStep(2)}>
          <Text style={styles.backButtonTextSmall}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.continueButton, saving && styles.mainButtonDisabled]} 
          onPress={saveWorkout}
          disabled={saving}
        >
          <Text style={styles.continueButtonText}>{saving ? 'Saving...' : '💪 Log Workout'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStartStep();
      case 1:
        return renderSelectStep();
      case 2:
        return renderConfigureStep();
      case 3:
        return renderReviewStep();
      default:
        return renderStartStep();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Log Workout</Text>
        <View style={styles.topBarRight} />
      </View>

      {renderStepIndicator()}
      {renderCurrentStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  closeButtonText: { fontSize: 18, color: '#666' },
  screenTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  topBarRight: { width: 40 },
  
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, marginBottom: 20 },
  stepItem: { alignItems: 'center', zIndex: 1 },
  stepCircle: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: '#e0e0e0' },
  stepCircleActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  stepIcon: { fontSize: 18 },
  stepIconActive: { fontSize: 20 },
  stepLabel: { fontSize: 11, color: '#888', marginTop: 5, fontWeight: '500' },
  stepLabelActive: { color: '#667eea', fontWeight: '600' },
  stepLine: { position: 'absolute', left: 50, right: 50, height: 3, backgroundColor: '#e0e0e0', top: 23, zIndex: 0 },
  stepLineFill: { height: '100%', backgroundColor: '#667eea', borderRadius: 2 },
  
  stepContent: { flex: 1, paddingHorizontal: 20 },
  
  startCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, marginTop: 20 },
  startEmoji: { fontSize: 60, marginBottom: 15 },
  startTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  startSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 25 },
  
  mainButton: { backgroundColor: '#667eea', paddingHorizontal: 35, paddingVertical: 15, borderRadius: 25, alignItems: 'center', shadowColor: '#667eea', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8, width: '100%' },
  mainButtonDisabled: { opacity: 0.5 },
  mainButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { marginHorizontal: 15, fontSize: 13, color: '#888' },
  
  secondaryButton: { backgroundColor: '#f0f4ff', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#667eea' },
  
  sectionHeader: { marginBottom: 15, paddingHorizontal: 5 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a2e' },
  sectionSubtitle: { fontSize: 14, color: '#888', marginTop: 3 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  
  exerciseList: { marginBottom: 120 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 2, borderColor: 'transparent' },
  exerciseCardSelected: { borderColor: '#667eea', backgroundColor: '#f0f4ff' },
  exerciseInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exerciseIcon: { fontSize: 24, marginRight: 12 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  exerciseNameSelected: { color: '#667eea' },
  exerciseType: { fontSize: 12, color: '#888', marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: '#667eea', borderColor: '#667eea' },
  checkmark: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  
  configureCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  configureHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  configureHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  configureIcon: { fontSize: 24, marginRight: 10 },
  configureName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  removeButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold' },
  
  setsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  columnHeaders: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 5 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#666', width: 50 },
  columnHeader: { fontSize: 11, fontWeight: '600', color: '#888', textAlign: 'center', paddingVertical: 4, paddingHorizontal: 4 },
  setsControls: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  setAdjustButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center' },
  setAdjustText: { fontSize: 20, color: '#667eea', fontWeight: 'bold' },
  setsCount: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginHorizontal: 15, minWidth: 30, textAlign: 'center' },
  
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 5 },
  setNumber: { width: 35, height: 36, borderRadius: 10, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  setNumberSmall: { width: 35, height: 36, borderRadius: 10, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  setNumberText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  setInput: { flex: 1, backgroundColor: '#f8f9fc', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginHorizontal: 4, height: 42 },
  setInputSmall: { width: 80, backgroundColor: '#f8f9fc', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginHorizontal: 4, height: 42 },
  
  configureScrollContent: { paddingBottom: 20 },
  scrollSpacer: { height: 100 },
  
  bottomButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingBottom: 30 },
  backButton: { backgroundColor: '#ffffff', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  
  fixedBottomButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#f8f9fc', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  backButtonSmall: { backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  backButtonTextSmall: { fontSize: 15, fontWeight: '600', color: '#666' },
  continueButton: { backgroundColor: '#667eea', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 25, shadowColor: '#667eea', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, flex: 1, marginLeft: 15 },
  continueButtonText: { color: '#ffffff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  
  reviewScroll: { flex: 1, paddingBottom: 120 },
  reviewCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewIcon: { fontSize: 24, marginRight: 10 },
  reviewName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  reviewVolume: { fontSize: 16, fontWeight: '700', color: '#667eea' },
  reviewSets: { flexDirection: 'row', flexWrap: 'wrap' },
  reviewSetBadge: { backgroundColor: '#f0f4ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  reviewSetText: { fontSize: 13, fontWeight: '600', color: '#667eea' },
  
  notesContainer: { marginTop: 15, marginBottom: 15 },
  notesLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  notesInput: { backgroundColor: '#ffffff', borderRadius: 16, padding: 15, fontSize: 15, color: '#333', height: 100, textAlignVertical: 'top', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  
  summaryCard: { backgroundColor: '#667eea', borderRadius: 20, padding: 20, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  summaryValueHighlight: { fontSize: 24 },
});

export default LogWorkoutScreen;