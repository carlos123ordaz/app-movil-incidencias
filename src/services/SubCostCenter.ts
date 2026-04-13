import api from ".";
import type { ISubCostCenter } from '../types';

const getSubCostCenters = (costCenterId?: number) =>
    api.get<ISubCostCenter[]>('/api/sub-cost-centers', {
        params: costCenterId !== undefined ? { cc: costCenterId } : undefined,
    });

const getSubCostCenterById = (id: number) => api.get<ISubCostCenter>(`/api/sub-cost-centers/${id}`);

const createSubCostCenter = (subCostCenter: ISubCostCenter) =>
    api.post<number>('/api/sub-cost-centers', subCostCenter);

const updateSubCostCenter = (id: number, subCostCenter: ISubCostCenter) =>
    api.put(`/api/sub-cost-centers/${id}`, subCostCenter);

const deleteSubCostCenter = (id: number) => api.delete(`/api/sub-cost-centers/${id}`);

export {
    getSubCostCenters,
    getSubCostCenterById,
    createSubCostCenter,
    updateSubCostCenter,
    deleteSubCostCenter,
};
