import { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors } from '../../theme/colors';
import { Card, Badge, PrimaryButton, OutlineButton, EmptyState, SectionTitle } from '../../components/UI';

export default function TeacherHomeScreen() {
    const { user } = useContext(AuthContext);
    const accent = getRoleColors('TEACHER').accent;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState([]);
    const [requests, setRequests] = useState([]);

    const fetchAll = useCallback(async () => {
        try {
            const [studentsRes, requestsRes] = await Promise.allSettled([
                api.get('/school/my-students/'),
                api.get('/school/match-requests/'),
            ]);
            setStudents(studentsRes.status === 'fulfilled' ? studentsRes.value.data : []);
            setRequests(requestsRes.status === 'fulfilled' ? requestsRes.value.data.filter((r) => r.status === 'PENDING') : []);
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

    const respond = async (id, status) => {
        try {
            await api.patch(`/school/match-requests/${id}/respond/`, { status });
            fetchAll();
        } catch (e) {
            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
        }
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
                    <Text style={styles.greeting}>Merhaba Öğretmen{firstName ? `, ${firstName}` : ''}</Text>

                    {requests.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <SectionTitle>Bekleyen Ders Talepleri</SectionTitle>
                            {requests.map((r) => (
                                <Card key={r.id}>
                                    <Text style={styles.reqName}>{r.student_name}</Text>
                                    <Text style={styles.reqSub}>Ders talebi bekliyor</Text>
                                    <View style={styles.reqActions}>
                                        <PrimaryButton title="Kabul Et" color="#16a34a" onPress={() => respond(r.id, 'ACCEPTED')} style={{ flex: 1, marginRight: 8 }} />
                                        <OutlineButton title="Reddet" color="#dc2626" onPress={() => respond(r.id, 'REJECTED')} style={{ flex: 1 }} />
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}

                    <SectionTitle>Öğrencilerim</SectionTitle>
                </View>
            }
            data={students}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<EmptyState text="Henüz aktif öğrenciniz yok." />}
            renderItem={({ item }) => (
                <Card>
                    <View style={styles.studentRow}>
                        <Text style={styles.studentName}>{item.student?.first_name} {item.student?.last_name}</Text>
                        {item.subject?.name && <Badge text={item.subject.name} bg={`${accent}22`} color={accent} />}
                    </View>
                    <Text style={styles.studentEmail}>{item.student?.email}</Text>
                </Card>
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    greeting: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 18 },
    reqName: { fontWeight: '700', fontSize: 15, color: '#1e293b' },
    reqSub: { fontSize: 12, color: '#64748b', marginBottom: 10 },
    reqActions: { flexDirection: 'row' },
    studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    studentName: { fontWeight: '700', fontSize: 15, color: '#1e293b' },
    studentEmail: { fontSize: 12, color: '#64748b' },
});
