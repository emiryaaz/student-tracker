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
        onPress={onPress}
        disabled={disabled || loading}
        style={[
            styles.button,
            { backgroundColor: color || '#1e293b', opacity: disabled ? 0.5 : 1 },
            style,
        ]}
    >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}
    </TouchableOpacity>
);

export const OutlineButton = ({ title, onPress, color, style }) => (
    <TouchableOpacity onPress={onPress} style={[styles.outlineButton, { borderColor: color || '#1e293b' }, style]}>
        <Text style={[styles.outlineButtonText, { color: color || '#1e293b' }]}>{title}</Text>
    </TouchableOpacity>
);

export const Badge = ({ text, bg, color }) => (
    <View style={[styles.badge, { backgroundColor: bg || '#e2e8f0' }]}>
        <Text style={[styles.badgeText, { color: color || '#334155' }]}>{text}</Text>
    </View>
);

export const EmptyState = ({ text }) => (
    <View style={styles.emptyState}>
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
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: neutral.text,
        marginBottom: 10,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    outlineButton: {
        paddingVertical: 10,
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
        fontSize: 12,
        fontWeight: '700',
    },
    emptyState: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyStateText: {
        color: neutral.textMuted,
        fontSize: 13,
    },
});
