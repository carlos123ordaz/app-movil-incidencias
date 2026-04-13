import api from ".";
import { AxiosResponse } from "axios";

const captureVoucher = (formData: FormData): Promise<AxiosResponse> => {
    return api.post('/api/expenses/capture', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

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
};
