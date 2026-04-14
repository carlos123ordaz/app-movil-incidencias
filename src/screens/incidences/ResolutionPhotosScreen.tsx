import { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
    FlatList,
    Modal,
    ListRenderItemInfo,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { incidenciaService } from '../../services/incidenciaService';
import CameraIncidence from './CameraIncidence';
import moment from 'moment';
import 'moment/locale/es';
import { EventRegister } from 'react-native-event-listeners';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../../contexts/ToastContext';
import { Incidencia } from '../../types';

moment.locale('es');

interface PrioridadConfig {
    bg: string;
    text: string;
    border: string;
}

interface EstadoConfig {
    text: string;
}

interface SummaryRowProps {
    icon: string;
    label: string;
    value: string;
    valueColor?: string;
}

function SummaryRow({ icon, label, value, valueColor = '#1F2937' }: SummaryRowProps) {
    return (
        <View style={styles.summaryRow}>
            <Ionicons name={icon as any} size={16} color="#9CA3AF" />
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={[styles.summaryValue, { color: valueColor }]}>{value}</Text>
        </View>
    );
}

export default function ResolutionPhotosScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { incidencia } = route.params as { incidencia: Incidencia };
    const [resolutionImages, setResolutionImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const MAX_IMAGES = 5;
    const { toastInfo, toastSuccess, toastError } = useToast();

    useEffect(() => {
        const listener = EventRegister.addEventListener('imageAnnotated', (data: any) => {
            if (data.returnScreen === 'ResolutionPhotos' && data.annotatedUri) {
                handleImageCaptured(data.annotatedUri);
            }
        });
        return () => {
            EventRegister.removeEventListener(listener as string);
        };
    }, []);

    const handleImageCaptured = (imageUri: string): void => {
        if (resolutionImages.length < MAX_IMAGES) {
            setResolutionImages((prev) => [...prev, imageUri]);
            setShowCamera(false);
        } else {
            toastInfo(`Solo puedes agregar hasta ${MAX_IMAGES} imágenes de resolución`);
            setShowCamera(false);
        }
    };

    const handleRemoveImage = (index: number): void => {
        Alert.alert('Eliminar imagen', '¿Estás seguro de eliminar esta imagen?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => { setResolutionImages((prev) => prev.filter((_, i) => i !== index)); },
            },
        ]);
    };

    const handleSubmit = async (): Promise<void> => {
        if (resolutionImages.length === 0) {
            toastInfo('Debes agregar al menos una foto de prueba de resolución');
            return;
        }
        try {
            setUploading(true);
            await incidenciaService.addResolutionImages(incidencia._id, resolutionImages);
            toastSuccess('Fotos de resolución agregadas correctamente');
            navigation.goBack();
        } catch (error) {
            console.error('Error al subir fotos de resolución:', error);
            toastError('No se pudieron subir las fotos. Intenta nuevamente.');
        } finally {
            setUploading(false);
        }
    };

    const getPrioridadConfig = (prioridad: string): PrioridadConfig => {
        const configs: Record<string, PrioridadConfig> = {
            Alto: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
            Crítico: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
            Medio: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
            Bajo: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
        };
        return configs[prioridad] || configs['Medio'];
    };

    const getEstadoConfig = (estado: string): EstadoConfig => {
        const configs: Record<string, EstadoConfig> = {
            Pendiente: { text: '#D97706' },
            'En Revisión': { text: '#2563EB' },
            Resuelto: { text: '#059669' },
        };
        return configs[estado] || configs['Pendiente'];
    };

    const prioridadConfig = getPrioridadConfig(incidencia.gradoSeveridad);
    const estadoConfig = getEstadoConfig(incidencia.estado);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={styles.headerIconCircle}>
                        <Ionicons name="camera-outline" size={28} color="#059669" />
                    </View>
                    <Text style={styles.headerTitle}>Fotos de Resolución</Text>
                    <Text style={styles.headerSubtitle}>
                        Agrega fotos que demuestren que la incidencia ha sido resuelta
                    </Text>
                </View>

                {/* ── Resumen de incidencia ── */}
                <View style={styles.incidenciaSummary}>
                    <View style={styles.summaryTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.summaryTitle}>{incidencia.tipoIncidente}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: prioridadConfig.bg, borderColor: prioridadConfig.border }]}>
                            <Text style={[styles.badgeText, { color: prioridadConfig.text }]}>{incidencia.gradoSeveridad}</Text>
                        </View>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryDetails}>
                        <SummaryRow icon="business-outline" label="Área" value={incidencia.areaAfectada} />
                        <SummaryRow icon="calendar-outline" label="Fecha" value={moment(incidencia.fecha).format('DD/MM/YYYY')} />
                        <SummaryRow icon="flag-outline" label="Estado" value={incidencia.estado} valueColor={estadoConfig.text} />
                    </View>
                </View>

                {/* ── Sección de imágenes ── */}
                <View style={styles.imagesSection}>
                    <View style={styles.imagesSectionHeader}>
                        <Text style={styles.sectionTitle}>Fotos de Prueba</Text>
                        <View style={styles.counterBadge}>
                            <Text style={styles.counterText}>{resolutionImages.length}/{MAX_IMAGES}</Text>
                        </View>
                    </View>

                    {resolutionImages.length > 0 ? (
                        <FlatList
                            data={resolutionImages}
                            horizontal
                            renderItem={({ item, index }: ListRenderItemInfo<string>) => (
                                <View style={styles.imageItem}>
                                    <Image source={{ uri: item }} style={styles.imagePreview} />
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => handleRemoveImage(index)}
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                    >
                                        <Ionicons name="close" size={14} color="#fff" />
                                    </TouchableOpacity>
                                    <View style={styles.imageIndex}>
                                        <Text style={styles.imageIndexText}>{index + 1}</Text>
                                    </View>
                                </View>
                            )}
                            keyExtractor={(_, index) => index.toString()}
                            contentContainerStyle={styles.imagesList}
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="images-outline" size={36} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No hay imágenes agregadas</Text>
                            <Text style={styles.emptySubtitle}>Toma fotos que demuestren la resolución</Text>
                        </View>
                    )}

                    {resolutionImages.length < MAX_IMAGES && (
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={() => setShowCamera(true)} activeOpacity={0.7}>
                            <Ionicons name="camera-outline" size={20} color="#059669" />
                            <Text style={styles.addPhotoBtnText}>Tomar Foto de Resolución</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Botones de acción ── */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={uploading} activeOpacity={0.7}>
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.submitBtn, (uploading || resolutionImages.length === 0) && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={uploading || resolutionImages.length === 0}
                        activeOpacity={0.7}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={18} color={resolutionImages.length === 0 ? '#9CA3AF' : '#fff'} />
                                <Text style={[styles.submitBtnText, resolutionImages.length === 0 && { color: '#9CA3AF' }]}>
                                    Guardar Fotos
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                visible={showCamera}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowCamera(false)}
            >
                <CameraIncidence
                    onImageCaptured={handleImageCaptured}
                    onClose={() => setShowCamera(false)}
                    onNavigateToAnnotation={(imageUri: string) => {
                        setShowCamera(false);
                        navigation.navigate('ImageAnnotation', { imageUri, returnScreen: 'ResolutionPhotos' });
                    }}
                    currentImageCount={resolutionImages.length}
                    maxImages={MAX_IMAGES}
                />
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
    headerIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    headerTitle: { fontSize: 21, fontWeight: '700', color: '#111827', marginBottom: 6 },
    headerSubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
    incidenciaSummary: { marginHorizontal: 20, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: '#059669' },
    summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    summaryTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    summaryDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
    summaryDetails: { gap: 10 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryLabel: { fontSize: 13, color: '#9CA3AF', width: 48 },
    summaryValue: { fontSize: 14, fontWeight: '500', color: '#1F2937', flex: 1 },
    imagesSection: { paddingHorizontal: 20, paddingTop: 20 },
    imagesSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    counterBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    counterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    imagesList: { paddingBottom: 4 },
    imageItem: { marginRight: 10, position: 'relative' },
    imagePreview: { width: 110, height: 110, borderRadius: 10 },
    removeBtn: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.85)', justifyContent: 'center', alignItems: 'center' },
    imageIndex: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
    imageIndexText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingVertical: 40, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed' },
    emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    emptyTitle: { fontSize: 15, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
    emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },
    addPhotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#059669', borderStyle: 'dashed', backgroundColor: '#F0FDF4' },
    addPhotoBtnText: { fontSize: 14, fontWeight: '600', color: '#059669' },
    actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 24 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    submitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#059669' },
    submitBtnDisabled: { backgroundColor: '#E5E7EB' },
    submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
