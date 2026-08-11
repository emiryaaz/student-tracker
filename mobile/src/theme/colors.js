// index.css'teki role-teacher/role-student/role-parent/role-admin renk paletleriyle eşleşir.
export const roleColors = {
    TEACHER: { accent: '#d97706', accentLight: '#fef3c7', accentDark: '#92400e' }, // amber
    STUDENT: { accent: '#0d9488', accentLight: '#ccfbf1', accentDark: '#115e59' }, // turkuaz
    PARENT: { accent: '#e11d48', accentLight: '#ffe4e6', accentDark: '#9f1239' }, // gül/bordo
    ADMIN: { accent: '#4f46e5', accentLight: '#e0e7ff', accentDark: '#3730a3' }, // indigo
};

export const neutral = {
    bg: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    danger: '#dc2626',
    success: '#16a34a',
};

export const getRoleColors = (role) => roleColors[role] || roleColors.STUDENT;
