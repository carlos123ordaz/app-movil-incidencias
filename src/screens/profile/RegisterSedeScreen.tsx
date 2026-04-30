import { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { MainContext } from '../../contexts/MainContextApp';
import { registerSedeFromDevice } from '../../services/Sede';
import { useToast } from '../../contexts/ToastContext';

type Step = 'locating' | 'confirm' | 'registering' | 'error';

export default function RegisterSedeScreen() {
    const { userData, refreshUserData } = useContext(MainContext);
    const navigation = useNavigation<any>();
    const { toastSuccess, toastError } = useToast();

    const [step, setStep] = useState<Step>('locating');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        requestLocation();
    }, []);

    const requestLocation = async () => {
        setStep('locating');
        setLocationError(null);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Se necesita permiso de ubicación para registrar la sede.');
                setStep('error');
                return;
            }
            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
            setStep('confirm');
        } catch {
            setLocationError('No se pudo obtener la ubicación. Verifica que el GPS esté activado.');
            setStep('error');
        }
    };

    const handleConfirm = async () => {
        if (!coords || !userData?._id) return;
        setStep('registering');
        try {
            await registerSedeFromDevice(userData._id, coords.latitude, coords.longitude);
            await refreshUserData?.();
            toastSuccess('Sede registrada correctamente');
            navigation.goBack();
        } catch {
            toastError('Error al registrar la sede. Intenta de nuevo.');
            setStep('confirm');
        }
    };

    const alreadyHasSede = !!userData?.sede;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconWrapper}>
                    <Ionicons name="location" size={48} color="#3B82F6" />
                </View>

                <Text style={styles.title}>
                    {alreadyHasSede ? 'Actualizar Sede' : 'Registrar Sede'}
                </Text>

                {step === 'locating' && (
                    <>
                        <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
                        <Text style={styles.description}>Detectando tu ubicación actual...</Text>
                    </>
                )}

                {step === 'confirm' && (
                    <>
                        <Text style={styles.description}>
                            {alreadyHasSede
                                ? 'Se actualizará la sede usando tu ubicación actual.'
                                : 'Se registrará una nueva sede usando tu ubicación actual.'}
                        </Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleConfirm}>
                            <Text style={styles.primaryButtonText}>
                                {alreadyHasSede ? 'Actualizar sede' : 'Registrar sede'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.secondaryButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </>
                )}

                {step === 'registering' && (
                    <>
                        <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
                        <Text style={styles.description}>Registrando sede...</Text>
                    </>
                )}

                {step === 'error' && (
                    <>
                        <View style={styles.errorIconWrapper}>
                            <Ionicons name="warning-outline" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.errorText}>{locationError}</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={requestLocation}>
                            <Text style={styles.primaryButtonText}>Reintentar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.secondaryButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    spinner: {
        marginVertical: 20,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '500',
    },
    errorIconWrapper: {
        marginBottom: 12,
    },
    errorText: {
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
});
