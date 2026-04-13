import { useContext, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';
import axios from 'axios';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MainContext } from '../../contexts/MainContextApp';
import { CONFIG } from '../../../config';
import api from '../../services';

moment.locale('es');

interface AsistenciaData {
    entrada?: string | null;
    salida?: string | null;
    horas_trabajadas?: number | null;
    valido_entrada?: boolean | null;
    valido_salida?: boolean | null;
}

interface MarcacionItem {
    key: 'entrada' | 'salida';
    tipo: 'entrada' | 'salida';
    hora: string;
    valida?: boolean | null;
}

interface LocationCoords {
    latitude: number;
    longitude: number;
}

interface CapturedPhoto {
    uri: string;
    [key: string]: any;
}

export default function AsistenciaScreen() {
    const { userData, giraActual } = useContext(MainContext);
    const [currentTime, setCurrentTime] = useState(moment());
    const [asistencia, setAsistencia] = useState<AsistenciaData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [marcando, setMarcando] = useState<boolean>(false);
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<any>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
    const [verificando, setVerificando] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(moment());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (userData?._id) {
            getAsistencia();
        }
    }, [userData?._id]);

    const getAsistencia = async (): Promise<void> => {
        if (!userData?._id) {
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/api/attendance/user/${userData._id}`);
            setAsistencia(res.data?.data ?? null);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'No se pudo cargar la asistencia de hoy');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = (): void => {
        setIsRefreshing(true);
        getAsistencia();
    };

    const isWorking = !!asistencia?.entrada && !asistencia?.salida;
    const marcaciones: MarcacionItem[] = [
        asistencia?.entrada
            ? { key: 'entrada', tipo: 'entrada', hora: asistencia.entrada, valida: asistencia.valido_entrada }
            : null,
        asistencia?.salida
            ? { key: 'salida', tipo: 'salida', hora: asistencia.salida, valida: asistencia.valido_salida }
            : null,
    ].filter(Boolean) as MarcacionItem[];

    const workedMinutes = (() => {
        if (!asistencia?.entrada) {
            return 0;
        }

        if (typeof asistencia.horas_trabajadas === 'number' && asistencia.horas_trabajadas > 0) {
            return Math.round(asistencia.horas_trabajadas * 60);
        }

        if (isWorking) {
            return Math.max(0, moment().diff(moment(asistencia.entrada), 'minutes'));
        }

        return 0;
    })();

    const workedLabel = workedMinutes > 0
        ? `${Math.floor(workedMinutes / 60)}h ${workedMinutes % 60}m`
        : '--';

    const registrarMarcacion = async (): Promise<void> => {
        if (marcando) return;

        if (!permission) {
            Alert.alert('Error', 'No se pudo verificar los permisos de la camara');
            return;
        }

        if (!permission.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Permiso denegado', 'Se necesita acceso a la camara para verificar tu identidad');
                return;
            }
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicacion para marcar asistencia');
            return;
        }

        setMarcando(true);
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                maximumAge: 10000,
                timeout: 5000,
            } as any);

            setCurrentLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });
            setShowCamera(true);
        } catch (error) {
            Alert.alert('Error', 'No se pudo obtener tu ubicacion. Intenta de nuevo.');
        } finally {
            setMarcando(false);
        }
    };

    const takePicture = async (): Promise<void> => {
        if (!cameraRef.current) {
            return;
        }

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
                exif: false,
            });
            setCapturedPhoto(photo);
        } catch (error) {
            Alert.alert('Error', 'No se pudo capturar la foto');
            console.error(error);
        }
    };

    const retakePicture = (): void => {
        setCapturedPhoto(null);
    };

    const closeCameraFlow = (): void => {
        setShowCamera(false);
        setCapturedPhoto(null);
        setCurrentLocation(null);
    };

    const verificarYMarcar = async (): Promise<void> => {
        if (!capturedPhoto || !currentLocation || !userData?._id) {
            return;
        }

        setVerificando(true);
        try {
            const formData = new FormData();
            formData.append('userId', userData._id);
            formData.append('tipo', isWorking ? 'salida' : 'entrada');
            formData.append('latitude', currentLocation.latitude.toString());
            formData.append('longitude', currentLocation.longitude.toString());

            const photoUri = capturedPhoto.uri;
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            formData.append('photo', { uri: photoUri, name: filename, type } as any);

            const response = await axios.post(
                `${CONFIG.fastapi_url}/api/attendance/marcar`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (response.data.success && response.data.verified) {
                Alert.alert('Exito', response.data.message, [
                    {
                        text: 'OK',
                        onPress: () => {
                            closeCameraFlow();
                            getAsistencia();
                        },
                    },
                ]);
                return;
            }

            Alert.alert(
                'Verificacion fallida',
                response.data.message || 'No se pudo verificar tu identidad',
                [
                    { text: 'Reintentar', onPress: retakePicture },
                    { text: 'Cancelar', onPress: closeCameraFlow, style: 'cancel' },
                ]
            );
        } catch (error: any) {
            console.error('Error al verificar:', JSON.stringify(error));
            const errorMessage =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Error al verificar la asistencia';

            Alert.alert('Error', errorMessage, [
                { text: 'Reintentar', onPress: retakePicture },
                { text: 'Cancelar', onPress: closeCameraFlow, style: 'cancel' },
            ]);
        } finally {
            setVerificando(false);
        }
    };

    const cancelarMarcacion = (): void => {
        Alert.alert('Cancelar', 'Estas seguro de que deseas cancelar?', [
            { text: 'No', style: 'cancel' },
            { text: 'Si', onPress: closeCameraFlow },
        ]);
    };

    const renderMarcacion = (marcacion: MarcacionItem) => {
        const esEntrada = marcacion.tipo === 'entrada';
        const statusText = marcacion.valida === false ? 'Fuera de rango' : 'Registrado';

        return (
            <View key={marcacion.key} style={styles.marcacionItem}>
                <View style={styles.marcacionLeft}>
                    <View style={[styles.marcacionIcon, { backgroundColor: esEntrada ? '#E7F6EC' : '#FDECEC' }]}>
                        <Ionicons
                            name={esEntrada ? 'log-in-outline' : 'log-out-outline'}
                            size={18}
                            color={esEntrada ? '#0F8A4B' : '#C03D3D'}
                        />
                    </View>
                    <View>
                        <Text style={styles.marcacionTipoText}>{esEntrada ? 'Entrada' : 'Salida'}</Text>
                        <Text style={styles.marcacionHoraText}>{moment(marcacion.hora).format('HH:mm:ss')}</Text>
                    </View>
                </View>
                <Text style={[styles.marcacionStatusText, marcacion.valida === false && styles.marcacionStatusTextError]}>
                    {statusText}
                </Text>
            </View>
        );
    };

    if (loading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#111827" />
                <Text style={styles.loadingText}>Cargando informacion...</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#111827']}
                    />
                }
            >
                <View style={styles.content}>
                    <View style={styles.heroCard}>
                        <Text style={styles.dateText}>{currentTime.format('dddd, D [de] MMMM')}</Text>
                        <Text style={styles.timeText}>{currentTime.format('HH:mm')}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isWorking ? '#0F8A4B' : '#9CA3AF' }]} />
                            <Text style={[styles.statusText, isWorking && styles.statusTextActive]}>
                                {isWorking ? 'En jornada' : 'Sin jornada activa'}
                            </Text>
                        </View>

                        {giraActual && (
                            <View style={styles.giraPill}>
                                <Ionicons name="briefcase-outline" size={14} color="#4B5563" />
                                <Text style={styles.giraText} numberOfLines={1}>{giraActual.motivo}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.markBtn, { backgroundColor: isWorking ? '#C03D3D' : '#0F8A4B' }]}
                            onPress={registrarMarcacion}
                            disabled={loading || marcando}
                            activeOpacity={0.85}
                        >
                            {marcando ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name={isWorking ? 'log-out-outline' : 'log-in-outline'} size={22} color="#FFFFFF" />
                            )}
                            <Text style={styles.markBtnText}>{isWorking ? 'Marcar salida' : 'Marcar entrada'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.summaryCard}>
                        <Text style={styles.sectionTitle}>Hoy</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Entrada</Text>
                                <Text style={styles.statValue}>
                                    {asistencia?.entrada ? moment(asistencia.entrada).format('HH:mm') : '--'}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Salida</Text>
                                <Text style={styles.statValue}>
                                    {asistencia?.salida ? moment(asistencia.salida).format('HH:mm') : '--'}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Tiempo</Text>
                                <Text style={styles.statValue}>{workedLabel}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Historial de hoy</Text>
                            {marcaciones.length > 0 && (
                                <View style={styles.countBadge}>
                                    <Text style={styles.countBadgeText}>{marcaciones.length}</Text>
                                </View>
                            )}
                        </View>

                        {marcaciones.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-clear-outline" size={24} color="#9CA3AF" />
                                <Text style={styles.emptyTitle}>Sin registros hoy</Text>
                            </View>
                        ) : (
                            <View style={styles.marcacionesList}>
                                {marcaciones.map(renderMarcacion)}
                            </View>
                        )}
                    </View>

                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            <Modal visible={showCamera} animationType="slide" onRequestClose={cancelarMarcacion}>
                <View style={styles.cameraContainer}>
                    {!capturedPhoto ? (
                        <>
                            <CameraView style={styles.camera} facing="front" ref={cameraRef}>
                                <View style={styles.cameraOverlay}>
                                    <View style={styles.cameraHeader}>
                                        <TouchableOpacity
                                            style={styles.cameraCloseBtn}
                                            onPress={cancelarMarcacion}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Ionicons name="close" size={26} color="#fff" />
                                        </TouchableOpacity>
                                        <Text style={styles.cameraTitle}>Verificacion facial</Text>
                                        <View style={styles.cameraCloseSpacer} />
                                    </View>
                                    <View style={styles.faceGuide}>
                                        <View style={styles.faceCircle} />
                                    </View>
                                    <View style={styles.cameraInstructions}>
                                        <Text style={styles.instructionText}>Coloca tu rostro dentro del circulo</Text>
                                        <Text style={styles.instructionSubtext}>Asegurate de estar en un lugar bien iluminado</Text>
                                    </View>
                                </View>
                            </CameraView>
                            <View style={styles.captureArea}>
                                <TouchableOpacity style={styles.captureBtn} onPress={takePicture} activeOpacity={0.7}>
                                    <View style={styles.captureBtnInner} />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            <Image source={{ uri: capturedPhoto.uri }} style={styles.preview} />
                            <View style={styles.previewOverlay}>
                                <View style={styles.previewHeader}>
                                    <Text style={styles.previewTitle}>Vista previa</Text>
                                </View>
                                <View style={styles.previewActions}>
                                    <TouchableOpacity
                                        style={styles.retakeBtn}
                                        onPress={retakePicture}
                                        disabled={verificando}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="camera-reverse-outline" size={20} color="#111827" />
                                        <Text style={styles.retakeBtnText}>Repetir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.verifyBtn, verificando && styles.verifyBtnDisabled]}
                                        onPress={verificarYMarcar}
                                        disabled={verificando}
                                        activeOpacity={0.8}
                                    >
                                        {verificando ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                        )}
                                        <Text style={styles.verifyBtnText}>
                                            {verificando ? 'Verificando...' : 'Verificar'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: '#F3F4F6' },
    content: { paddingHorizontal: 16, paddingTop: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    loadingText: { marginTop: 14, fontSize: 15, color: '#6B7280' },
    heroCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, marginBottom: 14 },
    dateText: { fontSize: 14, fontWeight: '500', color: '#6B7280', textTransform: 'capitalize', marginBottom: 8 },
    timeText: { fontSize: 46, fontWeight: '700', color: '#111827', letterSpacing: 1, marginBottom: 14 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    statusTextActive: { color: '#0F8A4B' },
    giraPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        marginBottom: 18,
        alignSelf: 'flex-start',
        maxWidth: '100%',
    },
    giraText: { fontSize: 13, color: '#374151', fontWeight: '500', flexShrink: 1 },
    markBtn: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    markBtnText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
    summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 14 },
    section: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 14 },
    statItem: { flex: 1 },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
    statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
    countBadge: {
        minWidth: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        marginLeft: 'auto',
    },
    countBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
    emptyState: { paddingVertical: 28, alignItems: 'center', gap: 10 },
    emptyTitle: { fontSize: 15, fontWeight: '500', color: '#6B7280' },
    marcacionesList: { gap: 10 },
    marcacionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        padding: 14,
    },
    marcacionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    marcacionIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    marcacionTipoText: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 3 },
    marcacionHoraText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
    marcacionStatusText: { fontSize: 12, fontWeight: '600', color: '#0F8A4B' },
    marcacionStatusTextError: { color: '#C03D3D' },
    bottomSpacer: { height: 24 },
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    cameraOverlay: { flex: 1, backgroundColor: 'transparent' },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 54 : 20,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    cameraCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
    cameraCloseSpacer: { width: 40 },
    faceGuide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 32,
    },
    faceCircle: {
        width: 260,
        height: 260,
        borderRadius: 130,
        borderWidth: 3,
        borderColor: 'rgba(16,185,129,0.7)',
        borderStyle: 'dashed',
    },
    cameraInstructions: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 150,
    },
    instructionText: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 6 },
    instructionSubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 18,
    },
    captureArea: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 44 : 32,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureBtn: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#C03D3D' },
    preview: { flex: 1 },
    previewOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
    previewHeader: {
        paddingTop: Platform.OS === 'ios' ? 54 : 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    previewTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
    previewActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 32 },
    retakeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    retakeBtnText: { fontSize: 15, fontWeight: '600', color: '#111827' },
    verifyBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 14,
        backgroundColor: '#0F8A4B',
    },
    verifyBtnDisabled: { opacity: 0.7 },
    verifyBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
