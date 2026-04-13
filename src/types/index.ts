<<<<<<< HEAD
// ─── User ───────────────────────────────────────────────────────────────────
export interface UserArea {
  name: string;
  [key: string]: any;
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
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginResult {
=======
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface IExpenseItem {
  descrip?: string;
  unitOfMeasure?: string;
  unitPrice?: number;
  quantity?: number;
  subtotal: number;
}

export interface ICostCenter {
  costCenterId?: number;
  shortName: string;
  descrip: string;
}

export interface ISubCostCenter {
  subCostCenterId?: number;
  costCenterId: number;
  shortName: string;
  descrip: string;
}

export interface ISubSubCostCenter {
  subSubCostCenterId?: number;
  subCostCenterId: number;
  costCenterId: number;
  shortName: string;
  descrip: string;
  comment?: string;
}

export interface ICostCenterAllocation {
  costCenterId: number | null;
  costCenterName?: string;
  subCostCenterId: number | null;
  subCostCenterName?: string;
  subSubCostCenterId: number | null;
  subSubCostCenterName?: string;
  percentage: number;
  _cc1Label?: string;
}

export interface IExpense {
  expenseId?: number;
  type?: string;
  category?: string;
  businessName?: string;
  address?: string;
  expenseDate?: string | Date;
  currencyCode?: string;
  discount?: number;
  detraction?: number;
  imageUrl?: string;
  hasReceipt?: boolean;
  receiptDetail?: string;
  descrip?: string;
  modified?: boolean;
  ruc?: string;
  total: number;
  igv: number;
  taskId?: string | null;
  costCenterId?: string | null;
  subCostCenterId?: string | null;
  subSubCostCenterId?: string | null;
  items?: IExpenseItem[];
  allocations?: ICostCenterAllocation[];
  // Campos extra que devuelve la API (nombres distintos al modelo interno)
  costCenterAllocations?: ICostCenterAllocation[];
  edited?: boolean;
  modifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IArea {
  name: string;
}

export interface IUser {
  userId: string;
  name?: string;
  lastName?: string;
  dni?: string;
  email: string;
  initials?: string;
  createdAt?: string;
  modifiedAt?: string;
  bitrixId: string;
  photoUrl?: string;
  jobTitle?: string;
  phone?: string;
  ibActive?: boolean;
  areas?: IArea[];
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface ILoginResult {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
  success: boolean;
  error?: string;
}

<<<<<<< HEAD
// ─── Context ─────────────────────────────────────────────────────────────────
export interface MainContextType {
  userData: User | null;
=======
export interface IConfig {
  api_url: string;
  fastapi_url: string;
}

export interface IBitrixTask {
  id: string;
  title: string;
  tasks?: IBitrixTask[];
}

export type RootStackParamList = {
  login: undefined;
  registro: undefined;
  HomeTabs: undefined;
  Configuracion: undefined;
  'agregar-gasto': { prefillData?: Partial<IExpense>; taskId?: string } | undefined;
  editar: { expense: IExpense };
  revisar: { capturedData?: unknown; imageUri?: string; taskId?: string; photo?: unknown; source?: string };
  detalle: { id: string };
  'capture-voucher': { taskId?: string } | undefined;
  'voice-expense': { taskId?: string } | undefined;
  'cost-center-allocation': {
    allocations: ICostCenterAllocation[];
    onSave: (allocations: ICostCenterAllocation[]) => void;
  };
  CostCenterDetail: { costCenterId?: number; subCostCenterId?: number };
  ChangePassword: undefined;
  IncidenciasAsignadas: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;


export interface IExpenseFormData {
  type: string;
  businessName: string;
  ruc: string;
  address: string;
  expenseDate: Date | string;
  items: IExpenseItem[];
  total: number;
  igv: number;
  discount: number;
  detraction: number;
  currencyCode: string;
  category: string;
  descrip: string;
  hasReceipt: boolean;
  receiptDetail: string;
  imageUrl?: string;
  allocations?: ICostCenterAllocation[];
}

export interface IIncidentReport {
  date: Date;
  location: string;
  affectedArea: string;
  incidentType: string;
  severityLevel: string;
  description: string;
  recommendation?: string;
  images?: string[];
}

export interface IMainContext {
  userData: IUser | null;
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
  taskId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
<<<<<<< HEAD
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
};
=======
  setTaskId: (taskId: string | null) => void;
  refreshUserData: () => Promise<void>;
  login: (email: string, password: string) => Promise<ILoginResult>;
  loginWithMicrosoft: () => Promise<ILoginResult>;
  logout: () => Promise<void>;
}
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
