// MainTabs.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// 아직 실제 화면이 없으므로 임시 placeholder 컴포넌트(아래 2단계) 사용
import HomeScreen    from '../screens/HomeScreen';
import StatsScreen   from '../screens/StatsScreen';
import RecordScreen  from '../screens/RecordScreen';
import ExploreScreen from '../screens/ExploreScreen';
import SocialScreen  from '../screens/SocialScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        /** ✅ sceneContainerStyle 은 screenOptions 안에서 지정 */
        sceneContainerStyle: { backgroundColor: '#111' },
        tabBarStyle:           { backgroundColor: '#000' },
        tabBarActiveTintColor:   '#ff7f27',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home:   'home',
            Stats:  'stats-chart',
            Record: 'calendar',
            Explore:'compass',
            Social: 'images',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"    component={HomeScreen}   />
      <Tab.Screen name="Stats"   component={StatsScreen}  />
      <Tab.Screen name="Record"  component={RecordScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen}/>
      <Tab.Screen name="Social"  component={SocialScreen} />
    </Tab.Navigator>
  );
}