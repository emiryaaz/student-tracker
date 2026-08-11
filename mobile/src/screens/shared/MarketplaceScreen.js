import { useContext, useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity,
    Modal, Alert, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors, neutral } from '../../theme/colors';
import { Card, Badge, PrimaryButton, OutlineButton, EmptyState } from '../../components/UI';

// Öğrenci ve veli panelindeki "Eğitmen Vitrini" sekmesi. Veli, hangi çocuğu için talep
// gönderdiğini seçmek zorunda (backend bunu zorunlu kılıyor); öğrenci direkt kendi adına
// talep gönderir. Web'deki TeacherProfile.jsx / InternalMarketplace.jsx ile aynı iş kuralları.
export default function MarketplaceScreen() {
    const { user } = useContext(AuthContext);
    const navigation = useNavigation();
    const role = user?.role || user?.user?.role;
    const accent = getRoleColors(role).accent;

    const [teachers, setTeachers] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [childPicker, setChildPicker] = useState(null); // teacher object bekliyor

    const fetchAll = useCallback(async () => {
        try {
            const calls = [api.get('/accounts/teachers/'), api.get('/school/match-requests/')];
            const [teachersRes, requestsRes] = await Promise.allSettled(calls);
            setTeachers(teachersRes.status === 'fulfilled' ? teachersRes.value.data : []);
            setMyRequests(requestsRes.status === 'fulfilled' ? requestsRes.value.data : []);

            if (role === 'PARENT') {
                const meRes = await api.get('/accounts/profiles/me/');
                setChildren(meRes.data?.children || []);
            }
        } catch (e) {
            console.log('Vitrin verisi çekilemedi', e);
        }
    }, [role]);

    useEffect(() => {
        setLoading(true);
        fetchAll().finally(() => setLoading(false));
    }, [fetchAll]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    const requestStatusFor = (teacherUserId, studentUserId) => {
        const match = myRequests.find(
            (r) => Number(r.teacher) === Number(teacherUserId) && (!studentUserId || Number(r.student) === Number(studentUserId))
        );
        return match?.status || null;
    };

    const sendRequest = async (teacher, studentId) => {
        try {
            const payload = { teacher: teacher.user_id };
            if (studentId) payload.student_id = studentId;
            await api.post('/school/match-requests/', payload);
            Alert.alert('Gönderildi', 'Ders talebiniz öğretmene iletildi.');
            setChildPicker(null);
            fetchAll();
        } catch (e) {
            const detail = e.response?.data;
            const msg = Array.isArray(detail) ? detail.join(' ') : (detail?.detail || (detail ? Object.values(detail).flat().join(' ') : 'Talep gönderilemedi.'));
            Alert.alert('Hata', msg);
        }
    };

    const handleRequestPress = (teacher) => {
        if (role === 'STUDENT') {
            sendRequest(teacher, null);
        } else if (role === 'PARENT') {
            if (children.length === 0) {
                Alert.alert('Bağlı öğrenci yok', 'Talep gönderebilmek için önce bir öğrenciyi hesabınıza bağlamalısınız.');
                return;
            }
            setChildPicker(teacher);
        }
    };

    const handleMessage = (teacher) => {
        navigation.navigate('Messages', { openChatWith: teacher.user_id, openChatWithName: `${teacher.first_name} ${teacher.last_name}` });
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={accent} size="large" /></View>;
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={teachers}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ padding: 14 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}
                ListEmptyComponent={<EmptyState text="Henüz kayıtlı öğretmen yok." />}
                renderItem={({ item }) => {
                    const status = role === 'STUDENT' ? requestStatusFor(item.user_id, user?.user_id || user?.user?.id) : null;
                    return (
                        <Card>
                            <View style={styles.headerRow}>
                                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                                {item.is_verified ? (
                                    <Badge text="✓ Doğrulanmış" bg="#dcfce7" color="#15803d" />
                                ) : (
                                    <Badge text="⚠ Doğrulanmamış" bg="#fee2e2" color="#b91c1c" />
                                )}
                            </View>
                            {item.title ? <Text style={styles.subtitle}>{item.title}</Text> : null}
                            {!item.is_verified && (
                                <Text style={styles.warning}>Sistemimiz tarafından doğrulanmamış öğretmenler ile çalışmanız önerilmez.</Text>
                            )}
                            {item.bio ? <Text style={styles.bio} numberOfLines={3}>{item.bio}</Text> : null}
                            <View style={styles.metaRow}>
                                {item.hourly_rate ? <Text style={styles.meta}>{item.hourly_rate}₺ / saat</Text> : null}
                                {item.average_rating ? <Text style={styles.meta}>★ {item.average_rating} ({item.review_count})</Text> : null}
                            </View>

                            <View style={styles.actionsRow}>
                                <OutlineButton title="Mesaj Gönder" color={accent} onPress={() => handleMessage(item)} style={{ flex: 1, marginRight: 8 }} />
                                {role === 'STUDENT' && status === 'ACCEPTED' ? (
                                    <PrimaryButton title="✓ Ders Alıyorsunuz" color={neutral.success} disabled style={{ flex: 1 }} />
                                ) : role === 'STUDENT' && status === 'PENDING' ? (
                                    <PrimaryButton title="⏳ Bekleniyor" color="#f59e0b" disabled style={{ flex: 1 }} />
                                ) : (
                                    <PrimaryButton title="Ders Talep Et" color={accent} onPress={() => handleRequestPress(item)} style={{ flex: 1 }} />
                                )}
                            </View>
                        </Card>
                    );
                }}
            />

            <Modal visible={!!childPicker} transparent animationType="fade" onRequestClose={() => setChildPicker(null)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Hangi öğrenciniz için talep gönderiliyor?</Text>
                        {children.map((child) => {
                            const status = requestStatusFor(childPicker?.user_id, child.user.id);
                            const disabled = status === 'ACCEPTED' || status === 'PENDING';
                            return (
                                <TouchableOpacity
                                    key={child.id}
                                    disabled={disabled}
                                    style={[styles.childRow, disabled && { opacity: 0.5 }]}
                                    onPress={() => sendRequest(childPicker, child.user.id)}
                                >
                                    <Text style={styles.childName}>{child.user.first_name} {child.user.last_name}</Text>
                                    {status === 'ACCEPTED' && <Text style={styles.childStatus}>✓ Zaten ders alıyor</Text>}
                                    {status === 'PENDING' && <Text style={styles.childStatus}>⏳ Talep bekleniyor</Text>}
                                </TouchableOpacity>
                            );
                        })}
                        <OutlineButton title="Vazgeç" onPress={() => setChildPicker(null)} style={{ marginTop: 12 }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    subtitle: { fontSize: 13, color: '#64748b', marginBottom: 6 },
    warning: { fontSize: 11, color: '#b91c1c', marginBottom: 6 },
    bio: { fontSize: 13, color: '#475569', marginBottom: 8 },
    metaRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
    meta: { fontSize: 12, color: '#334155', fontWeight: '600', marginRight: 12 },
    actionsRow: { flexDirection: 'row' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontWeight: '700', fontSize: 15, marginBottom: 12, color: '#1e293b' },
    childRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    childName: { fontWeight: '600', fontSize: 14, color: '#1e293b' },
    childStatus: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});
