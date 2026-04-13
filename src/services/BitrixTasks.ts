<<<<<<< HEAD
// services/BitrixTasks.ts
import axios from 'axios';
import { CONFIG } from '../../config';

export const getLastTasksByEmail = async (email: string): Promise<any> => {
    const response = await axios.get(`${CONFIG.api_url}/api/bitrix/tasks/by-email`, {
        params: { email },
    });
=======
import type { IBitrixTask } from '../types';
import api from '.';

export const getLastTasks = async (): Promise<IBitrixTask[]> => {
    const response = await api.get('/api/bitrix/tasks?onlyMine=true');
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
    return response.data;
};
