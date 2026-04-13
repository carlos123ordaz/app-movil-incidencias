import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from "../../config";

const api: AxiosInstance = axios.create({
    baseURL: CONFIG.api_url,
    timeout: 50000,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        } catch (error) {
            console.error('Error al obtener token:', error);
            return config;
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(
                    `${CONFIG.api_url}/api/auth/refresh`,
                    { refreshToken }
                );

                const { accessToken } = response.data;
                await AsyncStorage.setItem('accessToken', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
