import { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Card, OutlineButton, SectionTitle } from '../../components/UI';

export default function AdminProfileScreen() {
    const { user, logout } = useContext(AuthContext);
    const u = user?.user || user;

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istiyor musunuz?', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 14 }}>
            <SectionTitle>Profilim</SectionTitle>
            <Card>
                <Text style={styles.name}>{u?.first_name} {u?.last_name}</Text>
                <Text style={styles.email}>{u?.email}</Text>
            </Card>
            <OutlineButton title="Çıkış Yap" color="#dc2626" onPress={handleLogout} style={{ marginTop: 10 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    name: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
    email: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
