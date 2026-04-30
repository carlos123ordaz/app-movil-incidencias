// ─── User ───────────────────────────────────────────────────────────────────
export interface UserArea {
  name: string;
  [key: string]: any;
}

export interface Sede {
  _id: string;
  nombre: string;
  latitude: number;
  longitude: number;
  radio: number;
}

export interface User {
  _id: string;
  name: string;
  lname: string;
  email: string;
  photo?: string;
  position?: string;
  phone?: string;
  dni?: string;
  areas?: Array<UserArea | string>;
  sede?: Sede | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────
export interface MainContextType {
  userData: User | null;
  taskId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setTaskId: (id: string | null) => void;
  refreshUserData: () => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithMicrosoft: () => Promise<LoginResult>;
  logout: () => Promise<void>;
  giraActual?: any;
}

// ─── Incidencia ───────────────────────────────────────────────────────────────
export interface HistorialEstado {
  estado: string;
  fecha: string;
  usuario?: {
    nombre: string;
    apellido: string;
  };
  notas?: string;
}

export interface Incidencia {
  _id: string;
  tipoIncidente: string;
  ubicacion: string;
  areaAfectada: string;
  gradoSeveridad: string;
  estado: string;
  descripcion: string;
  recomendacion?: string;
  fecha: string;
  imagenes?: string[];
  imagenesResolucion?: string[];
  user?: {
    _id: string;
    name: string;
    lname: string;
  };
  asigned?: {
    _id: string;
    name: string;
    lname: string;
  };
  deadline?: string;
  historialEstados?: HistorialEstado[];
  historialDeadline?: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface IncidenciaReporte {
  fecha: Date;
  ubicacion: string;
  areaAfectada: string;
  tipoIncidente: string;
  gradoSeveridad: string;
  descripcion: string;
  recomendacion?: string;
  imagenes: string[];
}

// ─── Gasto ────────────────────────────────────────────────────────────────────
export interface GastoData {
  ruc: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  total: number;
  igv: number;
  descuento: number;
  detraccion: number;
  moneda?: string;
  con_sustento: boolean;
  detalle_sustento?: string;
  fecha_emision: string;
  categoria: string;
  tipo: string;
  descripcion: string;
  gira_id: number;
}

export interface GastoDetalle {
  id?: number;
  descripcion: string;
  precio_unitario: number;
  subtotal: number;
  cantidad: number;
  Gasto_id?: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  HomeTabs: { screen?: string } | undefined;
  login: undefined;
  registro: undefined;
  'agregar-incidence': undefined;
  'capture-incidence': undefined;
  DetalleIncidencia: { id: string };
  'editar-incidencia': { id: string };
  ChangePassword: undefined;
  CostCenterDetail: undefined;
  'cost-center-allocation': undefined;
  IncidenciasAsignadas: undefined;
  ResolutionPhotos: { incidencia: Incidencia };
  'voice-expense': undefined;
  ImageAnnotation: { imageUri: string; returnScreen: string };
  DetalleIncidenciaAsignada: { id: string };
  RegisterSede: undefined;
};
