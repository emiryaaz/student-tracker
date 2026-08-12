import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../api/client';
import { PrimaryButton } from '../../components/UI';
import { brand, ink, roleColors } from '../../theme/colors';

const ROLES = [
    { value: 'STUDENT', label: 'Öğrenci', color: roleColors.STUDENT[600] },
    { value: 'TEACHER', label: 'Öğretmen', color: roleColors.TEACHER[600] },
    { value: 'PARENT', label: 'Veli', color: roleColors.PARENT[600] },
];

export default function RegisterScreen({ navigation }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        setError('');
        setLoading(true);
        try {
            await api.post('/accounts/register/', {
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                role,
            });
            navigation.replace('Login');
        } catch (err) {
            const data = err.response?.data;
            const msg = data ? Object.values(data).flat().join(' ') : 'Kayıt başarısız oldu.';
            setError(msg);
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const selectedRole = ROLES.find((r) => r.value === role);

    return (
        <View style={styles.root}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.brandBlock}>
                        <Text style={styles.logo}>Edu<Text style={{ color: brand.accent }}>Tracker</Text></Text>
                        <Text style={styles.tagline}>Hemen ücretsiz hesap oluştur</Text>
                    </View>

                    <View style={styles.card}>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Ad</Text>
                                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholderTextColor="#94A3B8" />
                            </View>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Soyad</Text>
                                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholderTextColor="#94A3B8" />
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>E-posta</Text>
                            <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#94A3B8" />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Şifre</Text>
                            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#94A3B8" />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Rol</Text>
                            <View style={styles.roleRow}>
                                {ROLES.map((r) => {
                                    const active = role === r.value;
                                    return (
                                        <TouchableOpacity
                                            key={r.value}
                                            onPress={() => setRole(r.value)}
                                            style={[styles.roleChip, active && { backgroundColor: r.color, borderColor: r.color }]}
                                        >
                                            <Text style={[styles.roleChipText, active && { color: '#fff' }]}>{r.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <PrimaryButton title="Kayıt Ol" onPress={handleRegister} loading={loading} color={selectedRole?.color || brand.accent} style={{ marginTop: 6 }} />
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.registerWrap}>
                        <Text style={styles.registerText}>Zaten hesabın var mı? <Text style={styles.registerLink}>Giriş yap</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: ink[900] },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 26 },
    brandBlock: { alignItems: 'center', marginBottom: 24 },
    logo: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    tagline: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 6,
    },
    error: {
        color: '#dc2626',
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        textAlign: 'center',
        marginBottom: 14,
        fontSize: 12.5,
    },
    row: { flexDirection: 'row' },
    field: { marginBottom: 14 },
    label: { fontSize: 12.5, fontWeight: '700', color: '#475569', marginBottom: 6 },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 15,
        color: ink[900],
    },
    roleRow: { flexDirection: 'row' },
    roleChip: {
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    roleChipText: { fontSize: 12.5, fontWeight: '700', color: '#475569' },
    registerWrap: { marginTop: 22, alignItems: 'center' },
    registerText: { color: '#94A3B8', fontSize: 13 },
    registerLink: { color: '#fff', fontWeight: '700' },
});
