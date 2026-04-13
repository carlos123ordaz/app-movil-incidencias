<<<<<<< HEAD
// services/User.ts
import api from ".";
import { AxiosResponse } from "axios";

const getUserService = (usuarioId: string): Promise<AxiosResponse> => {
    return api.get(`/api/users/${usuarioId}`);
};

const getMyProfile = (): Promise<AxiosResponse> => {
    return api.get('/api/users/me');
};

const updateProfile = (userId: string, data: Record<string, any>): Promise<AxiosResponse> => {
    return api.put(`/api/users/${userId}`, data);
};

const savePushToken = (userId: string, pushToken: string): Promise<AxiosResponse> => {
=======
import api from ".";
import type { AxiosResponse } from 'axios';
import type { IUser } from '../types';

const getUserService = (usuarioId: string): Promise<AxiosResponse<IUser>> => {
    return api.get(`/api/users/${usuarioId}`);
};

const getMyProfile = (): Promise<AxiosResponse<IUser>> => {
    return api.get('/api/users/me');
};

const updateProfile = (userId: string, data: Partial<IUser>) => {
    return api.put(`/api/users/${userId}`, data);
};

const savePushToken = (userId: string, pushToken: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
    return api.post('/api/users/push-token', {
        userId,
        pushToken
    });
};

export {
    getUserService,
    getMyProfile,
    updateProfile,
    savePushToken
};
