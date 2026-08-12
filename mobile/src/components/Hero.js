import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './UI';
import { ink } from '../theme/colors';

export default function Hero({ eyebrow, name, subtitle, accent, accentSoft }) {
    return (
        <View style={[styles.wrap, { backgroundColor: accentSoft }]}>
            <Avatar name={name} color={accent} size={48} />
            <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.eyebrow}>{eyebrow}</Text>
                <Text style={styles.name} numberOfLines={1}>{name || ''}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: '800',
        color: ink[500],
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    name: {
        fontSize: 19,
        fontWeight: '800',
        color: ink[900],
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 12.5,
        color: '#5B6B82',
        marginTop: 2,
    },
});
