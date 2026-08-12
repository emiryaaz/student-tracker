import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import api from '../../api/client';
import { PrimaryButton } from '../../components/UI';
import { brand, ink } from '../../theme/colors';

export default function ResetPasswordScreen({ route, navigation }) {
    const initialUid = route?.params?.uid || '';
    const initialToken = route?.params?.token || '';

    const [uid, setUid] = useState(initialUid);
    const [token, setToken] = useState(initialToken);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        if (!uid || !token) {
            setError('Lütfen e-postanızdaki linkteki uid ve token değerlerini girin.');
            return;
        }
        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalı.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/accounts/password-reset/confirm/', { uid, token, new_password: password });
            setSuccess(true);
            setTimeout(() => navigation.replace('Login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Bağlantının süresi dolmuş ya da geçersiz.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.logo}>Edu<Text style={{ color: brand.accent }}>Tracker</Text></Text>

                <View style={styles.card}>
                    <Text style={styles.title}>Yeni Şifre Belirle</Text>

                    {success ? (
                        <Text style={styles.success}>Şifreniz güncellendi. Girişe yönlendiriliyorsunuz...</Text>
                    ) : (
                        <View>
                            {error ? <Text style={styles.error}>{error}</Text> : null}
                            {!initialUid && (
                                <>
                                    <TextInput style={styles.input} value={uid} onChangeText={setUid} placeholder="uid (linkteki)" placeholderTextColor="#94A3B8" autoCapitalize="none" />
                                    <TextInput style={[styles.input, { marginTop: 10 }]} value={token} onChangeText={setToken} placeholder="token (linkteki)" placeholderTextColor="#94A3B8" autoCapitalize="none" />
                                </>
                            )}
                            <TextInput style={[styles.input, { marginTop: 10 }]} value={password} onChangeText={setPassword} placeholder="Yeni şifre" placeholderTextColor="#94A3B8" secureTextEntry />
                            <TextInput style={[styles.input, { marginTop: 10 }]} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Yeni şifre (tekrar)" placeholderTextColor="#94A3B8" secureTextEntry />
                            <PrimaryButton title="Şifreyi Güncelle" onPress={handleSubmit} loading={loading} color={brand.accent} style={{ marginTop: 14 }} />
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: ink[900] },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 26 },
    logo: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 24 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
    title: { fontSize: 17, fontWeight: '800', color: ink[900], marginBottom: 14, textAlign: 'center' },
    error: { color: '#dc2626', textAlign: 'center', marginBottom: 10, fontSize: 12.5 },
    success: { color: '#16a34a', textAlign: 'center', fontSize: 14 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: ink[900] },
});
