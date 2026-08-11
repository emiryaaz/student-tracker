import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { PrimaryButton } from '../../components/UI';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            await api.post('/accounts/password-reset/request/', { email });
            setSent(true);
        } catch (err) {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Şifremi Unuttum</Text>

            {sent ? (
                <View>
                    <Text style={styles.info}>
                        Bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi. Not: geliştirme ortamında bu link gerçek bir e-postaya değil, sunucu loglarına düşer.
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
                        <Text style={styles.link}>Girişe dön</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View>
                    <Text style={styles.info}>Hesabınıza kayıtlı e-posta adresini girin.</Text>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="E-posta"
                    />
                    <PrimaryButton title="Sıfırlama Linki Gönder" onPress={handleSubmit} loading={loading} color="#2563eb" style={{ marginTop: 12 }} />
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
                        <Text style={styles.link}>Girişe dön</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f1f5f9' },
    title: { fontSize: 22, fontWeight: '800', color: '#2563eb', textAlign: 'center', marginBottom: 16 },
    info: { fontSize: 13, color: '#475569', marginBottom: 14, textAlign: 'center' },
    error: { color: '#dc2626', textAlign: 'center', marginBottom: 10, fontSize: 13 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
    linkWrap: { marginTop: 16, alignItems: 'center' },
    link: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
});
