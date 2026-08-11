import { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { AuthContext } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/UI';

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
            // Navigasyon RootNavigator'da user state'ine göre otomatik değişecek
        } catch (err) {
            setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>EduTracker</Text>
                <Text style={styles.subtitle}>Öğrenci Takip Sistemi</Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.field}>
                    <Text style={styles.label}>E-posta</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
                <View style={styles.field}>
                    <Text style={styles.label}>Şifre</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
                </View>

                <PrimaryButton title="Giriş Yap" onPress={handleLogin} loading={loading} color="#2563eb" style={{ marginTop: 8 }} />

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkWrap}>
                    <Text style={styles.link}>Şifremi unuttum</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
                    <Text style={styles.link}>Hesabın yok mu? Kayıt ol</Text>
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
        fontSize: 28,
        fontWeight: '800',
        color: '#2563eb',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    error: {
        color: '#dc2626',
        textAlign: 'center',
        marginBottom: 12,
        fontSize: 13,
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
    linkWrap: {
        marginTop: 14,
        alignItems: 'center',
    },
    link: {
        color: '#2563eb',
        fontSize: 13,
        fontWeight: '600',
    },
});
