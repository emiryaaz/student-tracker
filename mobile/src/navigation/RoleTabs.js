import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getRoleColors, ink } from '../theme/colors';

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

const TabIcon = ({ name, focused, accent }) => (
    <Ionicons name={focused ? name : `${name}-outline`} size={24} color={focused ? accent : '#7C8AA5'} />
);

const BrandTitle = ({ title, accent }) => (
    <View style={styles.brandRow}>
        <View style={[styles.brandDot, { backgroundColor: accent }]} />
        <Text style={styles.brandEdu}>Edu<Text style={{ color: accent }}>Tracker</Text></Text>
        <Text style={styles.brandDivider}>·</Text>
        <Text style={styles.brandScreen}>{title}</Text>
    </View>
);

function buildScreenOptions(accent, bottomInset) {
    return () => ({
        headerShown: true,
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        tabBarStyle: {
            ...styles.tabBar,
            height: 56 + bottomInset,
            paddingBottom: bottomInset + 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: '#7C8AA5',
        tabBarItemStyle: styles.tabItem,
    });
}

function withScreenTitle(accent, screenLabel) {
    return {
        title: screenLabel,
        headerTitle: () => <BrandTitle title={screenLabel} accent={accent} />,
    };
}

export function TeacherTabs() {
    const accent = getRoleColors('TEACHER').accent;
    const { bottom } = useSafeAreaInsets();
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent, bottom)}>
            <Tab.Screen name="Home" component={TeacherHomeScreen} options={{ ...withScreenTitle(accent, 'Ana Sayfa'), tabBarIcon: (p) => <TabIcon name="home" accent={accent} {...p} /> }} />
            <Tab.Screen name="Messages" component={MessagesScreen} options={{ ...withScreenTitle(accent, 'Mesajlarım'), tabBarIcon: (p) => <TabIcon name="chatbubble" accent={accent} {...p} /> }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ ...withScreenTitle(accent, 'Takvim'), tabBarIcon: (p) => <TabIcon name="calendar" accent={accent} {...p} /> }} />
            <Tab.Screen name="Profile" component={TeacherProfileScreen} options={{ ...withScreenTitle(accent, 'Profilim'), tabBarIcon: (p) => <TabIcon name="person" accent={accent} {...p} /> }} />
        </Tab.Navigator>
    );
}

export function StudentTabs() {
    const accent = getRoleColors('STUDENT').accent;
    const { bottom } = useSafeAreaInsets();
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent, bottom)}>
            <Tab.Screen name="Home" component={StudentHomeScreen} options={{ ...withScreenTitle(accent, 'Özet Ekranı'), tabBarIcon: (p) => <TabIcon name="home" accent={accent} {...p} /> }} />
            <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ ...withScreenTitle(accent, 'Eğitmen Vitrini'), tabBarIcon: (p) => <TabIcon name="storefront" accent={accent} {...p} /> }} />
            <Tab.Screen name="Messages" component={MessagesScreen} options={{ ...withScreenTitle(accent, 'Mesajlarım'), tabBarIcon: (p) => <TabIcon name="chatbubble" accent={accent} {...p} /> }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ ...withScreenTitle(accent, 'Takvim'), tabBarIcon: (p) => <TabIcon name="calendar" accent={accent} {...p} /> }} />
            <Tab.Screen name="Profile" component={StudentProfileScreen} options={{ ...withScreenTitle(accent, 'Profilim'), tabBarIcon: (p) => <TabIcon name="person" accent={accent} {...p} /> }} />
        </Tab.Navigator>
    );
}

export function ParentTabs() {
    const accent = getRoleColors('PARENT').accent;
    const { bottom } = useSafeAreaInsets();
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent, bottom)}>
            <Tab.Screen name="Home" component={ParentHomeScreen} options={{ ...withScreenTitle(accent, 'Genel Durum'), tabBarIcon: (p) => <TabIcon name="home" accent={accent} {...p} /> }} />
            <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ ...withScreenTitle(accent, 'Eğitmen Vitrini'), tabBarIcon: (p) => <TabIcon name="storefront" accent={accent} {...p} /> }} />
            <Tab.Screen name="Messages" component={MessagesScreen} options={{ ...withScreenTitle(accent, 'Mesajlarım'), tabBarIcon: (p) => <TabIcon name="chatbubble" accent={accent} {...p} /> }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ ...withScreenTitle(accent, 'Takvim'), tabBarIcon: (p) => <TabIcon name="calendar" accent={accent} {...p} /> }} />
            <Tab.Screen name="Profile" component={ParentProfileScreen} options={{ ...withScreenTitle(accent, 'Profilim'), tabBarIcon: (p) => <TabIcon name="person" accent={accent} {...p} /> }} />
        </Tab.Navigator>
    );
}

export function AdminTabs() {
    const accent = getRoleColors('ADMIN').accent;
    const { bottom } = useSafeAreaInsets();
    return (
        <Tab.Navigator screenOptions={buildScreenOptions(accent, bottom)}>
            <Tab.Screen name="Home" component={AdminHomeScreen} options={{ ...withScreenTitle(accent, 'Doğrulama Kuyruğu'), tabBarIcon: (p) => <TabIcon name="shield-checkmark" accent={accent} {...p} /> }} />
            <Tab.Screen name="Profile" component={AdminProfileScreen} options={{ ...withScreenTitle(accent, 'Profilim'), tabBarIcon: (p) => <TabIcon name="person" accent={accent} {...p} /> }} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    brandRow: { flexDirection: 'row', alignItems: 'center' },
    brandDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
    brandEdu: { fontSize: 15, fontWeight: '800', color: ink[900], letterSpacing: -0.2 },
    brandDivider: { fontSize: 14, color: '#CBD5E1', marginHorizontal: 7 },
    brandScreen: { fontSize: 14, fontWeight: '700', color: '#475569' },
    tabBar: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
    },
    tabItem: { paddingTop: 2 },
});
