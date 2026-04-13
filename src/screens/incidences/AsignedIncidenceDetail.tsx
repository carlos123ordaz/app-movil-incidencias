import { useState, useEffect, useContext } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
    FlatList,
    Modal,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    ListRenderItemInfo,
} from 'react-native';
import { Text, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { incidenciaService } from '../../services/incidenciaService';
import { MainContext } from '../../contexts/MainContextApp';
import { Incidencia } from '../../types';
import 'moment/locale/es';

moment.locale('es');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BadgeConfig {
    bg: string;
    text: string;
}

interface InfoRowProps {
    icon: string;
    label: string;
    value: string;
    alert?: boolean;
}

function InfoRow({ icon, label, value, alert }: InfoRowProps) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
                <View style={styles.infoIconWrap}>
                    <Ionicons name={icon as any} size={16} color={alert ? '#DC2626' : '#64748B'} />
                </View>
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={[styles.infoValue, alert && styles.infoValueAlert]} numberOfLines={2}>
                {value}
            </Text>
        </View>
    );
}

export default function AsignedIncidenceDetail() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const theme = useTheme();
    const { userData } = useContext(MainContext);
    const { id } = route.params as { id: string };

    const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [resolviendo, setResolviendo] = useState<boolean>(false);
    const [showImageModal, setShowImageModal] = useState<boolean>(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
    const [currentImageGallery, setCurrentImageGallery] = useState<string[]>([]);
    const [galleryTitle, setGalleryTitle] = useState<string>('');
    const [showResolverModal, setShowResolverModal] = useState<boolean>(false);
    const [notas, setNotas] = useState<string>('');
    const [showHistorialModal, setShowHistorialModal] = useState<boolean>(false);

    useEffect(() => {
        loadIncidencia();
    }, [id]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadIncidencia();
        });
        return unsubscribe;
    }, [navigation]);

    const loadIncidencia = async (): Promise<void> => {
        try {
            setLoading(true);
            const data = await incidenciaService.getIncidenciaById(id);
            setIncidencia(data);
        } catch (error) {
            console.error('Error al cargar incidencia:', error);
            Alert.alert('Error', 'No se pudo cargar la incidencia');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleResolver = async (): Promise<void> => {
        if (!incidencia!.imagenesResolucion || incidencia!.imagenesResolucion.length === 0) {
            Alert.alert(
                'Fotos requeridas',
                'Debes agregar al menos una foto de resolución antes de marcar como resuelta',
                [
                    {
                        text: 'Agregar fotos',
                        onPress: () => {
                            setShowResolverModal(false);
                            navigation.navigate('ResolutionPhotos', { incidencia });
                        },
                    },
                    { text: 'Cancelar', style: 'cancel' },
                ]
            );
            return;
        }

        if (!notas.trim()) {
            Alert.alert('Atención', 'Agrega notas sobre la resolución');
            return;
        }

        try {
            setResolviendo(true);
            await incidenciaService.marcarComoResuelta(id, userData!._id, notas.trim());
            Alert.alert(
                'Incidencia resuelta',
                'La incidencia ha sido marcada como resuelta correctamente.',
                [{ text: 'OK', onPress: () => { setShowResolverModal(false); navigation.navigate('HomeTabs', { screen: 'Incidencias' }); } }]
            );
        } catch (error: any) {
            console.error('Error al resolver incidencia:', error);
            const errorMsg = error.response?.data?.error || 'No se pudo cambiar el estado de la incidencia';
            Alert.alert('Error', errorMsg);
        } finally {
            setResolviendo(false);
        }
    };

    const openResolverModal = (): void => {
        setShowResolverModal(true);
        setNotas('');
    };

    const openImageGallery = (images: string[], index = 0, title = 'Imágenes'): void => {
        setCurrentImageGallery(images);
        setSelectedImageIndex(index);
        setGalleryTitle(title);
        setShowImageModal(true);
    };

    const getPrioridadConfig = (prioridad: string): BadgeConfig => {
        const configs: Record<string, BadgeConfig> = {
            Alto: { bg: '#FEE2E2', text: '#DC2626' },
            Crítico: { bg: '#FEE2E2', text: '#991B1B' },
            Medio: { bg: '#FEF3C7', text: '#B45309' },
            Bajo: { bg: '#D1FAE5', text: '#065F46' },
        };
        return configs[prioridad] || configs.Medio;
    };

    const getEstadoConfig = (estado: string): BadgeConfig => {
        const configs: Record<string, BadgeConfig> = {
            Pendiente: { bg: '#FEF3C7', text: '#92400E' },
            'En Revisión': { bg: '#DBEAFE', text: '#1D4ED8' },
            Resuelto: { bg: '#D1FAE5', text: '#047857' },
        };
        return configs[estado] || configs.Pendiente;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando incidencia...</Text>
            </View>
        );
    }

    if (!incidencia) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>No se pudo cargar la incidencia</Text>
                <Button mode="contained" onPress={() => navigation.goBack()}>Volver</Button>
            </View>
        );
    }

    const prioridadConfig = getPrioridadConfig(incidencia.gradoSeveridad);
    const estadoConfig = getEstadoConfig(incidencia.estado);
    const isVencida = incidencia.estado === 'En Revisión' && incidencia.deadline != null && moment(incidencia.deadline).isBefore(moment());
    const puedeResolver = incidencia.estado === 'En Revisión' && incidencia.asigned?._id === userData?._id;
    const tieneImagenesIncidente = incidencia.imagenes && incidencia.imagenes.length > 0;
    const tieneImagenesResolucion = incidencia.imagenesResolucion && incidencia.imagenesResolucion.length > 0;

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {isVencida && (
                    <View style={styles.alertCard}>
                        <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                        <Text style={styles.alertText}>Esta incidencia está vencida.</Text>
                    </View>
                )}

                <View style={styles.headerCard}>
                    <Text style={styles.title}>{incidencia.tipoIncidente}</Text>
                    <Text style={styles.metaText}>Registrado {moment(incidencia.createdAt).fromNow()}</Text>

                    <View style={styles.badgesRow}>
                        <View style={[styles.badge, { backgroundColor: prioridadConfig.bg }]}>
                            <Text style={[styles.badgeText, { color: prioridadConfig.text }]}>{incidencia.gradoSeveridad}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: estadoConfig.bg }]}>
                            <Text style={[styles.badgeText, { color: estadoConfig.text }]}>{incidencia.estado}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <InfoRow icon="calendar-outline" label="Fecha del incidente" value={moment(incidencia.fecha).format('DD/MM/YYYY HH:mm')} />
                    <InfoRow icon="location-outline" label="Ubicación" value={incidencia.ubicacion} />
                    <InfoRow icon="business-outline" label="Área afectada" value={incidencia.areaAfectada} />
                    <InfoRow icon="person-outline" label="Reportado por" value={`${incidencia.user?.name || 'Usuario'} ${incidencia.user?.lname || ''}`} />
                    <InfoRow icon="person-circle-outline" label="Asignado a" value={`${incidencia.asigned?.name || ''} ${incidencia.asigned?.lname || ''}`} />
                    {incidencia.deadline && (
                        <InfoRow
                            icon="alarm-outline"
                            label="Fecha límite"
                            value={isVencida ? `${moment(incidencia.deadline).format('DD MMM YYYY')} · vencida` : moment(incidencia.deadline).format('DD MMM YYYY')}
                            alert={isVencida}
                        />
                    )}
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.bodyText}>{incidencia.descripcion}</Text>
                </View>

                {incidencia.recomendacion && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Recomendación</Text>
                        <Text style={styles.bodyTextMuted}>{incidencia.recomendacion}</Text>
                    </View>
                )}

                {tieneImagenesIncidente && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Imágenes del incidente</Text>
                        <FlatList
                            data={incidencia.imagenes}
                            horizontal
                            renderItem={({ item, index }: ListRenderItemInfo<string>) => (
                                <TouchableOpacity
                                    style={styles.imageThumb}
                                    onPress={() => openImageGallery(incidencia.imagenes!, index, 'Imágenes del incidente')}
                                    activeOpacity={0.85}
                                >
                                    <Image source={{ uri: item }} style={styles.thumbImage} resizeMode="cover" />
                                </TouchableOpacity>
                            )}
                            keyExtractor={(_, index) => `incident-${index}`}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.imagesList}
                        />
                    </View>
                )}

                {tieneImagenesResolucion && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Fotos de resolución</Text>
                        <FlatList
                            data={incidencia.imagenesResolucion}
                            horizontal
                            renderItem={({ item, index }: ListRenderItemInfo<string>) => (
                                <TouchableOpacity
                                    style={styles.imageThumb}
                                    onPress={() => openImageGallery(incidencia.imagenesResolucion!, index, 'Fotos de resolución')}
                                    activeOpacity={0.85}
                                >
                                    <Image source={{ uri: item }} style={styles.thumbImage} resizeMode="cover" />
                                </TouchableOpacity>
                            )}
                            keyExtractor={(_, index) => `resolution-${index}`}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.imagesList}
                        />
                    </View>
                )}

                {incidencia.historialEstados && incidencia.historialEstados.length > 1 && (
                    <TouchableOpacity style={styles.sectionAction} onPress={() => setShowHistorialModal(true)} activeOpacity={0.75}>
                        <Text style={styles.sectionActionText}>Ver historial completo</Text>
                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                )}

                {puedeResolver && (
                    <View style={styles.actionsCard}>
                        {!tieneImagenesResolucion && (
                            <Text style={styles.helperText}>Agrega fotos de resolución antes de marcar como resuelta.</Text>
                        )}

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.btnSecondary}
                                onPress={() => navigation.navigate('ResolutionPhotos', { incidencia })}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.btnSecondaryText}>{tieneImagenesResolucion ? 'Actualizar fotos' : 'Agregar fotos'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btnPrimary, !tieneImagenesResolucion && styles.btnDisabled]}
                                onPress={openResolverModal}
                                activeOpacity={0.75}
                                disabled={!tieneImagenesResolucion}
                            >
                                <Text style={[styles.btnPrimaryText, !tieneImagenesResolucion && styles.btnDisabledText]}>Marcar resuelto</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
                <View style={styles.imgModalContainer}>
                    <View style={styles.imgModalHeader}>
                        <Text style={styles.imgModalTitle}>{galleryTitle} {currentImageGallery.length > 0 ? `${selectedImageIndex + 1}/${currentImageGallery.length}` : ''}</Text>
                        <TouchableOpacity onPress={() => setShowImageModal(false)}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.imgModalBody}>
                        {currentImageGallery.length > 0 && (
                            <Image source={{ uri: currentImageGallery[selectedImageIndex] }} style={styles.imgModalImage} resizeMode="contain" />
                        )}
                    </View>
                    {currentImageGallery.length > 1 && (
                        <View style={styles.imgModalNav}>
                            <TouchableOpacity
                                style={[styles.imgNavBtn, selectedImageIndex === 0 && styles.imgNavBtnDisabled]}
                                onPress={() => setSelectedImageIndex((prev) => Math.max(0, prev - 1))}
                                disabled={selectedImageIndex === 0}
                            >
                                <Ionicons name="chevron-back" size={22} color={selectedImageIndex === 0 ? '#555' : '#fff'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.imgNavBtn, selectedImageIndex === currentImageGallery.length - 1 && styles.imgNavBtnDisabled]}
                                onPress={() => setSelectedImageIndex((prev) => Math.min(currentImageGallery.length - 1, prev + 1))}
                                disabled={selectedImageIndex === currentImageGallery.length - 1}
                            >
                                <Ionicons name="chevron-forward" size={22} color={selectedImageIndex === currentImageGallery.length - 1 ? '#555' : '#fff'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Modal>

            <Modal visible={showResolverModal} transparent animationType="slide" onRequestClose={() => setShowResolverModal(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.resolverOverlay}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <TouchableOpacity style={styles.resolverOverlayInner} activeOpacity={1} onPress={() => setShowResolverModal(false)}>
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            <View style={styles.resolverSheet}>
                                <Text style={styles.resolverTitle}>Resolver incidencia</Text>
                                <Text style={styles.resolverSubtitle}>Agrega una nota breve sobre la solución aplicada.</Text>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Describe cómo se resolvió la incidencia..."
                                    placeholderTextColor="#9CA3AF"
                                    value={notas}
                                    onChangeText={setNotas}
                                    multiline
                                    textAlignVertical="top"
                                />
                                <View style={styles.resolverActions}>
                                    <TouchableOpacity style={styles.resolverCancelBtn} onPress={() => setShowResolverModal(false)} disabled={resolviendo} activeOpacity={0.75}>
                                        <Text style={styles.resolverCancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.resolverConfirmBtn, (resolviendo || !notas.trim()) && styles.resolverConfirmBtnDisabled]}
                                        onPress={handleResolver}
                                        disabled={resolviendo || !notas.trim()}
                                        activeOpacity={0.75}
                                    >
                                        {resolviendo ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.resolverConfirmText}>Confirmar</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showHistorialModal} transparent animationType="slide" onRequestClose={() => setShowHistorialModal(false)}>
                <View style={styles.historialOverlay}>
                    <View style={styles.historialSheet}>
                        <View style={styles.historialHeader}>
                            <Text style={styles.historialTitle}>Historial</Text>
                            <TouchableOpacity onPress={() => setShowHistorialModal(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.historialBody} showsVerticalScrollIndicator={false}>
                            {incidencia.historialEstados?.map((h, i) => (
                                <View key={i} style={styles.timelineItem}>
                                    <View style={styles.timelineTrack}>
                                        <View style={styles.timelineDot} />
                                        {i < incidencia.historialEstados!.length - 1 && <View style={styles.timelineLine} />}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={styles.timelineEstado}>{h.estado}</Text>
                                        <Text style={styles.timelineFecha}>{moment(h.fecha).format('DD/MM/YYYY HH:mm')}</Text>
                                        {h.usuario && <Text style={styles.timelineUser}>{h.usuario.nombre} {h.usuario.apellido}</Text>}
                                        {h.notas && <Text style={styles.timelineNota}>{h.notas}</Text>}
                                    </View>
                                </View>
                            ))}

                            {incidencia.historialDeadline && incidencia.historialDeadline.length > 0 && (
                                <View style={styles.timelineGroup}>
                                    <Text style={styles.timelineGroupTitle}>Cambios de fecha límite</Text>
                                    {incidencia.historialDeadline.map((h: any, i: number) => (
                                        <View key={i} style={styles.timelineItem}>
                                            <View style={styles.timelineTrack}>
                                                <View style={[styles.timelineDot, { backgroundColor: '#D97706' }]} />
                                                {i < incidencia.historialDeadline!.length - 1 && <View style={[styles.timelineLine, { backgroundColor: '#FDE68A' }]} />}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <Text style={styles.timelineEstado}>
                                                    {`${moment(h.deadlineAnterior).format('DD/MM/YYYY')} -> ${moment(h.deadlineNuevo).format('DD/MM/YYYY')}`}
                                                </Text>
                                                <Text style={styles.timelineFecha}>{moment(h.fecha).format('DD/MM/YYYY HH:mm')}</Text>
                                                {h.usuario && <Text style={styles.timelineUser}>{h.usuario.nombre} {h.usuario.apellido}</Text>}
                                                {h.notas && <Text style={styles.timelineNota}>{h.notas}</Text>}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    contentContainer: { padding: 16, paddingBottom: 28, gap: 12 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
    errorText: { fontSize: 17, color: '#EF4444', marginTop: 12, marginBottom: 24, textAlign: 'center' },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    alertText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    title: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
    metaText: { fontSize: 13, color: '#64748B' },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    infoIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: { fontSize: 14, color: '#64748B' },
    infoValue: { flex: 1, fontSize: 14, fontWeight: '500', color: '#0F172A', textAlign: 'right' },
    infoValueAlert: { color: '#DC2626' },
    bodyText: { fontSize: 14, color: '#334155', lineHeight: 22 },
    bodyTextMuted: { fontSize: 14, color: '#475569', lineHeight: 22 },
    imagesList: { paddingRight: 6 },
    imageThumb: { width: 108, height: 108, borderRadius: 12, marginRight: 10, overflow: 'hidden', backgroundColor: '#E2E8F0' },
    thumbImage: { width: '100%', height: '100%' },
    sectionAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionActionText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
    actionsCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    helperText: { fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 19 },
    actionButtons: { flexDirection: 'row', gap: 10 },
    btnSecondary: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    btnSecondaryText: { fontSize: 13, fontWeight: '600', color: '#334155' },
    btnPrimary: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnPrimaryText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
    btnDisabled: { backgroundColor: '#E5E7EB' },
    btnDisabledText: { color: '#94A3B8' },
    imgModalContainer: { flex: 1, backgroundColor: '#000' },
    imgModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 54 : 20,
        paddingBottom: 16,
    },
    imgModalTitle: { fontSize: 15, fontWeight: '600', color: '#fff', flex: 1 },
    imgModalBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imgModalImage: { width: SCREEN_WIDTH, height: '100%' },
    imgModalNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16 },
    imgNavBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    imgNavBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)' },
    resolverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    resolverOverlayInner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    resolverSheet: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, alignSelf: 'center' },
    resolverTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
    resolverSubtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 14 },
    textArea: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, fontSize: 14, color: '#111827', minHeight: 120, backgroundColor: '#F8FAFC' },
    resolverActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    resolverCancelBtn: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
    resolverCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    resolverConfirmBtn: { flex: 1, height: 46, borderRadius: 14, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
    resolverConfirmBtnDisabled: { backgroundColor: '#D1D5DB' },
    resolverConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    historialOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    historialSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    historialHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    historialTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    historialBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
    timelineItem: { flexDirection: 'row', gap: 12, paddingBottom: 16 },
    timelineTrack: { width: 14, alignItems: 'center' },
    timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginTop: 6 },
    timelineLine: { flex: 1, width: 1, backgroundColor: '#DBEAFE', marginTop: 4 },
    timelineContent: { flex: 1 },
    timelineEstado: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
    timelineFecha: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
    timelineUser: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    timelineNota: { fontSize: 12, color: '#475569', lineHeight: 18 },
    timelineGroup: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    timelineGroupTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 14 },
});
