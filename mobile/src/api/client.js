import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ÖNEMLİ: Mobil cihaz/emülatör "localhost" derken kendi üzerini kasteder, bilgisayarınızdaki
// Django sunucusunu değil. Bu yüzden burada bilgisayarınızın yerel ağ IP adresini kullanmanız
// gerekiyor (örn. 192.168.1.34). Terminalde `ipconfig` (Windows) ile bulabilirsiniz.
//   - Android emülatörü kullanıyorsanız: 10.0.2.2 çalışır (emülatörden bilgisayara özel takma ad)
//   - Gerçek telefon + Expo Go kullanıyorsanız: bilgisayarınızın LAN IP'sini yazmalısınız
//   - iOS simülatörü (Mac): 'localhost' doğrudan çalışır
export const API_BASE_URL = 'http://10.0.2.2:8000/api';
// export const API_BASE_URL = 'http://192.168.1.34:8000/api'; // <- kendi IP'niz için örnek

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Access token süresi dolunca (401) refresh token ile otomatik yenile ve isteği tekrar dene
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    refreshQueue = [];
};

// Oturum süresi dolduğunda dinleyicilere (AuthContext) haber vermek için basit bir event bus
let onSessionExpired = null;
export const setOnSessionExpired = (cb) => {
    onSessionExpired = cb;
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            const refreshToken = await AsyncStorage.getItem('refresh');
            if (!refreshToken) {
                await AsyncStorage.multiRemove(['access', 'refresh']);
                if (onSessionExpired) onSessionExpired();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                }).then((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken,
                });
                await AsyncStorage.setItem('access', data.access);
                api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
                processQueue(null, data.access);
                originalRequest.headers.Authorization = `Bearer ${data.access}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await AsyncStorage.multiRemove(['access', 'refresh']);
                if (onSessionExpired) onSessionExpired();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
