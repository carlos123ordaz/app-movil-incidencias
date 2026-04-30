import { useContext, useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
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
    const [modalVisible, setModalVisible] = useState(false);
    const [sedeName, setSedeName] = useState('');
    const inputRef = useRef<TextInput>(null);

    const alreadyHasSede = !!userData?.sede;
    const existingName = typeof userData?.sede === 'object' ? userData.sede?.nombre ?? '' : '';

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

    const openModal = () => {
        setSedeName(existingName);
        setModalVisible(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleConfirm = async () => {
        const nombre = sedeName.trim();
        if (!nombre) return;
        if (!coords || !userData?._id) return;

        setModalVisible(false);
        setStep('registering');
        try {
            await registerSedeFromDevice(userData._id, coords.latitude, coords.longitude, nombre);
            await refreshUserData?.();
            toastSuccess('Sede registrada correctamente');
            navigation.goBack();
        } catch {
            toastError('Error al registrar la sede. Intenta de nuevo.');
            setStep('confirm');
        }
    };

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
                        <TouchableOpacity style={styles.primaryButton} onPress={openModal}>
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

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.overlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalCard}>
                                    <Text style={styles.modalTitle}>Nombre de la sede</Text>
                                    <Text style={styles.modalSubtitle}>
                                        Ingresa un nombre para identificar esta sede.
                                    </Text>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.input}
                                        value={sedeName}
                                        onChangeText={setSedeName}
                                        placeholder="Ej: Sede Principal"
                                        placeholderTextColor="#9CA3AF"
                                        maxLength={60}
                                        returnKeyType="done"
                                        onSubmitEditing={handleConfirm}
                                    />
                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.modalCancelButton}
                                            onPress={() => setModalVisible(false)}
                                        >
                                            <Text style={styles.modalCancelText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.modalConfirmButton,
                                                !sedeName.trim() && styles.modalConfirmDisabled,
                                            ]}
                                            onPress={handleConfirm}
                                            disabled={!sedeName.trim()}
                                        >
                                            <Text style={styles.modalConfirmText}>Confirmar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
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
    // Modal
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    modalCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
        marginBottom: 20,
        backgroundColor: '#F9FAFB',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#6B7280',
    },
    modalConfirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
    },
    modalConfirmDisabled: {
        backgroundColor: '#BFDBFE',
    },
    modalConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
});
