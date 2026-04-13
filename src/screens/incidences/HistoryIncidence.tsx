import { useState, useMemo, useContext, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Modal,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';
import { MainContext } from '../../contexts/MainContextApp';
import { incidenciaService } from '../../services/incidenciaService';
import { Incidencia } from '../../types';

type FilterType = 'fecha' | 'estado' | 'severidad';

interface FilterOption {
    label: string;
    value: string;
}

interface GroupedIncidencias {
    fecha: string;
    incidencias: Incidencia[];
}

moment.locale('es');

export default function HistoryIncidence() {
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const { userData } = useContext(MainContext);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filtroFecha, setFiltroFecha] = useState<string>('Todas');
    const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
    const [filtroSeveridad, setFiltroSeveridad] = useState<string>('Todos');
    const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
    const [incidencias, setIncidencias] = useState<Incidencia[] | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [incidenciasAsignadas, setIncidenciasAsignadas] = useState<number>(0);

    const hasActiveFilters = filtroFecha !== 'Todas' || filtroEstado !== 'Todos' || filtroSeveridad !== 'Todos';

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.navigate('IncidenciasAsignadas')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="clipboard-outline" size={22} color="#111827" />
                    {incidenciasAsignadas > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{incidenciasAsignadas}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ),
        });
    }, [navigation, incidenciasAsignadas]);

    const loadIncidenciasAsignadasCount = async (): Promise<void> => {
        try {
            const data = await incidenciaService.getIncidenciasAsignadas(userData!._id);
            const enRevision = data.filter((inc) => inc.estado === 'En Revisi\u00F3n').length;
            setIncidenciasAsignadas(enRevision);
        } catch (error) {
            console.error('Error al cargar conteo de asignadas:', error);
        }
    };

    const getIncidencias = async (): Promise<void> => {
        try {
            const data = await incidenciaService.getIncidenciasByUser(userData!._id);
            setIncidencias(data);
        } catch (error) {
            console.error('Error al obtener incidencias:', error);
            Alert.alert('Error', 'No se pudo cargar el historial de incidencias');
        } finally {
            setIsRefreshing(false);
        }
    };

    const onRefresh = (): void => {
        setIsRefreshing(true);
        getIncidencias();
        loadIncidenciasAsignadasCount();
    };

    useEffect(() => {
        getIncidencias();
        loadIncidenciasAsignadasCount();
    }, []);

    const opcionesFecha: FilterOption[] = [
        { label: 'Todas', value: 'Todas' },
        { label: 'Hoy', value: 'Hoy' },
        { label: 'Ayer', value: 'Ayer' },
        { label: 'Esta semana', value: 'Semana' },
        { label: 'Este mes', value: 'Mes' },
    ];

    const opcionesEstado: FilterOption[] = [
        { label: 'Todos', value: 'Todos' },
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Revisi\u00F3n', value: 'En Revisi\u00F3n' },
        { label: 'Resuelto', value: 'Resuelto' },
        { label: 'Cerrado', value: 'Cerrado' },
    ];

    const opcionesSeveridad: FilterOption[] = [
        { label: 'Todos', value: 'Todos' },
        { label: 'Bajo', value: 'Bajo' },
        { label: 'Medio', value: 'Medio' },
        { label: 'Alto', value: 'Alto' },
        { label: 'Cr\u00EDtico', value: 'Cr\u00EDtico' },
    ];

    const formatearFechaRelativa = (fecha: string): string => {
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        const fechaString = new Date(fecha).toDateString();

        if (fechaString === hoy.toDateString()) return 'Hoy';
        if (fechaString === ayer.toDateString()) return 'Ayer';

        return new Date(fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
    };

    const incidenciasFiltradas = useMemo((): GroupedIncidencias[] => {
        if (!incidencias) return [];

        const filtradas = incidencias.filter((inc) => {
            const query = searchQuery.trim().toLowerCase();
            const matchBusqueda =
                inc.tipoIncidente.toLowerCase().includes(query) ||
                inc.ubicacion.toLowerCase().includes(query) ||
                inc.descripcion.toLowerCase().includes(query) ||
                inc.areaAfectada.toLowerCase().includes(query);
            const matchEstado = filtroEstado === 'Todos' || inc.estado === filtroEstado;
            const matchSeveridad = filtroSeveridad === 'Todos' || inc.gradoSeveridad === filtroSeveridad;

            let matchFecha = true;
            if (filtroFecha === 'Hoy') {
                matchFecha = new Date(inc.fecha).toDateString() === new Date().toDateString();
            } else if (filtroFecha === 'Ayer') {
                const ayer = new Date();
                ayer.setDate(ayer.getDate() - 1);
                matchFecha = new Date(inc.fecha).toDateString() === ayer.toDateString();
            } else if (filtroFecha === 'Semana') {
                const semanaAtras = new Date();
                semanaAtras.setDate(semanaAtras.getDate() - 7);
                matchFecha = new Date(inc.fecha) >= semanaAtras;
            } else if (filtroFecha === 'Mes') {
                const mesAtras = new Date();
                mesAtras.setMonth(mesAtras.getMonth() - 1);
                matchFecha = new Date(inc.fecha) >= mesAtras;
            }

            return matchBusqueda && matchEstado && matchSeveridad && matchFecha;
        });

        const agrupadas: Record<string, Incidencia[]> = {};

        filtradas
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .forEach((inc) => {
                const key = formatearFechaRelativa(inc.fecha);
                if (!agrupadas[key]) agrupadas[key] = [];
                agrupadas[key].push(inc);
            });

        return Object.entries(agrupadas).map(([fecha, incs]) => ({ fecha, incidencias: incs }));
    }, [incidencias, searchQuery, filtroFecha, filtroEstado, filtroSeveridad]);

    const totalResultados = incidenciasFiltradas.reduce((total, grupo) => total + grupo.incidencias.length, 0);

    const getInfoEstado: Record<string, { icon: string; color: string; bg: string }> = {
        Pendiente: { icon: 'time-outline', color: '#B45309', bg: '#FEF3C7' },
        'En Revisi\u00F3n': { icon: 'eye-outline', color: '#2563EB', bg: '#DBEAFE' },
        Resuelto: { icon: 'checkmark-circle-outline', color: '#059669', bg: '#D1FAE5' },
        Cerrado: { icon: 'close-circle-outline', color: '#64748B', bg: '#E2E8F0' },
    };

    const getInfoSeveridad: Record<string, { color: string; bg: string; border: string }> = {
        Bajo: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
        Medio: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
        Alto: { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
        'Cr\u00EDtico': { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    };

    const getFilterLabel = (type: FilterType): string => {
        if (type === 'fecha') return filtroFecha === 'Todas' ? 'Fecha' : filtroFecha;
        if (type === 'estado') return filtroEstado === 'Todos' ? 'Estado' : filtroEstado;
        return filtroSeveridad === 'Todos' ? 'Severidad' : filtroSeveridad;
    };

    const isFilterActive = (type: FilterType): boolean => {
        if (type === 'fecha') return filtroFecha !== 'Todas';
        if (type === 'estado') return filtroEstado !== 'Todos';
        return filtroSeveridad !== 'Todos';
    };

    const handleFilterSelect = (type: FilterType, value: string): void => {
        if (type === 'fecha') setFiltroFecha(value);
        else if (type === 'estado') setFiltroEstado(value);
        else setFiltroSeveridad(value);

        setActiveFilter(null);
    };

    const getFilterOptions = (type: FilterType): FilterOption[] => {
        if (type === 'fecha') return opcionesFecha;
        if (type === 'estado') return opcionesEstado;
        return opcionesSeveridad;
    };

    const getFilterCurrentValue = (type: FilterType): string => {
        if (type === 'fecha') return filtroFecha;
        if (type === 'estado') return filtroEstado;
        return filtroSeveridad;
    };

    const clearFilters = (): void => {
        setFiltroFecha('Todas');
        setFiltroEstado('Todos');
        setFiltroSeveridad('Todos');
        setSearchQuery('');
    };

    const renderIncidenciaItem = (item: Incidencia) => {
        const estadoInfo = getInfoEstado[item.estado] || getInfoEstado.Pendiente;
        const severidadInfo = getInfoSeveridad[item.gradoSeveridad] || getInfoSeveridad.Bajo;

        return (
            <TouchableOpacity
                key={item._id}
                style={styles.incItem}
                onPress={() => navigation.navigate('DetalleIncidencia', { id: item._id })}
                activeOpacity={0.75}
            >
                <View style={styles.incHeader}>
                    <View style={[styles.incIcon, { backgroundColor: estadoInfo.bg }]}>
                        <Ionicons name={estadoInfo.icon as any} size={20} color={estadoInfo.color} />
                    </View>

                    <View style={styles.incInfo}>
                        <Text style={styles.incTipo} numberOfLines={1}>{item.tipoIncidente}</Text>

                        <View style={styles.incMetaRow}>
                            <View style={styles.incMetaItem}>
                                <Ionicons name="business-outline" size={13} color="#94A3B8" />
                                <Text style={styles.incMetaText} numberOfLines={1}>{item.areaAfectada}</Text>
                            </View>
                            <View style={styles.incMetaItem}>
                                <Ionicons name="location-outline" size={13} color="#94A3B8" />
                                <Text style={styles.incMetaText} numberOfLines={1}>{item.ubicacion}</Text>
                            </View>
                        </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </View>

                <Text style={styles.incDescription} numberOfLines={2}>
                    {item.descripcion}
                </Text>

                <View style={styles.incFooter}>
                    <View style={styles.incBadges}>
                        <View style={[styles.incBadge, { backgroundColor: estadoInfo.bg }]}>
                            <Text style={[styles.incBadgeText, { color: estadoInfo.color }]}>{item.estado}</Text>
                        </View>
                        <View style={[styles.incBadge, { backgroundColor: severidadInfo.bg, borderWidth: 1, borderColor: severidadInfo.border }]}>
                            <Text style={[styles.incBadgeText, { color: severidadInfo.color }]}>{item.gradoSeveridad}</Text>
                        </View>
                    </View>

                    <View style={styles.incDateCol}>
                        <Text style={styles.incDate}>{moment(item.fecha).format('DD MMM')}</Text>
                        <Text style={styles.incTime}>{moment(item.fecha).format('HH:mm')}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSection = ({ item }: { item: GroupedIncidencias }) => (
        <View style={styles.sectionGroup}>
            <Text style={styles.sectionDate}>{item.fecha}</Text>
            {item.incidencias.map((inc) => renderIncidenciaItem(inc))}
        </View>
    );

    if (!incidencias) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Cargando incidencias...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={incidenciasFiltradas}
                keyExtractor={(item) => item.fecha}
                renderItem={renderSection}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={(
                    <View style={styles.headerContent}>
                        <View style={styles.heroHeader}>
                            <Text style={styles.heroSubtitle}>
                                {totalResultados} resultados{hasActiveFilters || searchQuery ? ' con filtros aplicados' : ''}
                            </Text>
                        </View>

                        <View style={styles.searchSection}>
                            <View style={styles.searchBar}>
                                <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Buscar tipo, ubicacion, area.."
                                    placeholderTextColor="#9CA3AF"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.filtersRow}
                            >
                                {(['fecha', 'estado', 'severidad'] as FilterType[]).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.filterChip, isFilterActive(type) && styles.filterChipActive]}
                                        onPress={() => setActiveFilter(type)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.filterChipText, isFilterActive(type) && styles.filterChipTextActive]}>
                                            {getFilterLabel(type)}
                                        </Text>
                                        <Ionicons name="chevron-down" size={14} color={isFilterActive(type) ? '#2563EB' : '#9CA3AF'} />
                                    </TouchableOpacity>
                                ))}

                                {(hasActiveFilters || searchQuery.length > 0) && (
                                    <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                                        <Ionicons name="refresh-outline" size={14} color="#DC2626" />
                                        <Text style={styles.clearBtnText}>Limpiar</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>

                        <Text style={styles.resultsSubtitle}>Agrupados por fecha de incidencia</Text>
                    </View>
                )}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyCircle}>
                            <Ionicons name="alert-circle-outline" size={36} color="#D1D5DB" />
                        </View>
                        <Text style={styles.emptyTitle}>No hay incidencias</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery || hasActiveFilters
                                ? 'No se encontraron incidencias con los filtros aplicados'
                                : 'Aun no has registrado ninguna incidencia'}
                        </Text>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('agregar-incidence')} activeOpacity={0.85}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            <Modal
                visible={activeFilter !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setActiveFilter(null)}
            >
                <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setActiveFilter(null)}>
                    <View style={styles.dropdownSheet}>
                        <View style={styles.dropdownHandle} />
                        <Text style={styles.dropdownTitle}>
                            {activeFilter === 'fecha'
                                ? 'Filtrar por fecha'
                                : activeFilter === 'estado'
                                    ? 'Filtrar por estado'
                                    : 'Filtrar por severidad'}
                        </Text>

                        {activeFilter && getFilterOptions(activeFilter).map((option) => {
                            const isSelected = option.value === getFilterCurrentValue(activeFilter);

                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                                    onPress={() => handleFilterSelect(activeFilter, option.value)}
                                    activeOpacity={0.6}
                                >
                                    <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextSelected]}>
                                        {option.label}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 14, fontSize: 15, color: '#6B7280' },
    headerBtn: { marginRight: 16, position: 'relative' },
    headerBadge: {
        position: 'absolute',
        top: -6,
        right: -8,
        backgroundColor: '#DC2626',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    headerBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    headerContent: { paddingTop: 16 },
    heroHeader: {
        marginHorizontal: 20,
        marginBottom: 8,
    },
    heroSubtitle: { fontSize: 12, lineHeight: 18, color: '#64748B' },
    searchSection: { paddingHorizontal: 20, paddingBottom: 12 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: { flex: 1, fontSize: 15, color: '#111827' },
    filtersRow: { alignItems: 'center', gap: 8, paddingTop: 12, paddingRight: 4 },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
    },
    filterChipActive: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
    filterChipText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
    filterChipTextActive: { color: '#2563EB' },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        height: 34,
        borderRadius: 999,
        backgroundColor: '#FEF2F2',
    },
    clearBtnText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
    resultsSubtitle: { fontSize: 12, color: '#64748B', paddingHorizontal: 20, paddingBottom: 8 },
    listContent: { paddingBottom: 100 },
    sectionGroup: { paddingHorizontal: 20, marginBottom: 20 },
    sectionDate: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 10,
        marginTop: 8,
        paddingHorizontal: 4,
    },
    incItem: {
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    incHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    incIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    incInfo: { flex: 1, marginRight: 8 },
    incTipo: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
    incMetaRow: { gap: 5 },
    incMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    incMetaText: { fontSize: 12, color: '#64748B', flex: 1 },
    incDescription: { fontSize: 13, lineHeight: 19, color: '#475569', marginTop: 12, marginBottom: 12 },
    incFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    incBadges: { flexDirection: 'row', gap: 6, flexShrink: 1 },
    incBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    incBadgeText: { fontSize: 11, fontWeight: '600' },
    incDateCol: { alignItems: 'flex-end', marginLeft: 8 },
    incDate: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 2 },
    incTime: { fontSize: 11, color: '#94A3B8' },
    emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
    emptyCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#475569', marginBottom: 6 },
    emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19, paddingHorizontal: 20 },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
            android: { elevation: 6 },
        }),
    },
    dropdownOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    dropdownSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 20,
        marginBottom: 10,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    },
    dropdownHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 16,
    },
    dropdownTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 14 },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    dropdownOptionSelected: {
        backgroundColor: '#EFF6FF',
        marginHorizontal: -4,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderBottomWidth: 0,
    },
    dropdownOptionText: { fontSize: 15, color: '#374151' },
    dropdownOptionTextSelected: { color: '#2563EB', fontWeight: '600' },
});
