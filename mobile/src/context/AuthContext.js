import { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setOnSessionExpired } from '../api/client';
import { configurePurchases, logOutPurchases } from '../services/purchases';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        await AsyncStorage.multiRemove(['access', 'refresh']);
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        await logOutPurchases();
    }, []);

    useEffect(() => {
        setOnSessionExpired(() => {
            logout();
        });
    }, [logout]);

    useEffect(() => {
        const fetchUser = async () => {
            const token = await AsyncStorage.getItem('access');
            if (token) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/accounts/profiles/me/');
                    setUser(response.data);
                    identifyForPurchases(response.data);
                } catch (error) {
                    console.log('Oturum süresi dolmuş veya geçersiz token.');
                    await logout();
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, [logout]);

    const identifyForPurchases = (userData) => {
        const role = userData?.role || userData?.user?.role;
        const uid = userData?.user_id || userData?.user?.id || userData?.id;
        if (role === 'TEACHER' && uid) {
            configurePurchases(String(uid));
        }
    };

    const login = async (userData, accessToken, refreshToken) => {
        await AsyncStorage.setItem('access', accessToken);
        if (refreshToken) {
            await AsyncStorage.setItem('refresh', refreshToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        setUser(userData);
        identifyForPurchases(userData);
    };

    const refreshUser = async () => {
        try {
            const response = await api.get('/accounts/profiles/me/');
            setUser(response.data);
        } catch (error) {
            console.log('Kullanıcı bilgisi tazelenemedi.', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
