import api from ".";
<<<<<<< HEAD
import { AxiosResponse } from "axios";

const captureVoucher = (formData: FormData): Promise<AxiosResponse> => {
=======
import type { AxiosResponse } from 'axios';
import type { IExpense } from '../types';

const captureVoucher = (formData: FormData) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
    return api.post('/api/expenses/capture', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

<<<<<<< HEAD
const registrarGasto = (gasto: any): Promise<AxiosResponse> => api.post(`/api/expenses`, gasto);
const actualizarGasto = (gasto: any): Promise<AxiosResponse> => api.put(`/api/expenses`, gasto);
const listExpensesByTask = (taskId: string): Promise<AxiosResponse> => api.get(`/api/expenses/task/${taskId}`);
const voiceToExpense = (transcription: string): Promise<AxiosResponse> => api.post('/api/expenses/voice-to-expense', { transcription });
const eliminarGasto = (id: string): Promise<AxiosResponse> => api.delete(`/api/expenses/${id}`);

export {
    captureVoucher,
    registrarGasto,
    actualizarGasto,
    listExpensesByTask,
    voiceToExpense,
    eliminarGasto
=======
const createExpense = (expense: Partial<IExpense>) => api.post('/api/expenses', expense);

const updateExpense = (expense: Partial<IExpense>) => api.put(`/api/expenses/${expense.expenseId}`, expense);

const listExpensesByTask = async (taskId: string): Promise<AxiosResponse<IExpense[]>> => {
    const response = await api.get(`/api/expenses/task/${taskId}`);
    return {
        ...response,
        data: Array.isArray(response.data) ? response.data : [],
    };
};

const getExpenseById = async (id: string): Promise<AxiosResponse<IExpense>> => {
    const response = await api.get(`/api/expenses/${id}`);
    return {
        ...response,
        data: response.data || {},
    };
};

const voiceToExpense = (transcription: string) => api.post('/api/expenses/voice-to-expense', { transcription });

const deleteExpense = (id: number) => api.delete(`/api/expenses/${id}`);

export {
    captureVoucher,
    createExpense,
    updateExpense,
    listExpensesByTask,
    getExpenseById,
    voiceToExpense,
    deleteExpense
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
};
