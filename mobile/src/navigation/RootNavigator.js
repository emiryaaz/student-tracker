import { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text } from 'react-native';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import { TeacherTabs, StudentTabs, ParentTabs, AdminTabs } from './RoleTabs';

const Stack = createNativeStackNavigator();

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
    );
}

// Web'deki RoleRouter'ın karşılığı: kullanıcının rolüne göre doğru tab navigator'a yönlendirir.
function RoleRouter() {
    const { user } = useContext(AuthContext);
    const role = user?.role || user?.user?.role;

    if (role === 'TEACHER') return <TeacherTabs />;
    if (role === 'STUDENT') return <StudentTabs />;
    if (role === 'PARENT') return <ParentTabs />;
    if (role === 'ADMIN') return <AdminTabs />;

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Geçersiz veya yetkisiz rol!</Text>
        </View>
    );
}

export default function RootNavigator() {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <RoleRouter /> : <AuthStack />}
        </NavigationContainer>
    );
}
