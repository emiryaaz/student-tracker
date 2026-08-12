import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import api from '../../api/client';
import { PrimaryButton } from '../../components/UI';
import { brand, ink } from '../../theme/colors';

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
        <View style={styles.root}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.logo}>Edu<Text style={{ color: brand.accent }}>Tracker</Text></Text>

                <View style={styles.card}>
                    <Text style={styles.title}>Şifremi Unuttum</Text>

                    {sent ? (
                        <View>
                            <Text style={styles.info}>
                                Bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama linki gönderildi. Geliştirme ortamında bu link gerçek bir e-postaya değil, sunucu loglarına düşer.
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
                                placeholderTextColor="#94A3B8"
                            />
                            <PrimaryButton title="Sıfırlama Linki Gönder" onPress={handleSubmit} loading={loading} color={brand.accent} style={{ marginTop: 14 }} />
                            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
                                <Text style={styles.link}>Girişe dön</Text>
                            </TouchableOpacity>
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
    info: { fontSize: 12.5, color: '#5B6B82', marginBottom: 14, textAlign: 'center', lineHeight: 18 },
    error: { color: '#dc2626', textAlign: 'center', marginBottom: 10, fontSize: 12.5 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: ink[900] },
    linkWrap: { marginTop: 16, alignItems: 'center' },
    link: { color: brand.accent, fontSize: 13, fontWeight: '700' },
});
