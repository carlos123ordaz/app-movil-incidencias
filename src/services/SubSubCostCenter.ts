import api from ".";
import type { ISubSubCostCenter } from '../types';

const getSubSubCostCenters = (subCostCenterId?: number) =>
    api.get<ISubSubCostCenter[]>('/api/sub-sub-cost-centers', {
        params: subCostCenterId !== undefined ? { scc: subCostCenterId } : undefined,
    });

const getSubSubCostCenterById = (id: number) => api.get<ISubSubCostCenter>(`/api/sub-sub-cost-centers/${id}`);

const createSubSubCostCenter = (subSubCostCenter: ISubSubCostCenter) =>
    api.post<number>('/api/sub-sub-cost-centers', subSubCostCenter);

const updateSubSubCostCenter = (id: number, subSubCostCenter: ISubSubCostCenter) =>
    api.put(`/api/sub-sub-cost-centers/${id}`, subSubCostCenter);

const deleteSubSubCostCenter = (id: number) => api.delete(`/api/sub-sub-cost-centers/${id}`);

export {
    getSubSubCostCenters,
    getSubSubCostCenterById,
    createSubSubCostCenter,
    updateSubSubCostCenter,
    deleteSubSubCostCenter,
};
