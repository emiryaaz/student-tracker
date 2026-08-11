import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { getRoleColors } from '../theme/colors';

import TeacherHomeScreen from '../screens/teacher/HomeScreen';
import TeacherProfileScreen from '../screens/teacher/ProfileScreen';
import StudentHomeScreen from '../screens/student/HomeScreen';
import StudentProfileScreen from '../screens/student/ProfileScreen';
import ParentHomeScreen from '../screens/parent/HomeScreen';
import ParentProfileScreen from '../screens/parent/ProfileScreen';
import AdminHomeScreen from '../screens/admin/HomeScreen';
import AdminProfileScreen from '../screens/admin/ProfileScreen';
import MarketplaceScreen from '../screens/shared/MarketplaceScreen';
import MessagesScreen from '../screens/shared/MessagesScreen';
import CalendarScreen from '../screens/shared/CalendarScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, focused, color }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

function buildScreenOptions(accent) {
    return {
        headerShown: true,
        headerStyle: { backgroundColor: accent },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: '#94a3b8',
    };
}

export function TeacherTabs() {
    const accent = getRoleColors('TEACHER').accent;
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent)}>
            <Tab.Screen name="Home" component={TeacherHomeScreen} options={{ title: 'Ana Sayfa', tabBarIcon: (p) => <TabIcon emoji="🏠" {...p} /> }} />
            <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlarım', tabBarIcon: (p) => <TabIcon emoji="💬" {...p} /> }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Takvim', tabBarIcon: (p) => <TabIcon emoji="📅" {...p} /> }} />
            <Tab.Screen name="Profile" component={TeacherProfileScreen} options={{ title: 'Profilim', tabBarIcon: (p) => <TabIcon emoji="👤" {...p} /> }} />
        </Tab.Navigator>
    );
}

export function StudentTabs() {
    const accent = getRoleColors('STUDENT').accent;
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent)}>
            <Tab.Screen name="Home" component={StudentHomeScreen} options={{ title: 'Özet Ekranı', tabBarIcon: (p) => <TabIcon emoji="🏠" {...p} /> }} />
            <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'Eğitmen Vitrini', tabBarIcon: (p) => <TabIcon emoji="🎓" {...p} /> }} />
            <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlarım', tabBarIcon: (p) => <TabIcon emoji="💬" {...p} /> }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Takvim', tabBarIcon: (p) => <TabIcon emoji="📅" {...p} /> }} />
            <Tab.Screen name="Profile" component={StudentProfileScreen} options={{ title: 'Profilim', tabBarIcon: (p) => <TabIcon emoji="👤" {...p} /> }} />
        </Tab.Navigator>
    );
}

export function ParentTabs() {
    const accent = getRoleColors('PARENT').accent;
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent)}>
            <Tab.Screen name="Home" component={ParentHomeScreen} options={{ title: 'Genel Durum', tabBarIcon: (p) => <TabIcon emoji="🏠" {...p} /> }} />
            <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'Eğitmen Vitrini', tabBarIcon: (p) => <TabIcon emoji="🎓" {...p} /> }} />
            <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Mesajlarım', tabBarIcon: (p) => <TabIcon emoji="💬" {...p} /> }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Takvim', tabBarIcon: (p) => <TabIcon emoji="📅" {...p} /> }} />
            <Tab.Screen name="Profile" component={ParentProfileScreen} options={{ title: 'Profilim', tabBarIcon: (p) => <TabIcon emoji="👤" {...p} /> }} />
        </Tab.Navigator>
    );
}

export function AdminTabs() {
    const accent = getRoleColors('ADMIN').accent;
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent)}>
            <Tab.Screen name="Home" component={AdminHomeScreen} options={{ title: 'Doğrulama Kuyruğu', tabBarIcon: (p) => <TabIcon emoji="🛡️" {...p} /> }} />
            <Tab.Screen name="Profile" component={AdminProfileScreen} options={{ title: 'Profilim', tabBarIcon: (p) => <TabIcon emoji="👤" {...p} /> }} />
        </Tab.Navigator>
    );
}
