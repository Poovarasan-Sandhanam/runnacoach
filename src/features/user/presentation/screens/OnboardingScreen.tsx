import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useOnboardingViewModel } from '../viewmodels/useOnboardingViewModel';
import { FitnessGoal, FitnessLevel } from '../../domain/models/User';

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    name,
    setName,
    goal,
    setGoal,
    level,
    setLevel,
    days,
    setDays,
    onboardUser,
  } = useOnboardingViewModel();

  const handleStart = async () => {
    if (!name.trim()) return;
    await onboardUser();
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>RunnaCoach</Text>
          <Text style={styles.subtitle}>Adaptive Running Coach</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Select Your Running Goal</Text>
          <View style={styles.row}>
            {(['5K', '10K'] as FitnessGoal[]).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, goal === g && styles.activeChip]}
                onPress={() => setGoal(g)}
              >
                <Text style={[styles.chipText, goal === g && styles.activeChipText]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Your Fitness Level</Text>
          <View style={styles.row}>
            {(['Beginner', 'Intermediate'] as FitnessLevel[]).map(lvl => (
              <TouchableOpacity
                key={lvl}
                style={[styles.chip, level === lvl && styles.activeChip]}
                onPress={() => setLevel(lvl)}
              >
                <Text style={[styles.chipText, level === lvl && styles.activeChipText]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Days per week you want to train?</Text>
          <View style={styles.row}>
            {[3, 4, 5, 6].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, days === d && styles.activeChip]}
                onPress={() => setDays(d)}
              >
                <Text style={[styles.chipText, days === d && styles.activeChipText]}>{d} Days</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, !name.trim() && styles.buttonDisabled]} 
          onPress={handleStart}
          disabled={!name.trim()}
        >
          <Text style={styles.buttonText}>Generate Training Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12', // Premium deep background
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#00F2FE', // Neon Cyan
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9F85FF', // Neon Purple
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E0E0E6',
    marginTop: 16,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeChip: {
    backgroundColor: '#9F85FF',
    borderColor: '#9F85FF',
  },
  chipText: {
    color: '#A0A0AB',
    fontSize: 14,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#0F0F12',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#00F2FE',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F0F12',
  },
});
