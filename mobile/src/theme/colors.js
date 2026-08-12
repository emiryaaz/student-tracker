export const ink = {
    900: '#0F172A',
    800: '#16223A',
    700: '#1E2A3D',
    600: '#2C3B52',
    500: '#4B5A6E',
};

const roles = {
    TEACHER: { 400: '#E4BA6E', 500: '#D4A24C', 600: '#B8853A', 700: '#96692B' },
    STUDENT: { 400: '#4FE0D1', 500: '#22C7B8', 600: '#159C90', 700: '#0F7A71' },
    PARENT: { 400: '#D97E92', 500: '#B45166', 600: '#93394C', 700: '#742B3B' },
    ADMIN: { 400: '#7C93E0', 500: '#5875D6', 600: '#3E5BC0', 700: '#2F469A' },
};

export const status = {
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
};

const mixWithWhite = (hex, ratio) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const blend = (c) => Math.round(c * ratio + 255 * (1 - ratio));
    return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
};

export const getRoleColors = (role) => {
    const palette = roles[role] || roles.STUDENT;
    return {
        accent: palette[600],
        accentHover: palette[700],
        accentSoft: mixWithWhite(palette[500], 0.14),
        accentLight: palette[400],
        text: palette[700],
    };
};

export const roleColors = roles;

export const neutral = {
    bg: '#F9FAFB',
    card: '#FFFFFF',
    border: '#F3F4F6',
    borderStrong: '#E5E7EB',
    text: ink[900],
    textMuted: '#6B7280',
    ...status,
};

export const brand = {
    primary: ink[900],
    accent: roles.STUDENT[600],
    accentSoft: mixWithWhite(roles.STUDENT[500], 0.12),
};
