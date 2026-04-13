// services/BitrixTasks.ts
import axios from 'axios';
import { CONFIG } from '../../config';

export const getLastTasksByEmail = async (email: string): Promise<any> => {
    const response = await axios.get(`${CONFIG.api_url}/api/bitrix/tasks/by-email`, {
        params: { email },
    });
    return response.data;
};
