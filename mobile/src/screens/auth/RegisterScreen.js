import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../../api/client';
import { PrimaryButton } from '../../components/UI';

const ROLES = [
    { value: 'STUDENT', label: 'Öğrenci' },
    { value: 'TEACHER', label: 'Öğretmen' },
    { value: 'PARENT', label: 'Veli' },
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

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Kayıt Ol</Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.row}>
                    <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Ad</Text>
                        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
                    </View>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.label}>Soyad</Text>
                        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
                    </View>
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>E-posta</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Şifre</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Rol</Text>
                    <View style={styles.roleRow}>
                        {ROLES.map((r) => (
                            <TouchableOpacity
                                key={r.value}
                                onPress={() => setRole(r.value)}
                                style={[styles.roleChip, role === r.value && styles.roleChipActive]}
                            >
                                <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>{r.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <PrimaryButton title="Kayıt Ol" onPress={handleRegister} loading={loading} color="#2563eb" style={{ marginTop: 8 }} />

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
                    <Text style={styles.link}>Zaten hesabın var mı? Giriş yap</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f1f5f9',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#2563eb',
        textAlign: 'center',
        marginBottom: 20,
    },
    error: {
        color: '#dc2626',
        textAlign: 'center',
        marginBottom: 12,
        fontSize: 13,
    },
    row: {
        flexDirection: 'row',
    },
    field: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
    },
    roleRow: {
        flexDirection: 'row',
        gap: 8,
    },
    roleChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        marginRight: 8,
    },
    roleChipActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    roleChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    roleChipTextActive: {
        color: '#fff',
    },
    linkWrap: {
        marginTop: 16,
        alignItems: 'center',
    },
    link: {
        color: '#2563eb',
        fontSize: 13,
        fontWeight: '600',
    },
});
