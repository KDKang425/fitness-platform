import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../utils/api';
import Ionicons from '@expo/vector-icons/Ionicons';

type Exercise = {
  id: number;
  name: string;
  primaryMuscle: string;
};

export default function ExerciseListScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/exercises', { params: { q: query } });
      setExercises(res.data);
    } catch {
      setExercises([]);
    }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WorkoutStart', { exercise: item })}
    >
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.muscle}>{item.primaryMuscle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ff7f27" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="운동 검색"
        placeholderTextColor="#666"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={fetchExercises}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#ff7f27" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  search: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#ff7f27',
    borderRadius: 4,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  muscle: { color: '#999', marginTop: 4, fontSize: 12 },
});
