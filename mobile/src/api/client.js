import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://10.0.2.2:8000/api';
// export const API_BASE_URL = 'http://192.168.1.34:8000/api';

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

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token);
    });
    refreshQueue = [];
};

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
