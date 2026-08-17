import { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { getRoleColors } from '../../theme/colors';
import { Card, Badge, OutlineButton, PrimaryButton, SectionTitle } from '../../components/UI';
import { getTeacherOffering, purchaseTeacherPackage, restorePurchases } from '../../services/purchases';

const VERIFICATION_LABEL = {
    NOT_SUBMITTED: { text: 'Diploma yüklenmedi', bg: '#fef3c7', color: '#92400e' },
    PENDING: { text: 'İnceleniyor', bg: '#fef3c7', color: '#92400e' },
    APPROVED: { text: '✓ Doğrulanmış Öğretmen', bg: '#dcfce7', color: '#15803d' },
    REJECTED: { text: 'Reddedildi', bg: '#fee2e2', color: '#b91c1c' },
};

export default function TeacherProfileScreen() {
    const { user, logout, refreshUser } = useContext(AuthContext);
    const accent = getRoleColors('TEACHER').accent;
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const verification = VERIFICATION_LABEL[user?.verification_status] || VERIFICATION_LABEL.NOT_SUBMITTED;
    const hasAccess = user?.is_subscribed || user?.subscription_exempt;

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istiyor musunuz?', [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
        ]);
    };

    const handleSubscribe = async () => {
        setPurchasing(true);
        try {
            const offering = await getTeacherOffering();
            const pkg = offering?.availablePackages?.[0];
            if (!pkg) {
                Alert.alert('Şu anda kullanılamıyor', 'Abonelik seçeneği yüklenemedi, lütfen daha sonra tekrar deneyin.');
                return;
            }
            const active = await purchaseTeacherPackage(pkg);
            if (active) {
                await refreshUser();
                Alert.alert('Teşekkürler!', 'Aboneliğiniz aktif edildi.');
            }
        } catch (error) {
            if (!error?.userCancelled) {
                Alert.alert('Hata', 'Satın alma işlemi tamamlanamadı. Lütfen tekrar deneyin.');
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        try {
            const active = await restorePurchases();
            await refreshUser();
            Alert.alert(active ? 'Bulundu' : 'Bulunamadı', active ? 'Aktif aboneliğiniz geri yüklendi.' : 'Geri yüklenecek aktif bir abonelik bulunamadı.');
        } catch (error) {
            Alert.alert('Hata', 'Geri yükleme işlemi başarısız oldu.');
        } finally {
            setRestoring(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 14 }}>
            <SectionTitle>Profilim</SectionTitle>
            <Card>
                <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                {user?.title ? <Text style={styles.title}>{user.title}</Text> : null}
                <View style={{ marginTop: 10 }}>
                    <Badge text={verification.text} bg={verification.bg} color={verification.color} />
                    {!user?.is_verified && (
                        <Text style={styles.warning}>
                            Sistemimiz tarafından doğrulanmamış öğretmenler öğrenci/velilere bu şekilde görünür.
                            Diploma yükleme, şu an web panelinden yapılabiliyor.
                        </Text>
                    )}
                </View>
            </Card>

            {user?.bio ? (
                <Card>
                    <Text style={styles.bioLabel}>Hakkımda</Text>
                    <Text style={styles.bio}>{user.bio}</Text>
                </Card>
            ) : null}

            <SectionTitle style={{ marginTop: 6 }}>Abonelik</SectionTitle>
            <Card>
                {hasAccess ? (
                    <>
                        <Badge
                            text={user?.subscription_exempt ? '✓ Ücretsiz Erişim' : '✓ Aktif Abone'}
                            bg="#dcfce7"
                            color="#15803d"
                        />
                        <Text style={styles.subText}>
                            Vitrinde görünüyorsunuz ve yeni öğrenci talebi kabul edebiliyorsunuz.
                        </Text>
                    </>
                ) : (
                    <>
                        <Badge text="Abone Değil" bg="#fee2e2" color="#b91c1c" />
                        <Text style={styles.subText}>
                            Vitrinde görünmek ve yeni öğrenci talebi kabul edebilmek için aylık aboneliğe ihtiyacınız var.
                        </Text>
                        {purchasing ? (
                            <ActivityIndicator color={accent} style={{ marginTop: 12 }} />
                        ) : (
                            <PrimaryButton title="Abone Ol" color={accent} onPress={handleSubscribe} style={{ marginTop: 12 }} />
                        )}
                        <OutlineButton
                            title={restoring ? 'Kontrol ediliyor...' : 'Satın Alımları Geri Yükle'}
                            color={accent}
                            onPress={handleRestore}
                            style={{ marginTop: 8 }}
                        />
                    </>
                )}
            </Card>

            <OutlineButton title="Çıkış Yap" color="#dc2626" onPress={handleLogout} style={{ marginTop: 10 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    name: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
    email: { fontSize: 13, color: '#64748b', marginTop: 2 },
    title: { fontSize: 13, color: '#334155', marginTop: 6, fontStyle: 'italic' },
    warning: { fontSize: 11, color: '#b91c1c', marginTop: 8 },
    bioLabel: { fontWeight: '700', fontSize: 13, color: '#1e293b', marginBottom: 6 },
    bio: { fontSize: 13, color: '#475569', lineHeight: 19 },
    subText: { fontSize: 12.5, color: '#475569', marginTop: 8, lineHeight: 18 },
});
