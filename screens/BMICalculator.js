import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../src/config/api';

const BMICalculatorScreen = ({ navigation }) => {
  const [unit, setUnit] = useState('imperial');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bmi, setBmi] = useState(null);
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('');

  const calculateBMI = async () => {
    let heightM, weightKgCalc;

    if (unit === 'imperial') {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      if (ft <= 0 && inches <= 0) {
        Alert.alert('Error', 'Please enter your height');
        return;
      }
      if (weightLbs <= 0) {
        Alert.alert('Error', 'Please enter your weight');
        return;
      }
      heightM = ((ft * 12) + inches) * 0.0254;
      weightKgCalc = parseFloat(weightLbs) * 0.453592;
    } else {
      if (heightCm <= 0) {
        Alert.alert('Error', 'Please enter your height');
        return;
      }
      if (weightKg <= 0) {
        Alert.alert('Error', 'Please enter your weight');
        return;
      }
      heightM = parseFloat(heightCm) / 100;
      weightKgCalc = parseFloat(weightKg);
    }

    const bmiValue = weightKgCalc / (heightM * heightM);
    const bmiResult = bmiValue.toFixed(1);
    setBmi(bmiResult);

    let bmiCategory, bmiIcon;
    if (bmiValue < 18.5) {
      bmiCategory = 'Underweight';
      bmiIcon = '🍎';
    } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
      bmiCategory = 'Normal Weight';
      bmiIcon = '🎉';
    } else if (bmiValue >= 25 && bmiValue <= 29.9) {
      bmiCategory = 'Overweight';
      bmiIcon = '🔥';
    } else {
      bmiCategory = 'Obese';
      bmiIcon = '💪';
    }
    setCategory(bmiCategory);
    setIcon(bmiIcon);

    try {
      const bmiData = {
        value: bmiResult,
        category: bmiCategory,
        date: new Date().toISOString()
      };
      await AsyncStorage.setItem('lastBMI', JSON.stringify(bmiData));
    } catch (err) {
      console.log('Error saving BMI:', err);
    }
  };

  const resetCalculator = () => {
    setHeightFt('');
    setHeightIn('');
    setHeightCm('');
    setWeightLbs('');
    setWeightKg('');
    setBmi(null);
    setCategory('');
    setIcon('');
  };

  const getBMIColor = () => {
    if (!bmi) return '#888';
    const value = parseFloat(bmi);
    if (value < 18.5) return '#3b82f6';
    if (value <= 24.9) return '#22c55e';
    if (value <= 29.9) return '#f59e0b';
    return '#ef4444';
  };

  const getMessage = () => {
    if (!bmi) return '';
    const value = parseFloat(bmi);
    if (value < 18.5) return 'A balanced diet with nutrient-rich foods can help you reach a healthier weight.';
    if (value <= 24.9) return 'Great work! Maintain your healthy lifestyle with regular exercise and good nutrition.';
    if (value <= 29.9) return 'Small changes like daily walks and mindful eating can help you get back on track.';
    return 'Consult with a healthcare provider for personalized guidance on your health journey.';
  };

  const getAdvice = () => {
    if (!bmi) return [];
    const value = parseFloat(bmi);
    if (value < 18.5) return [
      { icon: '🥗', text: 'Eat nutrient-dense foods' },
      { icon: '💪', text: 'Strength training to build muscle' },
      { icon: '🥜', text: 'Healthy snacks between meals' },
    ];
    if (value <= 24.9) return [
      { icon: '🏃', text: 'Stay active with regular exercise' },
      { icon: '🥗', text: 'Continue eating balanced meals' },
      { icon: '😴', text: 'Maintain good sleep habits' },
    ];
    if (value <= 29.9) return [
      { icon: '🚶', text: 'Start with daily walks' },
      { icon: '🥦', text: 'More fruits and vegetables' },
      { icon: '💧', text: 'Stay hydrated throughout the day' },
    ];
    return [
      { icon: '👨‍⚕️', text: 'Consult a healthcare provider' },
      { icon: '📋', text: 'Create a sustainable plan' },
      { icon: '🎯', text: 'Set realistic goals' },
    ];
  };

  const CircularProgress = ({ progress, size, strokeWidth, color }) => {
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
            stroke="#e5e7eb"
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

  const getBMIPosition = () => {
    if (!bmi) return 0;
    const value = parseFloat(bmi);
    if (value < 15) return 0.05;
    if (value > 40) return 0.95;
    return (value - 15) / 25;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>BMI Calculator</Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'imperial' && styles.unitButtonActive]}
            onPress={() => setUnit('imperial')}
          >
            <Text style={[styles.unitButtonText, unit === 'imperial' && styles.unitButtonTextActive]}>Imperial (ft/lbs)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'metric' && styles.unitButtonActive]}
            onPress={() => setUnit('metric')}
          >
            <Text style={[styles.unitButtonText, unit === 'metric' && styles.unitButtonTextActive]}>Metric (cm/kg)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Height</Text>
          {unit === 'imperial' ? (
            <View style={styles.rowInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Feet</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={heightFt}
                  onChangeText={setHeightFt}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Inches</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={heightIn}
                  onChangeText={setHeightIn}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Centimeters</Text>
              <TextInput
                style={styles.inputFull}
                placeholder="0"
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Weight</Text>
          {unit === 'imperial' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pounds</Text>
              <TextInput
                style={styles.inputFull}
                placeholder="165"
                value={weightLbs}
                onChangeText={setWeightLbs}
                keyboardType="numeric"
              />
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kilograms</Text>
              <TextInput
                style={styles.inputFull}
                placeholder="0"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.calculateButton} onPress={calculateBMI}>
            <Text style={styles.calculateButtonText}>Calculate BMI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetCalculator}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {bmi && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultEmoji}>{icon}</Text>
              <Text style={[styles.resultCategory, { color: getBMIColor() }]}>{category}</Text>
            </View>

            <View style={styles.bmiCircleContainer}>
              <CircularProgress
                progress={getBMIPosition()}
                size={180}
                strokeWidth={16}
                color={getBMIColor()}
              />
              <View style={styles.bmiCircleOverlay}>
                <Text style={styles.bmiValueLarge}>{bmi}</Text>
                <Text style={styles.bmiLabel}>Your BMI</Text>
              </View>
            </View>

            <View style={styles.scaleIndicator}>
              <View style={styles.scaleGradient}>
                <View style={[styles.scaleSection, { backgroundColor: '#3b82f6', flex: 3.5 }]} />
                <View style={[styles.scaleSection, { backgroundColor: '#22c55e', flex: 6.4 }]} />
                <View style={[styles.scaleSection, { backgroundColor: '#f59e0b', flex: 5 }]} />
                <View style={[styles.scaleSection, { backgroundColor: '#ef4444', flex: 10 }]} />
              </View>
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabel}>15</Text>
                <Text style={styles.scaleLabel}>18.5</Text>
                <Text style={styles.scaleLabel}>25</Text>
                <Text style={styles.scaleLabel}>30</Text>
                <Text style={styles.scaleLabel}>40</Text>
              </View>
            </View>

            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{getMessage()}</Text>
            </View>

            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>💡 Recommendations</Text>
              {getAdvice().map((item, index) => (
                <View key={index} style={styles.adviceItem}>
                  <Text style={styles.adviceIcon}>{item.icon}</Text>
                  <Text style={styles.adviceText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
  unitToggle: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 6, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  unitButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  unitButtonActive: { backgroundColor: '#667eea' },
  unitButtonText: { fontSize: 14, fontWeight: '600', color: '#888' },
  unitButtonTextActive: { color: '#ffffff' },
  inputCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  inputTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 15 },
  rowInputs: { flexDirection: 'row', marginHorizontal: -5 },
  inputGroup: { flex: 1, paddingHorizontal: 5 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  input: { backgroundColor: '#f8f9fc', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: '#1a1a2e', textAlign: 'center' },
  inputFull: { backgroundColor: '#f8f9fc', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: '#1a1a2e' },
  buttonRow: { flexDirection: 'row', marginBottom: 20 },
  calculateButton: { flex: 1, backgroundColor: '#667eea', borderRadius: 16, padding: 16, alignItems: 'center', marginRight: 10, shadowColor: '#667eea', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  calculateButtonText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  resetButton: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, alignItems: 'center', paddingHorizontal: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  resetButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  resultCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 25, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  resultHeader: { alignItems: 'center', marginBottom: 20 },
  resultEmoji: { fontSize: 50, marginBottom: 10 },
  resultCategory: { fontSize: 24, fontWeight: '800' },
  bmiCircleContainer: { position: 'relative', alignItems: 'center', marginBottom: 25 },
  bmiCircleOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bmiValueLarge: { fontSize: 48, fontWeight: '800', color: '#1a1a2e' },
  bmiLabel: { fontSize: 14, color: '#888', marginTop: 5 },
  scaleIndicator: { marginBottom: 20 },
  scaleGradient: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  scaleSection: { height: '100%' },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  messageCard: { backgroundColor: '#f8f9fc', borderRadius: 16, padding: 16, marginBottom: 15 },
  messageText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  adviceCard: { backgroundColor: '#f8f9fc', borderRadius: 16, padding: 18 },
  adviceTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 15 },
  adviceItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  adviceIcon: { fontSize: 20, marginRight: 12 },
  adviceText: { fontSize: 14, color: '#666', flex: 1 },
});

export default BMICalculatorScreen;
