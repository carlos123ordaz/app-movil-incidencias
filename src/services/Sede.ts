import api from ".";
import { AxiosResponse } from "axios";

const registerSedeFromDevice = (
    userId: string,
    latitude: number,
    longitude: number,
    nombre: string
): Promise<AxiosResponse> => {
    return api.post('/api/locations/from-device', { userId, latitude, longitude, nombre });
};

export { registerSedeFromDevice };
