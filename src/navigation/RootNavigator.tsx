import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export default function RootNavigator() {
    return (
        <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="registro" component={RegistroScreen} />
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
            <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{
                    headerShown: true,
                    title: 'Cambiar Contraseña',
                    headerBackTitle: 'Atrás',
                }}
            />
            <Stack.Screen
                name="CostCenterDetail"
                component={CostCenterDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
    {/* ─── NUEVA PANTALLA ─── */ }
            <Stack.Screen
                name="cost-center-allocation"
                component={CostCenterAllocationScreen}
                options={{
                    headerShown: true,
                    title: 'Centros de Costo',
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
        </Stack.Navigator >
    );
}
