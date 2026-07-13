import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Sayfa yenilendiğinde token varsa kullanıcı bilgilerini çek
        const fetchUser = async () => {
            const token = localStorage.getItem('access');
            if (token) {
                try {
                    // API isteklerine otomatik olarak token'ı ekle
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Yazdığımız /me/ uç noktasından profili getir
                    const response = await api.get('/accounts/profiles/me/');
                    setUser(response.data);
                } catch (error) {
                    console.error("Oturum süresi dolmuş veya geçersiz token.");
                    logout();
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('access', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};