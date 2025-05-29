import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function WorkoutStartScreen({ route, navigation }: { route: any; navigation: any }) {
  const { exercise } = route.params || {};

  const onStartFree = () => {
    navigation.replace('WorkoutSession', { fromRoutine: false, routineId: null, exercise });
  };

  const onStartProgram = () => {
    navigation.replace('WorkoutSession', { fromRoutine: true, routineId: 1, exercise: null });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>운동 시작</Text>
      <TouchableOpacity style={styles.button} onPress={onStartProgram}>
        <Text style={styles.buttonText}>프로그램 시작</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onStartFree}>
        <Text style={styles.buttonText}>자유 운동 시작</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { color: '#ff7f27', fontSize: 28, marginBottom: 32, fontWeight: 'bold' },
  button: {
    width: '100%',
    backgroundColor: '#ff7f27',
    padding: 18,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});