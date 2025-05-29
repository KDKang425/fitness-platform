import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function WorkoutSessionScreen({ route }: { route: any }) {
  const { fromRoutine, routineId, exercise } = route.params || {};
  const [sets, setSets] = useState<{ weight: string; reps: string }[]>([]);

  const addSet = () => setSets([...sets, { weight: '', reps: '' }]);

  const renderSet = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.setRow}>
      <Text style={styles.setLabel}>{index + 1}세트</Text>
      <TextInput
        style={styles.input}
        placeholder="중량"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={item.weight}
        onChangeText={(t) => {
          const copy = [...sets];
          copy[index].weight = t;
          setSets(copy);
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="횟수"
        placeholderTextColor="#666"
        keyboardType="numeric"
        value={item.reps}
        onChangeText={(t) => {
          const copy = [...sets];
          copy[index].reps = t;
          setSets(copy);
        }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise ? exercise.name : '루틴 세션'}</Text>
      <FlatList
        data={sets}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderSet}
        ListFooterComponent={() => (
          <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
            <Ionicons name="add" size={24} color="#000" />
            <Text style={styles.addSetText}>세트 추가</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.finishBtn}>
        <Text style={styles.finishText}>운동 종료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  title: { color: '#ff7f27', fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  setLabel: { color: '#fff', width: 60 },
  input: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#ff7f27',
    borderRadius: 4,
    marginHorizontal: 6,
    padding: 8,
    textAlign: 'center',
  },
  addSetBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ff7f27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addSetText: { color: '#000', marginLeft: 4, fontWeight: 'bold' },
  finishBtn: {
    backgroundColor: '#ff7f27',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 24,
  },
  finishText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
