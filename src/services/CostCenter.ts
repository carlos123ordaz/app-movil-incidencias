import api from ".";
import type { ICostCenter } from '../types';

const getAllCostCenters = () => api.get<ICostCenter[]>('/api/cost-centers');

const getCostCenterById = (id: number) => api.get<ICostCenter>(`/api/cost-centers/${id}`);

const createCostCenter = (costCenter: ICostCenter) => api.post<number>('/api/cost-centers', costCenter);

const updateCostCenter = (id: number, costCenter: ICostCenter) => api.put(`/api/cost-centers/${id}`, costCenter);

const deleteCostCenter = (id: number) => api.delete(`/api/cost-centers/${id}`);

export {
    getAllCostCenters,
    getCostCenterById,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
};
