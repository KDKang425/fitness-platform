import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Modal,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  StyleSheet,
  TextInput,
} from 'react-native'
import api from '../utils/api'    

interface Exercise {
  id: number
  name: string
  category: string
  muscle?: string
  type?: string
}

interface Props {
  visible: boolean
  onClose: () => void
  onConfirm: (selected: Exercise[]) => void
}

export default function ExercisePickerModal({
  visible,
  onClose,
  onConfirm,
}: Props) {
  const [list, setList] = useState<Exercise[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!visible) return
    ;(async () => {
      try {
        const { data } = await api.get('/exercises')  
        setList(
          (Array.isArray(data) ? data : []).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        )
      } catch {
        setList([])
      }
    })()
  }, [visible])

  const filtered = useMemo(() => {
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((e) => e.name.toLowerCase().includes(q))
  }, [list, search])

  const toggle = (id: number) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const handleConfirm = () => {
    const picked = list.filter((e) => selected.has(e.id))
    onConfirm(picked)
    onClose()
    setSelected(new Set())
    setSearch('')
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {}
        <TextInput
          placeholder="운동 이름 검색"
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id.toString()}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => toggle(item.id)}>
              <Text style={styles.check}>
                {selected.has(item.id) ? '✅' : '⬜'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.cat}>{item.muscle || item.category} • {item.type}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>운동을 찾을 수 없습니다.</Text>
          }
        />

        <Button title="확인" onPress={handleConfirm} disabled={selected.size === 0} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40,
  },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    color: 'white',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  check: { fontSize: 20, marginRight: 10, color: 'orange' },
  name: { color: 'white', fontSize: 16, fontWeight: '600' },
  cat: { color: '#888', fontSize: 12, marginTop: 2 },
  empty: {
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
})
