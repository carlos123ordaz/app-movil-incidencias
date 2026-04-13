import { useState, useMemo, useContext, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Platform,
    Modal,
    TextInput,
    Animated,
    ScrollView,
} from 'react-native';
import {
    Text,
    ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainContext } from '../../contexts/MainContextApp';
import type { IMainContext, IExpense } from '../../types';
import { listExpensesByTask, deleteExpense } from '../../services/Gastos';
import { getLastTasks } from '../../services/BitrixTasks';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistorialScreen() {
    const navigation = useNavigation<any>();
    const { taskId, setTaskId, userData } = useContext(MainContext) as IMainContext;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [dateFilter, setDateFilter] = useState('Todas');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [amountFilter, setAmountFilter] = useState('Todos');
    const [expenses, setExpenses] = useState<IExpense[] | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [bitrixTasks, setBitrixTasks] = useState<any[]>([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<IExpense | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const filtersHeight = useRef(new Animated.Value(0)).current;
    const filtersOpacity = useRef(new Animated.Value(0)).current;
    const hasActiveFilters =
        dateFilter !== 'Todas' || categoryFilter !== 'Todas' || amountFilter !== 'Todos';

    useEffect(() => {
        Animated.parallel([
            Animated.timing(filtersHeight, {
                toValue: searchFocused || hasActiveFilters ? 52 : 0,
                duration: 250,
                useNativeDriver: false,
            }),
            Animated.timing(filtersOpacity, {
                toValue: searchFocused || hasActiveFilters ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    }, [searchFocused, hasActiveFilters]);

    // ── Data loading ──
    const getGastos = async (customTaskId?: string) => {
        try {
            setIsLoading(true);
            const idToUse = customTaskId || taskId;
            const response = await listExpensesByTask(idToUse);
            console.log('Gastos obtenidos:', response.data);
            setExpenses(response.data);
            setIsRefreshing(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron cargar los gastos');
            setIsRefreshing(false);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        getGastos();
    };

    useEffect(() => {
        if (!taskId) {
            setIsLoading(false);
            handleOpenTaskModal();
        }
    }, [taskId]);

    useFocusEffect(
        useCallback(() => {
            if (taskId) {
                getGastos();
            }
        }, [taskId])
    );

    const handleOpenTaskModal = async () => {
        setShowTaskModal(true);
        setBitrixTasks([]);
        setIsLoadingTasks(true);
        try {
            const result = await getLastTasks();
            setBitrixTasks((result as any).tasks || []);
        } catch (error) {
            console.error('Error al obtener tareas:', error);
            Alert.alert('Error', 'No se pudieron cargar las tareas desde Bitrix24');
        } finally {
            setIsLoadingTasks(false);
        }
    };

    const handleSelectTask = async (task) => {
        try {
            await AsyncStorage.setItem('taskId', task.id);
            setTaskId(task.id);
            setShowTaskModal(false);
            await getGastos(task.id);
        } catch (error) {
            console.error('Error al guardar tarea:', error);
            Alert.alert('Error', 'No se pudo asignar la tarea');
        }
    };

    const dateOptions = [
        { label: 'Todas', value: 'Todas' },
        { label: 'Hoy', value: 'Hoy' },
        { label: 'Ayer', value: 'Ayer' },
        { label: 'Esta semana', value: 'Semana' },
        { label: 'Este mes', value: 'Mes' },
    ];

    const categoryOptions = [
        { label: 'Todas', value: 'Todas' },
        { label: 'Alimentacion', value: 'Alimentacion' },
        { label: 'Transporte', value: 'Transporte' },
        { label: 'Hospedaje', value: 'Hospedaje' },
    ];

    const amountOptions = [
        { label: 'Todos', value: 'Todos' },
        { label: 'Menor a $100', value: '<100' },
        { label: '$100 - $500', value: '100-500' },
        { label: 'Mayor a $500', value: '>500' },
    ];

    const formatRelativeDate = (createdAt) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const dateString = new Date(createdAt).toDateString();
        if (dateString === today.toDateString()) return 'Hoy';
        if (dateString === yesterday.toDateString()) return 'Ayer';
        return new Date(createdAt).toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'long',
        });
    };

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        let filtered = expenses.filter((expense) => {
            const matchSearch =
                expense.ruc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expense.total.toString().includes(searchQuery);
            const matchCategory =
                categoryFilter === 'Todas' || expense.category === categoryFilter;

            let matchAmount = true;
            if (amountFilter === '<100') matchAmount = expense.total < 100;
            else if (amountFilter === '100-500')
                matchAmount = expense.total >= 100 && expense.total <= 500;
            else if (amountFilter === '>500') matchAmount = expense.total > 500;

            let matchDate = true;
            if (dateFilter === 'Hoy') {
                matchDate = new Date(expense.createdAt).toDateString() === new Date().toDateString();
            } else if (dateFilter === 'Ayer') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                matchDate = new Date(expense.createdAt).toDateString() === yesterday.toDateString();
            }
            return matchSearch && matchCategory && matchAmount && matchDate;
        });

        const grouped = {};
        filtered.forEach((expense) => {
            const dateKey = formatRelativeDate(expense.createdAt);
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(expense);
        });
        return Object.entries(grouped).map(([createdAt, expenses]) => ({
            createdAt,
            expenses,
        }));
    }, [expenses, searchQuery, dateFilter, categoryFilter, amountFilter]);

    const getInfoCategoria = {
        Movilidad: { name: 'car', color: '#60A5FA', bg: '#EFF6FF', text: 'Movilidad' },
        Hospedaje: { name: 'bed', color: '#A78BFA', bg: '#F5F3FF', text: 'Hospedaje' },
        Alimentacion: { name: 'restaurant', color: '#F87171', bg: '#FEF2F2', text: 'Alimentación' },
        transporte_aereo: { name: 'airplane', color: '#38BDF8', bg: '#F0F9FF', text: 'Transporte Aéreo' },
        transporte_terrestre: { name: 'bus', color: '#34D399', bg: '#ECFDF5', text: 'Transporte Terrestre' },
        alquiler_vehiculo: { name: 'car-sport', color: '#FB923C', bg: '#FFF7ED', text: 'Alquiler de Vehículo' },
        alquiler_herramientas: { name: 'hammer', color: '#A3A3A3', bg: '#F5F5F5', text: 'Alquiler de Herramientas' },
        materiales: { name: 'cube', color: '#FBBF24', bg: '#FFFBEB', text: 'Materiales' },
        epps: { name: 'shield-checkmark', color: '#2DD4BF', bg: '#F0FDFA', text: 'EPPs' },
        otros: { name: 'ellipsis-horizontal', color: '#9CA3AF', bg: '#F9FAFB', text: 'Otros' },
    };

    const getFilterLabel = (type) => {
        if (type === 'fecha') return dateFilter === 'Todas' ? 'Fecha' : dateFilter;
        if (type === 'categoria') return categoryFilter === 'Todas' ? 'Categoría' : categoryFilter;
        if (type === 'monto') return amountFilter === 'Todos' ? 'Monto' : amountFilter;
        return '';
    };

    const isFilterActive = (type) => {
        if (type === 'fecha') return dateFilter !== 'Todas';
        if (type === 'categoria') return categoryFilter !== 'Todas';
        if (type === 'monto') return amountFilter !== 'Todos';
        return false;
    };

    const handleFilterSelect = (type, value) => {
        if (type === 'fecha') setDateFilter(value);
        else if (type === 'categoria') setCategoryFilter(value);
        else if (type === 'monto') setAmountFilter(value);
        setActiveFilter(null);
    };

    const getFilterOptions = (type) => {
        if (type === 'fecha') return dateOptions;
        if (type === 'categoria') return categoryOptions;
        if (type === 'monto') return amountOptions;
        return [];
    };

    const getFilterCurrentValue = (type) => {
        if (type === 'fecha') return dateFilter;
        if (type === 'categoria') return categoryFilter;
        if (type === 'monto') return amountFilter;
        return '';
    };

    const clearFilters = () => {
        setDateFilter('Todas');
        setCategoryFilter('Todas');
        setAmountFilter('Todos');
        setSearchQuery('');
    };

    const getStatusInfo = (status) => {
        const map = {
            '2': { label: 'En espera', color: '#F59E0B', bg: '#FFFBEB' },
            '3': { label: 'En curso', color: '#3B82F6', bg: '#EFF6FF' },
            '4': { label: 'Pendiente', color: '#F97316', bg: '#FFF7ED' },
            '5': { label: 'Completada', color: '#10B981', bg: '#ECFDF5' },
            '6': { label: 'Aplazada', color: '#8B5CF6', bg: '#F5F3FF' },
        };
        return map[status] || { label: 'Desconocido', color: '#9CA3AF', bg: '#F9FAFB' };
    };
    const handleDeleteExpense = async () => {
        if (!expenseToDelete) return;
        try {
            setIsDeleting(true);
            await deleteExpense(expenseToDelete.expenseId);
            setExpenses((prev) => prev.filter((g) => g.expenseId !== expenseToDelete.expenseId));
            setExpenseToDelete(null);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar el gasto');
        } finally {
            setIsDeleting(false);
        }
    };
    const renderGastoItem = (item) => {
        const cat = getInfoCategoria[item.category] || getInfoCategoria.otros;
        return (
            <TouchableOpacity
                key={item.expenseId}
                style={styles.gastoItem}
                onPress={() => navigation.navigate('detalle', { id: item.expenseId })}
                onLongPress={() => setExpenseToDelete(item)}
                delayLongPress={500}
                activeOpacity={0.55}
            >
                <View style={[styles.gastoIcon, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.name} size={18} color={cat.color} />
                </View>
                <View style={styles.gastoInfo}>
                    <Text style={styles.gastoComercio} numberOfLines={1}>
                        {item.descrip}
                    </Text>
                    <Text style={styles.gastoCategoria}>{cat.text}</Text>
                </View>
                <View style={styles.gastoMonto}>
                    <Text style={styles.gastoPrice}>
                        {item.currencyCode === 'USD' ? '$' : 'S/'}{' '}
                        {item.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.gastoHora}>
                        {moment(item.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSection = ({ item }) => (
        <View style={styles.sectionGroup}>
            <Text style={styles.sectionDate}>{item.createdAt}</Text>
            {item.expenses.map((expense) => renderGastoItem(expense))}
        </View>
    );
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Cargando gastos...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.taskSelector}
                        onPress={handleOpenTaskModal}
                        activeOpacity={0.6}
                    >
                        <View style={styles.taskIconCircle}>
                            <Ionicons name="briefcase" size={16} color="#4F46E5" />
                        </View>
                        <View style={styles.taskTextContainer}>
                            <Text style={styles.taskLabel}>Tarea asignada</Text>
                            <Text style={styles.taskValue} numberOfLines={1}>
                                {taskId ? `#${taskId}` : 'Sin asignar'}
                            </Text>
                        </View>
                        <View style={styles.taskChangeBtn}>
                            <Ionicons name="swap-horizontal" size={16} color="#4F46E5" />
                            <Text style={styles.taskChangeText}>Cambiar</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── Search ── */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por comercio o monto"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => {
                                setTimeout(() => setSearchFocused(false), 150);
                            }}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── Filters (animated) ── */}
                    <Animated.View
                        style={[
                            styles.filtersRow,
                            { height: filtersHeight, opacity: filtersOpacity },
                        ]}
                    >
                        {['fecha', 'categoria', 'monto'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.filterChip,
                                    isFilterActive(type) && styles.filterChipActive,
                                ]}
                                onPress={() => setActiveFilter(type)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        isFilterActive(type) && styles.filterChipTextActive,
                                    ]}
                                >
                                    {getFilterLabel(type)}
                                </Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={14}
                                    color={isFilterActive(type) ? '#4F46E5' : '#9CA3AF'}
                                />
                            </TouchableOpacity>
                        ))}
                        {hasActiveFilters && (
                            <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                                <Ionicons name="close" size={14} color="#DC2626" />
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </View>

                {/* ── List ── */}
                <FlatList
                    data={filteredExpenses}
                    keyExtractor={(item) => item.createdAt}
                    renderItem={renderSection}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={['#4F46E5']}
                            tintColor="#4F46E5"
                        />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyCircle}>
                                <Ionicons name="receipt-outline" size={36} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No hay gastos</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery || hasActiveFilters
                                    ? 'No se encontraron gastos con los filtros aplicados'
                                    : 'Aún no has registrado ningún gasto'}
                            </Text>
                        </View>
                    )}
                />
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => {
                        if (!taskId) {
                            Alert.alert(
                                'Tarea requerida',
                                'Selecciona una tarea antes de registrar un gasto',
                                [
                                    { text: 'Cancelar', style: 'cancel' },
                                    { text: 'Seleccionar', onPress: handleOpenTaskModal },
                                ]
                            );
                            return;
                        }
                        navigation.navigate('capture-voucher');
                    }}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>

                <Modal
                    visible={activeFilter !== null}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setActiveFilter(null)}
                >
                    <TouchableOpacity
                        style={styles.overlayBackdrop}
                        activeOpacity={1}
                        onPress={() => setActiveFilter(null)}
                    >
                        <View style={styles.bottomSheet}>
                            <View style={styles.sheetHandle} />
                            <Text style={styles.sheetTitle}>
                                {activeFilter === 'fecha'
                                    ? 'Filtrar por fecha'
                                    : activeFilter === 'categoria'
                                        ? 'Filtrar por categoría'
                                        : 'Filtrar por monto'}
                            </Text>
                            {activeFilter &&
                                getFilterOptions(activeFilter).map((option) => {
                                    const isSelected = option.value === getFilterCurrentValue(activeFilter);
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.sheetOption,
                                                isSelected && styles.sheetOptionSelected,
                                            ]}
                                            onPress={() =>
                                                handleFilterSelect(activeFilter, option.value)
                                            }
                                            activeOpacity={0.6}
                                        >
                                            <Text
                                                style={[
                                                    styles.sheetOptionText,
                                                    isSelected && styles.sheetOptionTextSelected,
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                            {isSelected && (
                                                <Ionicons name="checkmark" size={18} color="#4F46E5" />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* ════════════════════════════════════════════ */}
                {/* Modal: Confirmar eliminación                 */}
                {/* ════════════════════════════════════════════ */}
                <Modal
                    visible={expenseToDelete !== null}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setExpenseToDelete(null)}
                >
                    <View style={styles.deleteOverlay}>
                        <View style={styles.deleteModal}>
                            <View style={styles.deleteIconCircle}>
                                <Ionicons name="trash-outline" size={28} color="#DC2626" />
                            </View>
                            <Text style={styles.deleteTitle}>Eliminar gasto</Text>
                            <Text style={styles.deleteSubtitle}>
                                ¿Seguro que deseas eliminar{'\n'}
                                <Text style={{ fontWeight: '700' }}>
                                    {expenseToDelete?.descrip}
                                </Text>
                                ? Esta acción no se puede deshacer.
                            </Text>
                            <View style={styles.deleteActions}>
                                <TouchableOpacity
                                    style={styles.deleteCancelBtn}
                                    onPress={() => setExpenseToDelete(null)}
                                    disabled={isDeleting}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.deleteCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteConfirmBtn}
                                    onPress={handleDeleteExpense}
                                    disabled={isDeleting}
                                    activeOpacity={0.7}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator animating size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.deleteConfirmText}>Eliminar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ════════════════════════════════════════════ */}
                {/* Modal: Task Selector                         */}
                {/* ════════════════════════════════════════════ */}
                <Modal
                    visible={showTaskModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowTaskModal(false)}
                >
                    <View style={styles.overlayBackdrop}>
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            activeOpacity={1}
                            onPress={() => setShowTaskModal(false)}
                        />
                        <View style={styles.taskSheet}>
                            <View style={styles.sheetHandle} />

                            {/* Header */}
                            <View style={styles.taskSheetHeader}>
                                <View style={styles.taskSheetIconCircle}>
                                    <Ionicons name="briefcase-outline" size={22} color="#4F46E5" />
                                </View>
                                <Text style={styles.taskSheetTitle}>Seleccionar Tarea</Text>
                                <Text style={styles.taskSheetSubtitle}>
                                    Últimas tareas de Viáticos asociadas a tu cuenta
                                </Text>
                            </View>

                            {/* Content */}
                            {isLoadingTasks ? (
                                <View style={styles.taskSheetCenter}>
                                    <ActivityIndicator animating size="small" color="#4F46E5" />
                                    <Text style={styles.taskSheetCenterText}>
                                        Buscando tareas...
                                    </Text>
                                </View>
                            ) : bitrixTasks.length === 0 ? (
                                <View style={styles.taskSheetCenter}>
                                    <View style={styles.taskSheetEmptyIcon}>
                                        <Ionicons name="search-outline" size={28} color="#D1D5DB" />
                                    </View>
                                    <Text style={styles.taskSheetEmptyTitle}>
                                        Sin tareas encontradas
                                    </Text>
                                    <Text style={styles.taskSheetCenterText}>
                                        No hay tareas de Viáticos asociadas a{'\n'}
                                        {userData?.email || 'tu correo'}
                                    </Text>
                                </View>
                            ) : (
                                <ScrollView
                                    style={styles.taskList}
                                    showsVerticalScrollIndicator={false}
                                    bounces={false}
                                >
                                    {bitrixTasks.map((task, index) => {
                                        const isSelected = taskId === task.id;
                                        const status = getStatusInfo(task.status);
                                        return (
                                            <TouchableOpacity
                                                key={task.id}
                                                style={[
                                                    styles.taskCard,
                                                    isSelected && styles.taskCardSelected,
                                                    index === bitrixTasks.length - 1 && { marginBottom: 4 },
                                                ]}
                                                onPress={() => handleSelectTask(task)}
                                                activeOpacity={0.55}
                                            >
                                                {/* Left indicator */}
                                                <View
                                                    style={[
                                                        styles.taskCardIndicator,
                                                        { backgroundColor: isSelected ? '#4F46E5' : '#E5E7EB' },
                                                    ]}
                                                />

                                                <View style={styles.taskCardBody}>
                                                    {/* Top row: ID + Status */}
                                                    <View style={styles.taskCardTopRow}>
                                                        <Text style={styles.taskCardId}>#{task.id}</Text>
                                                        <View style={[styles.taskStatusBadge, { backgroundColor: status.bg }]}>
                                                            <View style={[styles.taskStatusDot, { backgroundColor: status.color }]} />
                                                            <Text style={[styles.taskStatusText, { color: status.color }]}>
                                                                {status.label}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Title */}
                                                    <Text
                                                        style={[
                                                            styles.taskCardTitle,
                                                            isSelected && styles.taskCardTitleSelected,
                                                        ]}
                                                        numberOfLines={2}
                                                    >
                                                        {task.title}
                                                    </Text>

                                                    {/* Bottom row: Creator + Date */}
                                                    <View style={styles.taskCardBottomRow}>
                                                        <View style={styles.taskCardMeta}>
                                                            <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                                                            <Text style={styles.taskCardMetaText}>
                                                                {task.creator?.name || 'Sin creador'}
                                                            </Text>
                                                        </View>
                                                        {task.createdDate && (
                                                            <View style={styles.taskCardMeta}>
                                                                <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                                                                <Text style={styles.taskCardMetaText}>
                                                                    {moment(task.createdDate).format('DD/MM/YYYY')}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* Check */}
                                                {isSelected && (
                                                    <View style={styles.taskCardCheck}>
                                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}

                            {/* Close button */}
                            <View style={styles.taskSheetActions}>
                                <TouchableOpacity
                                    style={styles.taskSheetCloseBtn}
                                    onPress={() => setShowTaskModal(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.taskSheetCloseText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════
// ── Styles ──
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        gap: 14,
    },
    loadingText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },

    /* ═══════════════════════════ */
    /* Header - Task selector      */
    /* ═══════════════════════════ */
    header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    taskSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F7FF',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#EDE9FE',
    },
    taskIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#EDE9FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    taskLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 1,
    },
    taskValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '700',
    },
    taskChangeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
    },
    taskChangeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },

    /* ═══════════════════════════ */
    /* Search                      */
    /* ═══════════════════════════ */
    searchSection: {
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },

    /* ═══════════════════════════ */
    /* Filters                     */
    /* ═══════════════════════════ */
    filtersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
        paddingTop: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    filterChipActive: {
        borderColor: '#C7D2FE',
        backgroundColor: '#EEF2FF',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    filterChipTextActive: {
        color: '#4F46E5',
    },
    clearBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* ═══════════════════════════ */
    /* List                        */
    /* ═══════════════════════════ */
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 100,
    },
    sectionGroup: {
        marginBottom: 20,
    },
    sectionDate: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 10,
        marginTop: 8,
    },
    gastoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    gastoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    gastoInfo: {
        flex: 1,
    },
    gastoComercio: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    gastoCategoria: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    gastoMonto: {
        alignItems: 'flex-end',
    },
    gastoPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    gastoHora: {
        fontSize: 11,
        color: '#D1D5DB',
    },

    /* ═══════════════════════════ */
    /* Empty state                 */
    /* ═══════════════════════════ */
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: 40,
    },

    /* ═══════════════════════════ */
    /* FAB                         */
    /* ═══════════════════════════ */
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 0,
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },

    /* ═══════════════════════════ */
    /* Shared overlay / sheet      */
    /* ═══════════════════════════ */
    overlayBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 18,
    },

    /* ═══════════════════════════ */
    /* Filter bottom sheet         */
    /* ═══════════════════════════ */
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 14,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    sheetOptionSelected: {
        backgroundColor: '#F5F3FF',
        marginHorizontal: -4,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderBottomWidth: 0,
    },
    sheetOptionText: {
        fontSize: 15,
        color: '#374151',
    },
    sheetOptionTextSelected: {
        color: '#4F46E5',
        fontWeight: '600',
    },

    /* ═══════════════════════════ */
    /* Task selector sheet         */
    /* ═══════════════════════════ */
    taskSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 20,
        maxHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 20 : 46,
    },
    taskSheetHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    taskSheetIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    taskSheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    taskSheetSubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
    },

    /* Center states (loading / empty) */
    taskSheetCenter: {
        alignItems: 'center',
        paddingVertical: 36,
        gap: 10,
    },
    taskSheetCenterText: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 19,
    },
    taskSheetEmptyIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    taskSheetEmptyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },

    /* Task list */
    taskList: {
        maxHeight: 340,
        marginBottom: 16,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    taskCardSelected: {
        borderColor: '#C7D2FE',
        backgroundColor: '#FAFAFF',
    },
    taskCardIndicator: {
        width: 4,
        alignSelf: 'stretch',
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    taskCardBody: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    taskCardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    taskCardId: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    taskStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    taskStatusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    taskStatusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    taskCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        lineHeight: 20,
        marginBottom: 8,
    },
    taskCardTitleSelected: {
        color: '#4338CA',
    },
    taskCardBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    taskCardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    taskCardMetaText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    taskCardCheck: {
        paddingRight: 14,
    },

    /* Actions */
    taskSheetActions: {
        paddingTop: 4,
    },
    taskSheetCloseBtn: {
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    taskSheetCloseText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },

    /* ═══════════════════════════ */
    /* Delete confirmation modal   */
    /* ═══════════════════════════ */
    deleteOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    deleteModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 28,
        width: '100%',
        alignItems: 'center',
    },
    deleteIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    deleteSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    deleteActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    deleteCancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    deleteCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    deleteConfirmBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteConfirmText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
});