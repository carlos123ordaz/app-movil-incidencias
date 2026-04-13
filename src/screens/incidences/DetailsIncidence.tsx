import { useState, useEffect, useContext } from 'react';
import ImageViewer from 'react-native-image-zoom-viewer';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, Modal } from 'react-native';
import { Text, ActivityIndicator, Chip, Button, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';
import { incidenciaService } from '../../services/incidenciaService';
import { MainContext } from '../../contexts/MainContextApp';
import { Incidencia } from '../../types';

moment.locale('es');

interface InfoRowProps {
    icon: string;
    label: string;
    value?: string;
    alert?: boolean;
}

const InfoRow = ({ icon, label, value, alert }: InfoRowProps) => (
    <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
            <View style={styles.infoIconWrap}>
                <Ionicons name={icon as any} size={16} color={alert ? '#DC2626' : '#64748B'} />
            </View>
            <Text style={styles.infoLabel}>{label}</Text>
        </View>
        <Text style={[styles.infoValue, alert && styles.alertText]} numberOfLines={2}>
            {value}
        </Text>
    </View>
);

export default function DetailsIncidence() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { userData } = useContext(MainContext);
    const { id } = route.params as { id: string };

    const [incidencia, setIncidencia] = useState<Incidencia | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [showImageModal, setShowImageModal] = useState<boolean>(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

    useEffect(() => {
        loadIncidencia();
    }, [id]);

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

    const handleDelete = (): void => {
        Alert.alert('Eliminar incidencia', '¿Estás seguro? Esta acción no se puede deshacer.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setDeleting(true);
                        await incidenciaService.deleteIncidencia(id);
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', 'No se pudo eliminar la incidencia');
                    } finally {
                        setDeleting(false);
                    }
                },
            },
        ]);
    };

    const handleEdit = (): void => {
        navigation.navigate('editar-incidencia', { id: incidencia!._id });
    };

    const getSeveridadStyle = (severidad: string): { bg: string; text: string } => {
        const map: Record<string, { bg: string; text: string }> = {
            Crítico: { bg: '#FEE2E2', text: '#991B1B' },
            Alto: { bg: '#FFEDD5', text: '#9A3412' },
            Medio: { bg: '#FEF3C7', text: '#92400E' },
            Bajo: { bg: '#D1FAE5', text: '#065F46' },
        };
        return map[severidad] || map.Bajo;
    };

    const getEstadoStyle = (estado: string): { bg: string; text: string } => {
        const map: Record<string, { bg: string; text: string }> = {
            Pendiente: { bg: '#FEF3C7', text: '#92400E' },
            'En Revisión': { bg: '#DBEAFE', text: '#1E40AF' },
            Resuelto: { bg: '#D1FAE5', text: '#065F46' },
            Cerrado: { bg: '#F1F5F9', text: '#475569' },
        };
        return map[estado] || map.Pendiente;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!incidencia) return null;

    const severidadStyle = getSeveridadStyle(incidencia.gradoSeveridad);
    const estadoStyle = getEstadoStyle(incidencia.estado);
    const esCreador = userData?._id === incidencia.user?._id;
    const puedeEditar = esCreador && incidencia.estado === 'Pendiente';

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <Text style={styles.title}>{incidencia.tipoIncidente}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color="#64748B" />
                            <Text style={styles.metaText}>{moment(incidencia.fecha).format('DD MMM YYYY, HH:mm')}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color="#64748B" />
                            <Text style={styles.metaText}>{moment(incidencia.createdAt).fromNow()}</Text>
                        </View>
                    </View>

                    <View style={styles.chipsRow}>
                        <Chip style={[styles.chip, { backgroundColor: severidadStyle.bg }]} textStyle={[styles.chipText, { color: severidadStyle.text }]} compact>
                            {incidencia.gradoSeveridad}
                        </Chip>
                        <Chip style={[styles.chip, { backgroundColor: estadoStyle.bg }]} textStyle={[styles.chipText, { color: estadoStyle.text }]} compact>
                            {incidencia.estado}
                        </Chip>
                    </View>
                </View>

                <View style={styles.sectionCard}>
                    <InfoRow icon="location-outline" label="Ubicación" value={incidencia.ubicacion} />
                    <InfoRow icon="business-outline" label="Área afectada" value={incidencia.areaAfectada} />
                    <InfoRow icon="person-outline" label="Reportado por" value={`${incidencia.user?.name || ''} ${incidencia.user?.lname || ''}`} />
                    {incidencia.asigned && (
                        <InfoRow icon="person-circle-outline" label="Asignado a" value={`${incidencia.asigned.name || ''} ${incidencia.asigned.lname || ''}`} />
                    )}
                    {incidencia.deadline && (
                        <InfoRow
                            icon="calendar-outline"
                            label="Fecha límite"
                            value={moment(incidencia.deadline).format('DD MMM YYYY')}
                            alert={moment(incidencia.deadline).isBefore(moment()) && incidencia.estado !== 'Resuelto'}
                        />
                    )}
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>{incidencia.descripcion}</Text>
                </View>

                {incidencia.recomendacion && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Recomendación</Text>
                        <Text style={styles.secondaryText}>{incidencia.recomendacion}</Text>
                    </View>
                )}

                {incidencia.imagenes && incidencia.imagenes.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Evidencias</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContent}>
                            {incidencia.imagenes.map((img, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        setSelectedImageIndex(index);
                                        setShowImageModal(true);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Image source={{ uri: img }} style={styles.thumbnail} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {incidencia.historialEstados && incidencia.historialEstados.length > 1 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Historial</Text>
                        {[...incidencia.historialEstados].reverse().map((item, index) => (
                            <View key={index} style={[styles.historyItem, index === incidencia.historialEstados!.length - 1 && styles.historyItemLast]}>
                                <View style={styles.historyTrack}>
                                    <View style={styles.historyDot} />
                                    {index !== incidencia.historialEstados!.length - 1 && <View style={styles.historyLine} />}
                                </View>
                                <View style={styles.historyContent}>
                                    <View style={styles.historyHeader}>
                                        <Text style={styles.historyState}>{item.estado}</Text>
                                        <Text style={styles.historyDate}>{moment(item.fecha).format('DD/MM/YY HH:mm')}</Text>
                                    </View>
                                    {item.usuario && <Text style={styles.historyUser}>{item.usuario.nombre} {item.usuario.apellido}</Text>}
                                    {item.notas && <Text style={styles.historyNotes}>{item.notas}</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {puedeEditar && (
                    <View style={styles.actionsSection}>
                        <Button mode="contained" icon="pencil" onPress={handleEdit} style={styles.editButton} contentStyle={styles.actionButtonContent}>
                            Editar
                        </Button>
                        <Button
                            mode="outlined"
                            icon="delete"
                            onPress={handleDelete}
                            loading={deleting}
                            disabled={deleting}
                            style={styles.deleteButton}
                            contentStyle={styles.actionButtonContent}
                            textColor="#DC2626"
                        >
                            Eliminar
                        </Button>
                    </View>
                )}
            </ScrollView>

            <Modal visible={showImageModal} transparent onRequestClose={() => setShowImageModal(false)}>
                <View style={styles.modal}>
                    <ImageViewer
                        imageUrls={incidencia?.imagenes?.map((img) => ({ url: img })) || []}
                        index={selectedImageIndex}
                        onCancel={() => setShowImageModal(false)}
                        enableSwipeDown
                        onSwipeDown={() => setShowImageModal(false)}
                        backgroundColor="#000"
                        saveToLocalByLongPress={false}
                        onClick={() => setShowImageModal(false)}
                        renderIndicator={(currentIndex, allSize) => (
                            <View style={styles.indicatorContainer}>
                                <Text style={styles.indicatorText}>{currentIndex} / {allSize}</Text>
                            </View>
                        )}
                    />
                    <View style={styles.modalCloseOverlay}>
                        <IconButton
                            icon="close"
                            iconColor="white"
                            size={28}
                            onPress={() => setShowImageModal(false)}
                            style={styles.modalCloseButton}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    content: { flex: 1 },
    contentContainer: { padding: 16, paddingBottom: 28, gap: 12 },
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    title: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 13, color: '#64748B' },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { height: 28 },
    chipText: { fontSize: 12, fontWeight: '600' },
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
    infoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    infoIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: { fontSize: 14, color: '#64748B' },
    infoValue: { flex: 1, fontSize: 14, color: '#0F172A', fontWeight: '500', textAlign: 'right' },
    alertText: { color: '#DC2626' },
    description: { fontSize: 14, color: '#334155', lineHeight: 22 },
    secondaryText: { fontSize: 14, color: '#475569', lineHeight: 22 },
    galleryContent: { gap: 12 },
    thumbnail: { width: 108, height: 108, borderRadius: 12, backgroundColor: '#E2E8F0' },
    historyItem: { flexDirection: 'row', gap: 12, paddingBottom: 14 },
    historyItemLast: { paddingBottom: 0 },
    historyTrack: { width: 14, alignItems: 'center' },
    historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 6 },
    historyLine: { flex: 1, width: 1, backgroundColor: '#DBEAFE', marginTop: 4 },
    historyContent: { flex: 1 },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 2 },
    historyState: { fontSize: 14, fontWeight: '600', color: '#0F172A', flex: 1 },
    historyDate: { fontSize: 12, color: '#64748B' },
    historyUser: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    historyNotes: { fontSize: 13, color: '#475569', lineHeight: 18 },
    actionsSection: { flexDirection: 'row', gap: 12, paddingTop: 4 },
    editButton: { flex: 1, borderRadius: 14 },
    deleteButton: { flex: 1, borderRadius: 14, borderColor: '#FCA5A5' },
    actionButtonContent: { height: 46 },
    modal: { flex: 1, backgroundColor: '#000000' },
    modalCloseOverlay: { position: 'absolute', top: 50, right: 16, zIndex: 9999, elevation: 10 },
    modalCloseButton: { backgroundColor: 'rgba(0,0,0,0.5)' },
    indicatorContainer: { position: 'absolute', top: 58, left: 16, zIndex: 9999 },
    indicatorText: { fontSize: 16, color: 'white', fontWeight: '500' },
});
