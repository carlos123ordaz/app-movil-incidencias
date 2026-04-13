import { createNativeStackNavigator } from '@react-navigation/native-stack';
<<<<<<< HEAD
import LoginScreen from '../screens/auth/LoginScreen';
import RegistroScreen from '../screens/auth/RegistroScreen';
import HomeTabs from './HomeTabs';
import CameraIncidence from '../screens/incidences/CameraIncidence';
import FormIncidence from '../screens/incidences/FormIncidence';
import DetailsIncidence from '../screens/incidences/DetailsIncidence';
import EditIncidencia from '../screens/incidences/EditIncidencia';
import AsignedIncidence from '../screens/incidences/AsignedIncidence';
import AsignedIncidenceDetail from '../screens/incidences/AsignedIncidenceDetail';
import ResolutionPhotosScreen from '../screens/incidences/ResolutionPhotosScreen';
import ImageAnnotationScreen from '../screens/incidences/ImageAnnotationScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import { RootStackParamList } from '../types';

// ─── NUEVO ───
// Nota: estas pantallas están marcadas como eliminadas en git.
// Mantener los imports hasta que sean reemplazados.
// @ts-ignore
import CostCenterDetailScreen from '../screens/expenses/CostCenterDetailScreen';
// @ts-ignore
import CostCenterAllocationScreen from '../screens/expenses/CostCenterAllocationScreen';
// @ts-ignore
import VoiceExpenseScreen from '../screens/expenses/VoiceExpenseScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
=======
import type { RootStackParamList } from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import RegistroScreen from '../screens/auth/RegistroScreen';
import HomeTabs from './HomeTabs';
import RevisarGastoScreen from '../screens/expenses/RevisarGastoScreen';
import DetalleGastoScreen from '../screens/expenses/DetalleGastoScreen';
import EditarGastoScreen from '../screens/expenses/EditarGastoScreen';
import AgregarGastoScreen from '../screens/expenses/AgregarGastoScreen';
import CapturaScreen from '../screens/expenses/CapturaScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import CostCenterDetailScreen from '../screens/expenses/CostCenterDetailScreen';
import CostCenterAllocationScreen from '../screens/expenses/CostCenterAllocationScreen';
import VoiceExpenseScreen from '../screens/expenses/VoiceExpenseScreen';

const Stack = createNativeStackNavigator();
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9

export default function RootNavigator() {
    return (
        <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="registro" component={RegistroScreen} />
<<<<<<< HEAD
            <Stack.Screen name="agregar-incidence" component={FormIncidence}
                options={{ headerShown: true, title: 'Agregar Incidencia', headerBackTitle: 'Atrás' }} />
            <Stack.Screen name="capture-incidence" component={CameraIncidence}
                options={{ headerShown: false }} />
            <Stack.Screen name="DetalleIncidencia" component={DetailsIncidence}
                options={{ headerShown: true, headerBackTitle: 'Atrás', title: 'Detalle' }} />
            <Stack.Screen
                name="editar-incidencia"
                component={EditIncidencia}
                options={{
                    headerShown: true,
                    title: 'Editar Incidencia',
                    headerBackTitle: 'Atrás'
                }}
            />
=======
            <Stack.Screen name="revisar" component={RevisarGastoScreen}
                options={{ headerShown: true, title: 'Agregar gasto', headerBackButtonDisplayMode: 'default' }} />
            <Stack.Screen name="detalle" component={DetalleGastoScreen}
                options={{ headerShown: false, title: 'Detalle de Gasto', headerBackTitle: 'Atras', headerBackButtonDisplayMode: 'minimal', }} />
            <Stack.Screen name="editar" component={EditarGastoScreen}
                options={{ headerShown: true, title: 'Editar Gasto', headerBackTitle: 'Atras', headerBackButtonDisplayMode: 'minimal', }} />
            <Stack.Screen name="agregar-gasto" component={AgregarGastoScreen}
                options={{ headerShown: true, title: 'Agregar Gasto', headerBackTitle: 'Atras', headerBackButtonDisplayMode: 'minimal', }} />
            <Stack.Screen name="capture-voucher" component={CapturaScreen}
                options={{ headerShown: false }} />

>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{
                    headerShown: true,
<<<<<<< HEAD
                    title: 'Cambiar Contraseña',
                    headerBackTitle: 'Atrás',
=======
                    title: 'Cambiar Contrasena',
                    headerBackTitle: 'Atras',
                    headerBackButtonDisplayMode: 'minimal',
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                }}
            />
            <Stack.Screen
                name="CostCenterDetail"
                component={CostCenterDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
<<<<<<< HEAD
            {/* ─── NUEVA PANTALLA ─── */}
=======
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            <Stack.Screen
                name="cost-center-allocation"
                component={CostCenterAllocationScreen}
                options={{
                    headerShown: true,
                    title: 'Centros de Costo',
<<<<<<< HEAD
                    headerBackTitle: 'Atrás',
                }}
            />
            <Stack.Screen
                name="IncidenciasAsignadas"
                component={AsignedIncidence}
                options={{
                    headerShown: true,
                    title: 'Asignadas',
                    headerBackTitle: 'Atrás'
                }}
            />
            <Stack.Screen
                name="ResolutionPhotos"
                component={ResolutionPhotosScreen}
                options={{
                    headerShown: true,
                    title: 'Fotos de Resolución',
=======
                    headerBackTitle: 'Atras',
                    headerBackButtonDisplayMode: 'minimal',
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                }}
            />
            <Stack.Screen
                name="voice-expense"
                component={VoiceExpenseScreen}
                options={{
                    headerShown: false,
                    presentation: 'modal',
                }}
            />
<<<<<<< HEAD
            <Stack.Screen
                name="ImageAnnotation"
                component={ImageAnnotationScreen}
                options={{
                    title: 'Anotar Imagen',
                    headerStyle: {
                        backgroundColor: '#10B981',
                    },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="DetalleIncidenciaAsignada"
                component={AsignedIncidenceDetail}
                options={{
                    headerShown: true,
                    title: 'Detalle de Incidencia',
                    headerBackTitle: 'Atrás'
                }}
            />
=======
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        </Stack.Navigator>
    );
}
