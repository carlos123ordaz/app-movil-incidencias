import api from "./";
import axios, { AxiosResponse } from "axios";
import { CONFIG } from "../../config";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
<<<<<<< HEAD
import { AuthResponse } from "../types";

const login = (email: string, password: string): Promise<AxiosResponse<AuthResponse>> => {
    return axios.post(`${CONFIG.api_url}/api/auth/login`, {
=======
import type { IAuthResponse } from '../types';

const login = (email: string, password: string) => {
    return axios.post<IAuthResponse>(`${CONFIG.api_url}/api/auth/login`, {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        email,
        password
    });
};

<<<<<<< HEAD
/**
 * Inicia el flujo OAuth de Microsoft usando el navegador del dispositivo.
 * Abre el browser, el backend redirige a Microsoft, y al completarse
 * redirige de vuelta a la app con los tokens via deep link.
 */
const microsoftLogin = async (): Promise<AuthResponse> => {
    const redirectUri = Linking.createURL('auth/callback');
=======
const microsoftLogin = async (): Promise<IAuthResponse> => {
    const redirectUri = Linking.createURL('auth/microsoft-callback');
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9

    const authUrl =
        `${CONFIG.api_url}/api/auth/microsoft/login` +
        `?platform=mobile` +
        `&redirectUri=${encodeURIComponent(redirectUri)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success') {
        throw new Error('Inicio de sesion cancelado');
    }

    const url = new URL(result.url);
    const params = url.searchParams || new URLSearchParams(url.search);

    const error = params.get('error');
    if (error) {
        const errorMessages: Record<string, string> = {
<<<<<<< HEAD
            'no_code': 'No se recibió código de autorización',
=======
            'no_code': 'No se recibio codigo de autorizacion',
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            'inactive': 'Usuario inactivo. Contacta al administrador.',
            'microsoft_auth_failed': 'Error al autenticar con Microsoft',
        };
        throw new Error(errorMessages[error] || 'Error de autenticacion');
    }

    const token = params.get('token');
    const refresh = params.get('refresh');
    const userParam = params.get('user');

    if (!token || !refresh) {
        throw new Error('No se recibieron las credenciales');
    }

    const user = userParam ? JSON.parse(decodeURIComponent(userParam)) : null;

    return { accessToken: token, refreshToken: refresh, user };
};

<<<<<<< HEAD
const refreshToken = (refreshToken: string): Promise<AxiosResponse> => {
=======
const refreshToken = (token: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
    return axios.post(`${CONFIG.api_url}/api/auth/refresh`, {
        refreshToken: token
    });
};

const logout = (): Promise<AxiosResponse> => {
    return api.post('/api/auth/logout');
};

<<<<<<< HEAD
const changePassword = (userId: string, currentPassword: string, newPassword: string): Promise<AxiosResponse> => {
=======
const changePassword = (userId: string, currentPassword: string, newPassword: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
    return api.post('/api/auth/change-password', {
        userId,
        currentPassword,
        newPassword
    });
};

export {
    login,
    microsoftLogin,
    refreshToken,
    logout,
    changePassword
};
