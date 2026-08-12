import { useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors } from '../../theme/colors';
import { EmptyState } from '../../components/UI';

const toDateKey = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTime = (isoString) => new Date(isoString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

export default function CalendarScreen() {
    const { user } = useContext(AuthContext);
    const accent = getRoleColors(user?.role || user?.user?.role).accent;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lessons, setLessons] = useState([]);
    const [homeworks, setHomeworks] = useState([]);
    const [exams, setExams] = useState([]);

    const fetchAll = async () => {
        try {
            const [lessonsRes, hwRes, examsRes] = await Promise.allSettled([
                api.get('/school/calendar-events/'),
                api.get('/school/assignments/'),
                api.get('/school/exams/'),
            ]);
            setLessons(lessonsRes.status === 'fulfilled' ? lessonsRes.value.data : []);
            setHomeworks(hwRes.status === 'fulfilled' ? hwRes.value.data : []);
            setExams(examsRes.status === 'fulfilled' ? examsRes.value.data : []);
        } catch (e) {
            console.log('Takvim verisi çekilemedi', e);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAll().finally(() => setLoading(false));
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    const sections = useMemo(() => {
        const map = {};
        const ensure = (key) => {
            if (!map[key]) map[key] = { title: key, data: [] };
            return map[key];
        };
        lessons.forEach((ev) => {
            const key = toDateKey(ev.start_time);
            if (key) ensure(key).data.push({ kind: 'lesson', id: `l-${ev.id}`, title: ev.title, time: `${formatTime(ev.start_time)} - ${formatTime(ev.end_time)}`, sub: ev.description });
        });
        homeworks.forEach((hw) => {
            const key = toDateKey(hw.due_date);
            if (key) ensure(key).data.push({ kind: 'homework', id: `h-${hw.id}`, title: hw.title, time: `Son teslim ${formatTime(hw.due_date)}`, sub: hw.student_name });
        });
        exams.forEach((ex) => {
            const key = ex.exam_date;
            if (key) ensure(key).data.push({ kind: 'exam', id: `e-${ex.id}`, title: ex.exam_name, time: `Puan: ${ex.score}`, sub: ex.student_name });
        });
        return Object.values(map).sort((a, b) => (a.title < b.title ? -1 : 1));
    }, [lessons, homeworks, exams]);

    const dotColor = { lesson: '#eab308', homework: '#22c55e', exam: '#ef4444' };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={accent} size="large" /></View>;
    }

    return (
        <SectionList
            style={styles.container}
            sections={sections}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}
            ListEmptyComponent={<EmptyState text="Yaklaşan etkinlik bulunmuyor." />}
            renderSectionHeader={({ section }) => (
                <Text style={styles.sectionHeader}>
                    {new Date(section.title + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                </Text>
            )}
            renderItem={({ item }) => (
                <View style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: dotColor[item.kind] }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{item.title}</Text>
                        <Text style={styles.rowTime}>{item.time}</Text>
                        {item.sub ? <Text style={styles.rowSub}>{item.sub}</Text> : null}
                    </View>
                </View>
            )}
            contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sectionHeader: { fontWeight: '800', fontSize: 13, color: '#334155', textTransform: 'capitalize', marginTop: 16, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 8 },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 10 },
    rowTitle: { fontWeight: '700', fontSize: 14, color: '#1e293b' },
    rowTime: { fontSize: 12, color: '#64748b', marginTop: 2 },
    rowSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});
