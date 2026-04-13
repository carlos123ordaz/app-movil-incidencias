import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext } from 'react';
import { MainContext } from '../contexts/MainContextApp';
import { ActivityIndicator, View } from 'react-native';
import { Image } from 'expo-image';
<<<<<<< HEAD
import HistoryIncidence from '../screens/incidences/HistoryIncidence';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AsistenciaScreen from '../screens/attendance/AsistenciaScreen';
=======
import ProfileScreen from '../screens/profile/ProfileScreen';
import HistorialScreen from '../screens/expenses/HistorialScreen';
import type { IMainContext } from '../types';
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
    const { isLoading } = useContext(MainContext) as IMainContext;
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#B1C5FF' }}>
                <ActivityIndicator animating={true} size="large" color="#0000ff" />
                <Image source={{ uri: 'https://play-lh.googleusercontent.com/AAtFmFcj05HIcGAe-lt6pSV5KtPjxIi4rhwZ6fqc7vz7s23KuO1wHMPJZMRdIXNZJ3A' }} style={{ width: 100, height: 100, marginTop: 16 }} />
            </View>
        );
    }
    return (
        <Tab.Navigator
            id={undefined}
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }: { color: string; size: number }) => {
<<<<<<< HEAD
                    let iconName: string = 'home';
                    if (route.name === 'Asistencia') iconName = 'calendar-check';
                    else if (route.name === 'Incidencias') iconName = 'alert-circle';
                    else if (route.name === 'Gastos') iconName = 'cash-multiple';
=======
                    let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'cash-multiple';
                    if (route.name === 'Viaticos') iconName = 'cash-multiple';
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                    else if (route.name === 'Perfil') iconName = 'account';
                    return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
                },
            })}
        >
<<<<<<< HEAD
            <Tab.Screen name="Asistencia" component={AsistenciaScreen} options={{ headerShown: true }} />
            <Tab.Screen name="Incidencias" component={HistoryIncidence} options={{ headerShown: true }} />
=======
            <Tab.Screen name="Rendiciones" component={HistorialScreen} />
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            <Tab.Screen name="Perfil" component={ProfileScreen} options={{ headerShown: true }} />
        </Tab.Navigator>
    );
}
