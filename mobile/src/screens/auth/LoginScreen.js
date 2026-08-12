import { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/UI';
import { brand, ink } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);

    const handleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const tokenResponse = await api.post('/token/', { email, password });
            const { access, refresh } = tokenResponse.data;
            api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            const profileResponse = await api.get('/accounts/profiles/me/');
            await login(profileResponse.data, access, refresh);
        } catch (err) {
            setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.brandBlock}>
                        <View style={styles.logoDot} />
                        <Text style={styles.logo}>Edu<Text style={{ color: brand.accent }}>Tracker</Text></Text>
                        <Text style={styles.tagline}>Öğrenci Takip Sistemi</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Giriş Yap</Text>

                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <View style={styles.field}>
                            <Text style={styles.label}>E-posta</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Şifre</Text>
                            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#94A3B8" />
                        </View>

                        <PrimaryButton title="Giriş Yap" onPress={handleLogin} loading={loading} color={brand.accent} style={{ marginTop: 6 }} />

                        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkWrap}>
                            <Text style={styles.link}>Şifremi unuttum</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerWrap}>
                        <Text style={styles.registerText}>Hesabın yok mu? <Text style={styles.registerLink}>Kayıt ol</Text></Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: ink[900] },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 26 },
    brandBlock: { alignItems: 'center', marginBottom: 32 },
    logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: brand.accent, marginBottom: 10 },
    logo: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
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
    cardTitle: { fontSize: 18, fontWeight: '800', color: ink[900], marginBottom: 18, letterSpacing: -0.3 },
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
    field: { marginBottom: 16 },
    label: { fontSize: 12.5, fontWeight: '700', color: '#475569', marginBottom: 6 },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: ink[900],
    },
    linkWrap: { marginTop: 16, alignItems: 'center' },
    link: { color: brand.accent, fontSize: 13, fontWeight: '700' },
    registerWrap: { marginTop: 22, alignItems: 'center' },
    registerText: { color: '#94A3B8', fontSize: 13 },
    registerLink: { color: '#fff', fontWeight: '700' },
});
