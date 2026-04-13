import { useState, useEffect, useContext, useMemo } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    TextInput,
    ListRenderItemInfo,
    ScrollView,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { incidenciaService } from '../../services/incidenciaService';
import { MainContext } from '../../contexts/MainContextApp';
import { Incidencia } from '../../types';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

interface FiltroItem {
    label: string;
    value: string;
}

interface BadgeConfig {
    color: string;
    bg: string;
}

export default function AsignedIncidence() {
    const navigation = useNavigation<any>();
    const { userData } = useContext(MainContext);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');

    useEffect(() => {
        if (userData && incidencias.length === 0) {
            loadIncidenciasAsignadas();
        }
    }, [userData]);

    const loadIncidenciasAsignadas = async (): Promise<void> => {
        try {
            setLoading(true);
            const data = await incidenciaService.getIncidenciasAsignadas(userData!._id);
            setIncidencias(data);
        } catch (error) {
            console.error('Error al cargar incidencias asignadas:', error);
            Alert.alert('Error', 'No se pudieron cargar las incidencias asignadas');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = (): void => {
        setIsRefreshing(true);
        loadIncidenciasAsignadas();
    };

    const incidenciasFiltradas = useMemo((): Incidencia[] => {
        let filtered = incidencias.filter((incidencia) => {
            const query = searchQuery.trim().toLowerCase();

            return (
                incidencia.tipoIncidente.toLowerCase().includes(query) ||
                incidencia.areaAfectada.toLowerCase().includes(query) ||
                incidencia.ubicacion.toLowerCase().includes(query)
            );
        });

        if (filtroEstado === 'pendientes') {
            filtered = filtered.filter((inc) => inc.estado === 'En Revisión');
        } else if (filtroEstado === 'vencidas') {
            filtered = filtered.filter((inc) =>
                inc.estado === 'En Revisión' &&
                inc.deadline != null &&
                moment(inc.deadline).isBefore(moment())
            );
        } else if (filtroEstado === 'resueltas') {
            filtered = filtered.filter((inc) => inc.estado === 'Resuelto');
        }

        return filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [incidencias, searchQuery, filtroEstado]);

    const filtros: FiltroItem[] = [
        { label: 'Todas', value: 'todas' },
        { label: 'Pendientes', value: 'pendientes' },
        { label: 'Vencidas', value: 'vencidas' },
        { label: 'Resueltas', value: 'resueltas' },
    ];

    const getPrioridadConfig = (prioridad: string): BadgeConfig => {
        const configs: Record<string, BadgeConfig> = {
            Alto: { color: '#DC2626', bg: '#FEE2E2' },
            Crítico: { color: '#991B1B', bg: '#FEE2E2' },
            Medio: { color: '#D97706', bg: '#FEF3C7' },
            Bajo: { color: '#0891B2', bg: '#CFFAFE' },
        };
        return configs[prioridad] || configs.Medio;
    };

    const getEstadoConfig = (estado: string): BadgeConfig => {
        const configs: Record<string, BadgeConfig> = {
            'En Revisión': { color: '#2563EB', bg: '#DBEAFE' },
            Resuelto: { color: '#059669', bg: '#D1FAE5' },
            Pendiente: { color: '#B45309', bg: '#FEF3C7' },
            Cerrado: { color: '#475569', bg: '#E2E8F0' },
        };
        return configs[estado] || configs['En Revisión'];
    };

    const renderIncidenciaItem = ({ item }: ListRenderItemInfo<Incidencia>) => {
        const prioridadConfig = getPrioridadConfig(item.gradoSeveridad);
        const estadoConfig = getEstadoConfig(item.estado);
        const isVencida = item.estado === 'En Revisión' && item.deadline != null && moment(item.deadline).isBefore(moment());

        return (
            <TouchableOpacity
                style={[styles.incidenciaCard, isVencida && styles.incidenciaCardVencida]}
                onPress={() => navigation.navigate('DetalleIncidenciaAsignada', { id: item._id })}
                activeOpacity={0.75}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerMain}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.tipoIncidente}</Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="business-outline" size={13} color="#94A3B8" />
                                <Text style={styles.metaText} numberOfLines={1}>{item.areaAfectada}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="location-outline" size={13} color="#94A3B8" />
                                <Text style={styles.metaText} numberOfLines={1}>{item.ubicacion}</Text>
                            </View>
                        </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.badgesRow}>
                        <View style={[styles.badge, { backgroundColor: estadoConfig.bg }]}>
                            <Text style={[styles.badgeText, { color: estadoConfig.color }]}>{item.estado}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: prioridadConfig.bg }]}>
                            <Text style={[styles.badgeText, { color: prioridadConfig.color }]}>{item.gradoSeveridad}</Text>
                        </View>
                        {item.deadline && (
                            <View style={[styles.badge, isVencida ? styles.badgeDanger : styles.badgeMuted]}>
                                <Text style={[styles.badgeText, isVencida ? styles.badgeDangerText : styles.badgeMutedText]}>
                                    {isVencida ? 'Vencida' : moment(item.deadline).format('DD MMM')}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.dateText}>{moment(item.fecha).format('DD MMM, HH:mm')}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Cargando incidencias...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por tipo, área o ubicación"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                    {filtros.map((filtro) => {
                        const isActive = filtroEstado === filtro.value;

                        return (
                            <TouchableOpacity
                                key={filtro.value}
                                style={[styles.filtroChip, isActive && styles.filtroChipActive]}
                                onPress={() => setFiltroEstado(filtro.value)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.filtroChipText, isActive && styles.filtroChipTextActive]}>
                                    {filtro.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <FlatList
                data={incidenciasFiltradas}
                keyExtractor={(item) => item._id}
                renderItem={renderIncidenciaItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#3B82F6']} tintColor="#3B82F6" />
                }
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="clipboard-outline" size={48} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {searchQuery
                                ? 'No se encontraron resultados'
                                : filtroEstado === 'vencidas'
                                    ? 'No hay incidencias vencidas'
                                    : filtroEstado === 'resueltas'
                                        ? 'No hay incidencias resueltas'
                                        : 'No hay incidencias asignadas'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery
                                ? 'Prueba con otra búsqueda'
                                : filtroEstado === 'vencidas'
                                    ? 'Todas las incidencias están al día'
                                    : 'Las nuevas asignaciones aparecerán aquí'}
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loadingText: { marginTop: 16, fontSize: 15, color: '#6B7280' },
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },
    filtersRow: { paddingHorizontal: 16, gap: 8 },
    filtroChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filtroChipActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    filtroChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    filtroChipTextActive: { color: '#2563EB' },
    listContainer: { padding: 16, paddingBottom: 28 },
    incidenciaCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    incidenciaCardVencida: { borderColor: '#FECACA', backgroundColor: '#FFFDFD' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
    headerMain: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 6, lineHeight: 21 },
    metaRow: { gap: 5 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 12, color: '#64748B', flex: 1 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    badgeMuted: { backgroundColor: '#F1F5F9' },
    badgeMutedText: { color: '#475569' },
    badgeDanger: { backgroundColor: '#FEF2F2' },
    badgeDangerText: { color: '#DC2626' },
    dateText: { fontSize: 12, color: '#64748B', marginLeft: 8 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 32 },
    emptyIconContainer: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});
