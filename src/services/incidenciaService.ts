import api from ".";
<<<<<<< HEAD
import { Incidencia, IncidenciaReporte } from "../types";

export const incidenciaService = {
    registrarIncidencia: async (reporte: IncidenciaReporte, userId: string): Promise<any> => {
=======
import type { IIncidentReport } from '../types';

interface IncidentUpdateData {
    images?: string[];
    replaceImages?: boolean;
    date?: Date;
    [key: string]: unknown;
}

export const incidentService = {
    createIncident: async (report: IIncidentReport, userId: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const formData = new FormData();
            formData.append('fecha', report.date.toISOString());
            formData.append('ubicacion', report.location);
            formData.append('areaAfectada', report.affectedArea);
            formData.append('tipoIncidente', report.incidentType);
            formData.append('gradoSeveridad', report.severityLevel);
            formData.append('descripcion', report.description);
            formData.append('recomendacion', report.recommendation || '');
            formData.append('user', userId);

<<<<<<< HEAD
            if (reporte.imagenes && reporte.imagenes.length > 0) {
                for (let i = 0; i < reporte.imagenes.length; i++) {
                    const imageUri = reporte.imagenes[i];
                    const fileName = imageUri.split('/').pop() ?? 'image.jpg';
=======
            if (report.images && report.images.length > 0) {
                for (let i = 0; i < report.images.length; i++) {
                    const imageUri = report.images[i];
                    const fileName = imageUri.split('/').pop() || `image_${i}.jpg`;
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                    const match = /\.(\w+)$/.exec(fileName);
                    const type = match ? `image/${match[1]}` : 'image/jpeg';

                    formData.append('imagenes', {
                        uri: imageUri,
                        name: fileName,
                        type: type,
<<<<<<< HEAD
                    } as any);
=======
                    } as unknown as Blob);
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                }
            }

            const response = await api.post('/api/incidencias', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error al registrar incidencia:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    getIncidenciasByUser: async (userId: string): Promise<Incidencia[]> => {
=======
    getIncidentsByUser: async (userId: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.get(`/api/incidencias/user/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener incidencias:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    getAllIncidencias: async (page = 1, limit = 20, filters: Record<string, any> = {}): Promise<any> => {
=======
    getAllIncidents: async (page = 1, limit = 20, filters: Record<string, unknown> = {}) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const params = { page, limit, ...filters };
            const response = await api.get('/api/incidencias', { params });
            return response.data;
        } catch (error) {
            console.error('Error al obtener incidencias:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    getIncidenciaById: async (id: string): Promise<Incidencia> => {
=======
    getIncidentById: async (id: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.get(`/api/incidencias/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener incidencia:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    updateIncidencia: async (id: string, updateData: Record<string, any>): Promise<any> => {
=======
    updateIncident: async (id: string, updateData: IncidentUpdateData) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const formData = new FormData();
            const { images, replaceImages, ...restData } = updateData;

            Object.keys(restData).forEach(key => {
                const value = restData[key];
                if (value !== null && value !== undefined) {
                    if (key === 'date' && value instanceof Date) {
                        formData.append(key, value.toISOString());
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

<<<<<<< HEAD
            if (imagenes && imagenes.length > 0) {
                const localImages: string[] = imagenes.filter((uri: string) => uri.startsWith('file://'));
                const existingImages: string[] = imagenes.filter((uri: string) => uri.startsWith('http'));

                if (localImages.length > 0) {
                    for (const imageUri of localImages) {
                        const fileName = imageUri.split('/').pop() ?? 'image.jpg';
=======
            if (images && images.length > 0) {
                const localImages = images.filter(uri => uri.startsWith('file://'));
                const existingImages = images.filter(uri => uri.startsWith('http'));

                if (localImages.length > 0) {
                    for (const imageUri of localImages) {
                        const fileName = imageUri.split('/').pop() || 'image.jpg';
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                        const match = /\.(\w+)$/.exec(fileName);
                        const type = match ? `image/${match[1]}` : 'image/jpeg';

                        formData.append('imagenes', {
                            uri: imageUri,
                            name: fileName,
                            type: type,
<<<<<<< HEAD
                        } as any);
=======
                        } as unknown as Blob);
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                    }
                    formData.append('replaceImages', replaceImages ? 'true' : 'false');
                    if (!replaceImages && existingImages.length > 0) {
                        formData.append('existingImages', JSON.stringify(existingImages));
                    }
                } else if (existingImages.length > 0) {
                    formData.append('existingImages', JSON.stringify(existingImages));
                }
            }

            const response = await api.put(`/api/incidencias/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error al actualizar incidencia:', JSON.stringify(error));
            throw error;
        }
    },

<<<<<<< HEAD
    deleteIncidencia: async (id: string): Promise<any> => {
=======
    deleteIncident: async (id: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.delete(`/api/incidencias/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar incidencia:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    deleteImageFromIncidencia: async (id: string, imageUrl: string): Promise<any> => {
=======
    deleteIncidentImage: async (id: string, imageUrl: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.delete(`/api/incidencias/${id}/image`, {
                data: { imageUrl }
            });
            return response.data;
        } catch (error) {
            console.error('Error al eliminar imagen:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    getStats: async (userId: string | null = null): Promise<any> => {
=======
    getStats: async (userId: string | null = null) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const url = userId
                ? `/api/incidencias/stats/${userId}`
                : '/api/incidencias/stats';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadisticas:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    getIncidenciasAsignadas: async (userId: string): Promise<Incidencia[]> => {
=======
    getAssignedIncidents: async (userId: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.get(`/api/incidencias/asignadas/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener incidencias asignadas:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    getIncidenciasAsignadasStats: async (userId: string): Promise<any> => {
=======
    getAssignedIncidentsStats: async (userId: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.get(`/api/incidencias/asignadas/${userId}/stats`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadisticas de asignadas:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    cambiarEstado: async (id: string, data: Record<string, any>): Promise<any> => {
=======
    changeStatus: async (id: string, data: Record<string, unknown>) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.put(`/api/incidencias/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    addResolutionImages: async (incidenciaId: string, imageUris: string[]): Promise<any> => {
=======
    addResolutionImages: async (incidentId: string, imageUris: string[]) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const formData = new FormData();

            for (let i = 0; i < imageUris.length; i++) {
                const imageUri = imageUris[i];
<<<<<<< HEAD
                const fileName = imageUri.split('/').pop() ?? 'image.jpg';
=======
                const fileName = imageUri.split('/').pop() || `image_${i}.jpg`;
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                const match = /\.(\w+)$/.exec(fileName);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('files', {
                    uri: imageUri,
                    name: fileName,
                    type: type,
<<<<<<< HEAD
                } as any);
=======
                } as unknown as Blob);
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            }

            const response = await api.post(
                `/api/incidencias/${incidentId}/resolution-images`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error al agregar fotos de resolucion:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    updateDeadline: async (incidenciaId: string, newDeadline: Date | string, notas: string, userId: string): Promise<any> => {
=======
    updateDeadline: async (incidentId: string, newDeadline: Date | string, notes: string, userId: string) => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.put(`/api/incidencias/${incidentId}`, {
                newDeadline: newDeadline instanceof Date ? newDeadline.toISOString() : newDeadline,
                notasDeadline: notes || '',
                user: userId,
            });

            return response.data;
        } catch (error) {
            console.error('Error al actualizar deadline:', error);
            throw error;
        }
    },

<<<<<<< HEAD
    marcarComoResuelta: async (incidenciaId: string, userId: string, notas = ''): Promise<any> => {
=======
    markAsResolved: async (incidentId: string, userId: string, notes = '') => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        try {
            const response = await api.put(`/api/incidencias/${incidentId}`, {
                estado: 'Resuelto',
                user: userId,
                notasEstado: notes,
            });

            return response.data;
        } catch (error) {
            console.error('Error al marcar como resuelta:', error);
            throw error;
        }
    },
};
