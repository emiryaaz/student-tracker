import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { neutral } from '../theme/colors';

export const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>{children}</View>
);

export const SectionTitle = ({ children, style }) => (
    <Text style={[styles.sectionTitle, style]}>{children}</Text>
);

export const PrimaryButton = ({ title, onPress, color, disabled, loading, style }) => (
    <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
            styles.button,
            { backgroundColor: color || neutral.text, opacity: disabled ? 0.45 : 1 },
            style,
        ]}
    >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}
    </TouchableOpacity>
);

export const OutlineButton = ({ title, onPress, color, style }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.outlineButton, { borderColor: color || neutral.text }, style]}>
        <Text style={[styles.outlineButtonText, { color: color || neutral.text }]}>{title}</Text>
    </TouchableOpacity>
);

export const Badge = ({ text, bg, color }) => (
    <View style={[styles.badge, { backgroundColor: bg || '#EEF1F5' }]}>
        <Text style={[styles.badgeText, { color: color || '#374151' }]}>{text}</Text>
    </View>
);

export const Avatar = ({ name, color, size = 44 }) => (
    <View style={[styles.avatar, { backgroundColor: color || neutral.text, width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{name?.[0]?.toUpperCase() || '?'}</Text>
    </View>
);

export const EmptyState = ({ text, icon = '—' }) => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>{icon}</Text>
        <Text style={styles.emptyStateText}>{text}</Text>
    </View>
);

export const Screen = ({ children, style }) => (
    <View style={[styles.screen, style]}>{children}</View>
);

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: neutral.bg,
    },
    card: {
        backgroundColor: neutral.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: neutral.border,
        marginBottom: 12,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: neutral.text,
        letterSpacing: -0.2,
        marginBottom: 10,
    },
    button: {
        paddingVertical: 13,
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: -0.1,
    },
    outlineButton: {
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineButtonText: {
        fontWeight: '700',
        fontSize: 13,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: '800',
    },
    emptyState: {
        paddingVertical: 36,
        alignItems: 'center',
    },
    emptyStateIcon: {
        fontSize: 26,
        marginBottom: 8,
        opacity: 0.35,
    },
    emptyStateText: {
        color: neutral.textMuted,
        fontSize: 13,
        textAlign: 'center',
    },
});
