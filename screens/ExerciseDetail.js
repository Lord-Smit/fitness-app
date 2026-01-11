import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../src/config/api';

const { width } = Dimensions.get('window');

const getTypeColor = (type) => {
    switch (type) {
        case 'strength': return '#667eea';
        case 'cardio': return '#22c55e';
        case 'flexibility': return '#f59e0b';
        case 'balance': return '#ec4899';
        default: return '#888';
    }
};

const ExerciseDetailScreen = ({ route, navigation }) => {
    const { exerciseId } = route.params;
    const [exercise, setExercise] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExercise();
    }, [exerciseId]);

    const fetchExercise = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/exercises/${exerciseId}`);
            setExercise(res.data);
        } catch (err) {
            console.log('Error fetching exercise:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
            </View>
        );
    }

    if (!exercise) {
        return (
            <View style={styles.container}>
                <Text>Exercise not found</Text>
            </View>
        );
    }

    const typeColor = getTypeColor(exercise.type);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Exercise Details</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.hero}>
                    <View style={[styles.heroIconContainer, { backgroundColor: typeColor + '15' }]}>
                        <Text style={styles.heroIcon}>🏋️</Text>
                    </View>
                    <Text style={styles.title}>{exercise.name}</Text>

                    <View style={styles.tagsContainer}>
                        <View style={[styles.tag, { backgroundColor: typeColor + '20' }]}>
                            <Text style={[styles.tagText, { color: typeColor }]}>{exercise.type}</Text>
                        </View>
                        {exercise.equipment && (
                            <View style={[styles.tag, { backgroundColor: '#f3f4f6' }]}>
                                <Text style={[styles.tagText, { color: '#666' }]}>{exercise.equipment || 'No Equipment'}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Target Muscles</Text>
                    <View style={styles.muscleContainer}>
                        {exercise.muscleGroups && exercise.muscleGroups.map((muscle, index) => (
                            <View key={index} style={styles.muscleBadge}>
                                <Text style={styles.muscleText}>{muscle}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {exercise.instructions && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        {Array.isArray(exercise.instructions) ? (
                            exercise.instructions.map((step, index) => (
                                <View key={index} style={styles.instructionRow}>
                                    <View style={styles.stepNumberContainer}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.instructionText}>{step}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.instructionBody}>{exercise.instructions}</Text>
                        )}
                    </View>
                )}

                {exercise.tips && (
                    <View style={[styles.section, styles.tipsSection]}>
                        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
                        <Text style={styles.tipsText}>{exercise.tips}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#ffffff' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f9fc', alignItems: 'center', justifyContent: 'center' },
    backButtonText: { fontSize: 24, color: '#333', marginTop: -2 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
    headerSpacer: { width: 40 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 50 },
    hero: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5, marginBottom: 20 },
    heroIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    heroIcon: { fontSize: 40 },
    title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 15 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    tagText: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
    section: { padding: 20, marginBottom: 10 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 15 },
    muscleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    muscleBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
    muscleText: { color: '#667eea', fontWeight: '600', fontSize: 14 },
    instructionRow: { flexDirection: 'row', marginBottom: 15 },
    stepNumberContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginRight: 15, marginTop: 2 },
    stepNumber: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    instructionText: { flex: 1, fontSize: 16, color: '#4b5563', lineHeight: 24 },
    instructionBody: { fontSize: 16, color: '#4b5563', lineHeight: 24 },
    tipsSection: { backgroundColor: '#fffbeb', margin: 20, borderRadius: 15, padding: 20, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
    tipsTitle: { fontSize: 18, fontWeight: '700', color: '#b45309', marginBottom: 8 },
    tipsText: { fontSize: 15, color: '#92400e', lineHeight: 22 },
});

export default ExerciseDetailScreen;
