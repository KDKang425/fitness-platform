import { View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  navigation: any;   // 추후 NativeStackScreenProps 로 교체 가능
  route: { params?: { user?: any } };
}

export default function HomeScreen({ navigation, route }: Props) {
  const { user } = route.params ?? {};
  const logout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#111' }}>
      <Text style={{ color:'#fff', fontSize:20, marginBottom:16 }}>
        {user?.nickname || user?.email || '사용자'}님, 환영합니다! 🎉
      </Text>
      <Button title="로그아웃" onPress={logout} />
    </View>
  );
}