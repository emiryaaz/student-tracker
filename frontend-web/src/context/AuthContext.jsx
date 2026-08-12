import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('access');
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/accounts/profiles/me/');
                    setUser(response.data);
                } catch {
                    logout();
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = (userData, accessToken, refreshToken) => {
        localStorage.setItem('access', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh', refreshToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};