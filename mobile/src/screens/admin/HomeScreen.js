import { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { getRoleColors } from '../../theme/colors';
import { Card, Badge, PrimaryButton, OutlineButton, EmptyState } from '../../components/UI';

const FILTERS = [
    { value: 'PENDING', label: 'Bekleyen' },
    { value: 'APPROVED', label: 'Onaylı' },
    { value: 'REJECTED', label: 'Reddedilen' },
    { value: '', label: 'Tümü' },
];

export default function AdminHomeScreen() {
    const accent = getRoleColors('ADMIN').accent;
    const [filter, setFilter] = useState('PENDING');
    const [teachers, setTeachers] = useState([]);
    const [notes, setNotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTeachers = useCallback(async (statusFilter) => {
        try {
            const qs = statusFilter ? `?status=${statusFilter}` : '';
            const res = await api.get(`/accounts/admin/teacher-verifications/${qs}`);
            setTeachers(res.data);
        } catch (e) {
            console.log('Doğrulama kuyruğu çekilemedi', e);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchTeachers(filter).finally(() => setLoading(false));
    }, [filter, fetchTeachers]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTeachers(filter);
        setRefreshing(false);
    };

    const review = async (id, status) => {
        try {
            await api.patch(`/accounts/admin/teacher-verifications/${id}/review/`, { status, note: notes[id] || '' });
            fetchTeachers(filter);
        } catch (e) {
            Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={accent} size="large" /></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        onPress={() => setFilter(f.value)}
                        style={[styles.filterChip, filter === f.value && { backgroundColor: accent, borderColor: accent }]}
                    >
                        <Text style={[styles.filterChipText, filter === f.value && { color: '#fff' }]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={teachers}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 14 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}
                ListEmptyComponent={<EmptyState text="Bu kategoride öğretmen yok." />}
                renderItem={({ item }) => (
                    <Card>
                        <View style={styles.rowTop}>
                            <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                            <Badge
                                text={item.verification_status}
                                bg={item.verification_status === 'APPROVED' ? '#dcfce7' : item.verification_status === 'REJECTED' ? '#fee2e2' : '#fef3c7'}
                                color={item.verification_status === 'APPROVED' ? '#15803d' : item.verification_status === 'REJECTED' ? '#b91c1c' : '#92400e'}
                            />
                        </View>
                        <Text style={styles.email}>{item.email}</Text>
                        {item.diploma_document ? (
                            <Text style={styles.diplomaLink}>Diploma yüklendi (web panelinden görüntülenebilir)</Text>
                        ) : (
                            <Text style={styles.diplomaMissing}>Diploma yüklenmemiş</Text>
                        )}
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Not (opsiyonel)"
                            value={notes[item.id] || ''}
                            onChangeText={(t) => setNotes((prev) => ({ ...prev, [item.id]: t }))}
                        />
                        <View style={styles.actionsRow}>
                            <PrimaryButton title="Onayla" color="#16a34a" onPress={() => review(item.id, 'APPROVED')} style={{ flex: 1, marginRight: 8 }} />
                            <OutlineButton title="Reddet" color="#dc2626" onPress={() => review(item.id, 'REJECTED')} style={{ flex: 1 }} />
                        </View>
                    </Card>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
    filterChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: '#e2e8f0', marginRight: 8, marginBottom: 8 },
    filterChipText: { fontSize: 12, fontWeight: '700', color: '#334155' },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontWeight: '700', fontSize: 15, color: '#1e293b' },
    email: { fontSize: 12, color: '#64748b', marginBottom: 8 },
    diplomaLink: { fontSize: 12, color: '#0369a1', marginBottom: 10 },
    diplomaMissing: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },
    noteInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, marginBottom: 10 },
    actionsRow: { flexDirection: 'row' },
});
