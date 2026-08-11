import { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors } from '../../theme/colors';
import { Card, Badge, PrimaryButton, OutlineButton, EmptyState, SectionTitle } from '../../components/UI';

export default function ParentHomeScreen() {
    const { user, refreshUser } = useContext(AuthContext);
    const accent = getRoleColors('PARENT').accent;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [children, setChildren] = useState(user?.children || []);
    const [sentRequests, setSentRequests] = useState([]);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);

    const fetchAll = useCallback(async () => {
        try {
            const [meRes, reqRes] = await Promise.allSettled([
                api.get('/accounts/profiles/me/'),
                api.get('/accounts/link-requests/'),
            ]);
            if (meRes.status === 'fulfilled') setChildren(meRes.value.data?.children || []);
            if (reqRes.status === 'fulfilled') setSentRequests(reqRes.value.data.filter((r) => r.status === 'PENDING'));
        } catch (e) {
            console.log('Ana sayfa verisi çekilemedi', e);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchAll().finally(() => setLoading(false));
    }, [fetchAll]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    const handleAddChild = async () => {
        if (!email.trim()) return;
        setSending(true);
        try {
            await api.post('/accounts/profiles/link_child/', { student_email: email.trim() });
            setEmail('');
            Alert.alert('İstek gönderildi', 'Öğrenci onayladığında hesabınıza bağlanacak.');
            fetchAll();
        } catch (e) {
            Alert.alert('Hata', e.response?.data?.detail || 'İstek gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    const handleUnlink = (child) => {
        Alert.alert('Bağlantıyı Kaldır', `${child.user.first_name} ${child.user.last_name} hesabınızdan kaldırılsın mı?`, [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Kaldır', style: 'destructive', onPress: async () => {
                    try {
                        await api.post('/accounts/profiles/unlink_child/', { student_id: child.id });
                        fetchAll();
                    } catch (e) {
                        Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
                    }
                },
            },
        ]);
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={accent} size="large" /></View>;
    }

    const firstName = user?.user?.first_name || user?.first_name || '';

    return (
        <FlatList
            style={{ flex: 1, backgroundColor: '#fff' }}
            contentContainerStyle={{ padding: 14 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}
            ListHeaderComponent={
                <View>
                    <Text style={styles.greeting}>Merhaba Veli{firstName ? `, ${firstName}` : ''}</Text>
                    <Text style={styles.subGreeting}>Öğrencinizin durumunu buradan takip edebilirsiniz.</Text>

                    <Card>
                        <SectionTitle>Öğrenci Ekle</SectionTitle>
                        <Text style={styles.hint}>Öğrencinizin e-posta adresini girin, onay verdiğinde hesabınıza bağlanacak.</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="ogrenci@ornek.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <PrimaryButton title="İstek Gönder" color={accent} onPress={handleAddChild} loading={sending} style={{ marginTop: 10 }} />
                    </Card>

                    {sentRequests.length > 0 && (
                        <View style={{ marginBottom: 8 }}>
                            <SectionTitle>Bekleyen İstekler</SectionTitle>
                            {sentRequests.map((r) => (
                                <Card key={r.id}>
                                    <Text style={styles.reqName}>{r.student_name}</Text>
                                    <Badge text="⏳ Onay Bekleniyor" bg="#fef3c7" color="#92400e" />
                                </Card>
                            ))}
                        </View>
                    )}

                    <SectionTitle>Bağlı Öğrenciler</SectionTitle>
                </View>
            }
            data={children}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<EmptyState text="Henüz bağlı öğrenciniz yok." />}
            renderItem={({ item }) => (
                <Card>
                    <View style={styles.rowTop}>
                        <Text style={styles.childName}>{item.user.first_name} {item.user.last_name}</Text>
                        <OutlineButton title="Kaldır" color="#dc2626" onPress={() => handleUnlink(item)} />
                    </View>
                    <Text style={styles.childEmail}>{item.user.email}</Text>
                </Card>
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    greeting: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    subGreeting: { fontSize: 13, color: '#64748b', marginBottom: 18, marginTop: 2 },
    hint: { fontSize: 12, color: '#64748b', marginBottom: 10 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
    reqName: { fontWeight: '700', fontSize: 14, color: '#1e293b', marginBottom: 6 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    childName: { fontWeight: '700', fontSize: 15, color: '#1e293b' },
    childEmail: { fontSize: 12, color: '#64748b' },
});
