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
