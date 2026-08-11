import { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors } from '../../theme/colors';
import { Card, Badge, PrimaryButton, OutlineButton, EmptyState, SectionTitle } from '../../components/UI';

export default function StudentHomeScreen() {
    const { user } = useContext(AuthContext);
    const accent = getRoleColors('STUDENT').accent;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignments, setAssignments] = useState([]);
    const [linkRequests, setLinkRequests] = useState([]);

    const fetchAll = useCallback(async () => {
        try {
            const [aRes, lRes] = await Promise.allSettled([
                api.get('/school/assignments/'),
                api.get('/accounts/link-requests/'),
            ]);
            setAssignments(aRes.status === 'fulfilled' ? aRes.value.data : []);
            setLinkRequests(lRes.status === 'fulfilled' ? lRes.value.data.filter((r) => r.status === 'PENDING') : []);
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

    const markComplete = async (id) => {
        try {
            await api.patch(`/school/assignments/${id}/`, { status: 'COMPLETED' });
            fetchAll();
        } catch (e) {
            Alert.alert('Hata', 'Ödev güncellenemedi.');
        }
    };

    const respondLink = async (id, status) => {
        try {
            await api.patch(`/accounts/link-requests/${id}/respond/`, { status });
            fetchAll();
        } catch (e) {
            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={accent} size="large" /></View>;
    }

    const firstName = user?.user?.first_name || user?.first_name || '';
    const pendingFirst = assignments.filter((a) => a.status === 'PENDING');

    return (
        <FlatList
            style={{ flex: 1, backgroundColor: '#fff' }}
            contentContainerStyle={{ padding: 14 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}
            ListHeaderComponent={
                <View>
                    <Text style={styles.greeting}>Merhaba Öğrenci{firstName ? `, ${firstName}` : ''}</Text>

                    {linkRequests.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <SectionTitle>Veli Bağlantı Talepleri</SectionTitle>
                            {linkRequests.map((r) => (
                                <Card key={r.id}>
                                    <Text style={styles.reqName}>{r.parent_name}</Text>
                                    <Text style={styles.reqSub}>{r.parent_email} sizi veli olarak eklemek istiyor</Text>
                                    <View style={styles.reqActions}>
                                        <PrimaryButton title="Kabul Et" color="#16a34a" onPress={() => respondLink(r.id, 'ACCEPTED')} style={{ flex: 1, marginRight: 8 }} />
                                        <OutlineButton title="Reddet" color="#dc2626" onPress={() => respondLink(r.id, 'REJECTED')} style={{ flex: 1 }} />
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}

                    <SectionTitle>Ödevlerim</SectionTitle>
                </View>
            }
            data={pendingFirst.concat(assignments.filter((a) => a.status !== 'PENDING'))}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<EmptyState text="Henüz ödeviniz yok." />}
            renderItem={({ item }) => (
                <Card>
                    <View style={styles.rowTop}>
                        <Text style={styles.assignmentTitle}>{item.title}</Text>
                        {item.is_late ? (
                            <Badge text="GECİKTİ" bg="#fee2e2" color="#b91c1c" />
                        ) : item.status === 'COMPLETED' ? (
                            <Badge text="Tamamlandı" bg="#dcfce7" color="#15803d" />
                        ) : (
                            <Badge text="Bekliyor" bg="#fef3c7" color="#92400e" />
                        )}
                    </View>
                    {item.description ? <Text style={styles.assignmentDesc}>{item.description}</Text> : null}
                    <Text style={styles.dueDate}>Son teslim: {new Date(item.due_date).toLocaleString('tr-TR')}</Text>
                    {item.status === 'PENDING' && (
                        <TouchableOpacity onPress={() => markComplete(item.id)} style={[styles.completeBtn, { borderColor: accent }]}>
                            <Text style={[styles.completeBtnText, { color: accent }]}>Tamamlandı olarak işaretle</Text>
                        </TouchableOpacity>
                    )}
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
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    assignmentTitle: { fontWeight: '700', fontSize: 15, color: '#1e293b', flex: 1, marginRight: 8 },
    assignmentDesc: { fontSize: 13, color: '#475569', marginBottom: 6 },
    dueDate: { fontSize: 12, color: '#64748b' },
    completeBtn: { marginTop: 10, borderWidth: 1.5, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    completeBtnText: { fontWeight: '700', fontSize: 12 },
});
