import { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors } from '../../theme/colors';
import { Card, Badge, OutlineButton, SectionTitle } from '../../components/UI';

const VERIFICATION_LABEL = {
    NOT_SUBMITTED: { text: 'Diploma yüklenmedi', bg: '#fef3c7', color: '#92400e' },
    PENDING: { text: 'İnceleniyor', bg: '#fef3c7', color: '#92400e' },
    APPROVED: { text: '✓ Doğrulanmış Öğretmen', bg: '#dcfce7', color: '#15803d' },
    REJECTED: { text: 'Reddedildi', bg: '#fee2e2', color: '#b91c1c' },
};

export default function TeacherProfileScreen() {
    const { user, logout } = useContext(AuthContext);
    const accent = getRoleColors('TEACHER').accent;

    const verification = VERIFICATION_LABEL[user?.verification_status] || VERIFICATION_LABEL.NOT_SUBMITTED;

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
                <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                {user?.title ? <Text style={styles.title}>{user.title}</Text> : null}
                <View style={{ marginTop: 10 }}>
                    <Badge text={verification.text} bg={verification.bg} color={verification.color} />
                    {!user?.is_verified && (
                        <Text style={styles.warning}>
                            Sistemimiz tarafından doğrulanmamış öğretmenler öğrenci/velilere bu şekilde görünür.
                            Diploma yükleme, şu an web panelinden yapılabiliyor.
                        </Text>
                    )}
                </View>
            </Card>

            {user?.bio ? (
                <Card>
                    <Text style={styles.bioLabel}>Hakkımda</Text>
                    <Text style={styles.bio}>{user.bio}</Text>
                </Card>
            ) : null}

            <OutlineButton title="Çıkış Yap" color="#dc2626" onPress={handleLogout} style={{ marginTop: 10 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    name: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
    email: { fontSize: 13, color: '#64748b', marginTop: 2 },
    title: { fontSize: 13, color: '#334155', marginTop: 6, fontStyle: 'italic' },
    warning: { fontSize: 11, color: '#b91c1c', marginTop: 8 },
    bioLabel: { fontWeight: '700', fontSize: 13, color: '#1e293b', marginBottom: 6 },
    bio: { fontSize: 13, color: '#475569', lineHeight: 19 },
});
