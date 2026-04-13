import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { MainContext } from '../../contexts/MainContextApp';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createExpense } from '../../services/Gastos';
import type { IMainContext, IExpenseFormData, IExpense, IExpenseItem } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

const CustomSelect = ({ icon, label, value, options, onSelect, placeholder }: { icon: string; label: string; value: string; options: Array<{ key: string; value: string }>; onSelect: (val: string) => void; placeholder: string }) => {
    const [showMenu, setShowMenu] = useState(false);
    const displayValue = options.find(opt => opt.key === value || opt.value === value);

    return (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowMenu(!showMenu)}
                activeOpacity={0.7}
            >
                <View style={styles.inputIconContainer}>
                    <Ionicons name={icon} size={20} color={value ? '#3B82F6' : '#9CA3AF'} />
                </View>
                <Text style={[
                    styles.selectInputText,
                    !value && styles.selectInputPlaceholder
                ]}>
                    {displayValue ? displayValue.value : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {showMenu && (
                <View style={styles.dropdown}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.dropdownItem,
                                    index === options.length - 1 && styles.dropdownItemLast
                                ]}
                                onPress={() => {
                                    onSelect(option.key || option.value);
                                    setShowMenu(false);
                                }}
                            >
                                <Text style={styles.dropdownItemText}>{option.value}</Text>
                                {(value === option.key || value === option.value) && (
                                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const CustomTextInput = ({ icon, label, value, onChangeText, placeholder, keyboardType, maxLength, multiline, numberOfLines, required }: { icon: string; label: string; value: string; onChangeText: (text: string) => void; placeholder: string; keyboardType?: any; maxLength?: number; multiline?: boolean; numberOfLines?: number; required?: boolean }) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.label}>
            {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={[
            styles.textInputContainer,
            multiline && { alignItems: 'flex-start' as const }
        ]}>
            <View style={styles.inputIconContainer}>
                <Ionicons name={icon} size={20} color={value ? '#3B82F6' : '#9CA3AF'} />
            </View>
            <TextInput
                style={[
                    styles.textInput,
                    multiline && { height: (numberOfLines || 1) * 24, textAlignVertical: 'top' as const }
                ]}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={numberOfLines}
            />
        </View>
    </View>
);

export default function AgregarGastoScreen() {
    const navigation = useNavigation<any>();
    const { taskId, userData } = useContext(MainContext) as IMainContext;
    const [loading, setLoading] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [extractedData, setExtractedData] = useState<IExpenseFormData>({
        type: 'viatico',
        ruc: '',
        businessName: '',
        address: '',
        expenseDate: new Date(),
        items: [],
        total: 0,
        igv: 0,
        discount: 0,
        detraction: 0,
        currencyCode: 'PEN',
        category: 'alimentacion',
        descrip: '',
        hasReceipt: true,
        receiptDetail: 'Sustento con IGV',
    });
    const [costCenterAllocations, setCostCenterAllocations] = useState<any[]>([]);
    const lastCCLoadedRef = useRef(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState<IExpenseItem>({
        descrip: '',
        unitOfMeasure: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
    });
    const [showEditTotalModal, setShowEditTotalModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [tempTotal, setTempTotal] = useState('');
    const [tempIGV, setTempIGV] = useState('');
    const [tempDiscount, setTempDiscount] = useState('');
    const [tempDetraction, setTempDetraction] = useState('');
    const route = useRoute<any>();

    useEffect(() => {
        const prefill = route.params?.prefillData;
        console.log(prefill);
        if (prefill) {
            setExtractedData(prev => ({
                ...prev,
                ...prefill,
                expenseDate: prefill.expenseDate
                    ? new Date(prefill.expenseDate)
                    : prev.expenseDate,
            }));
        }
    }, [route.params?.prefillData]);

    // Cargar el último centro de costo usado (solo al montar, sin sobrescribir si ya hay datos)
    useEffect(() => {
        if (lastCCLoadedRef.current) return;
        lastCCLoadedRef.current = true;
        AsyncStorage.getItem('lastCostCenterAllocations').then(stored => {
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setCostCenterAllocations(parsed);
                    }
                } catch (_) { }
            }
        });
    }, []);

    const viaticoCategories = [
        { key: 'Alimentacion', value: 'Alimentación' },
        { key: 'Movilidad', value: 'Movilidad' },
        { key: 'Hospedaje', value: 'Hospedaje' },
        { key: 'Otros', value: 'Otros' },
    ];
    const purchaseCategories = [
        { key: 'transporte_aereo', value: 'Transporte Aéreo' },
        { key: 'transporte_terrestre', value: 'Transporte Terrestre' },
        { key: 'alquiler_vehiculo', value: 'Alquiler de Vehículo' },
        { key: 'alquiler_herramientas', value: 'Alquiler de Herramientas' },
        { key: 'materiales', value: 'Materiales' },
        { key: 'EPPs', value: 'EPPs' },
    ];

    const monedas = [
        { key: 'PEN', value: 'PEN - Soles' },
        { key: 'USD', value: 'USD - Dólares' },
        { key: 'EUR', value: 'EUR - Euros' }
    ];

    const tipos = [
        { key: 'viatico', value: 'Viático' },
        { key: 'compra', value: 'Compra' }
    ];

    const opcionesSustento = [
        { key: 'Sustento con IGV', value: 'Sustento con IGV' },
        { key: 'Sustento sin IGV', value: 'Sustento sin IGV' },
        { key: 'Gasto Reparable', value: 'Gasto Reparable' },
        { key: 'Si', value: 'Sí' }
    ];

    const calcularTotal = useCallback(() => {
        if (!extractedData?.items || extractedData.items.length === 0) return 0;
        return extractedData.items.reduce((total, item) => total + (item.subtotal || 0), 0);
    }, [extractedData?.items]);

    useEffect(() => {
        const totalCalculado = calcularTotal();
        if (totalCalculado > 0 && totalCalculado !== extractedData.total) {
            setExtractedData(prev => ({ ...prev, total: totalCalculado }));
        }
    }, [calcularTotal, extractedData.total]);

    const formatDate = useCallback((date: Date | string | null) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }, []);

    const handleDateSelect = useCallback(() => {
        setExtractedData(prev => ({
            ...prev,
            expenseDate: tempDate,
        }));
        setShowDateModal(false);
    }, [tempDate]);

    const adjustDate = useCallback((type, increment) => {
        const newDate = new Date(tempDate);
        if (type === 'day') {
            newDate.setDate(newDate.getDate() + increment);
        } else if (type === 'month') {
            newDate.setMonth(newDate.getMonth() + increment);
        } else if (type === 'year') {
            newDate.setFullYear(newDate.getFullYear() + increment);
        }

        if (newDate <= new Date()) {
            setTempDate(newDate);
        }
    }, [tempDate]);

    const agregarItem = useCallback(() => {
        if (newItem.descrip.trim() && newItem.unitPrice && newItem.quantity) {
            const cantidad = newItem.quantity || 1;
            const precioUnitario = newItem.unitPrice || 0;

            const nuevoItem = {
                descrip: newItem.descrip.trim(),
                unitOfMeasure: newItem.unitOfMeasure?.trim() || '',
                quantity: cantidad,
                unitPrice: precioUnitario,
                subtotal: cantidad * precioUnitario,
            };

            setExtractedData(prev => ({
                ...prev,
                items: [...(prev.items || []), nuevoItem],
            }));

            setNewItem({
                descrip: '',
                unitOfMeasure: '',
                quantity: 1,
                unitPrice: 0,
                subtotal: 0,
            });
            setShowAddItemModal(false);
        } else {
            Alert.alert('Campos incompletos', 'Por favor completa todos los campos del item');
        }
    }, [newItem]);

    const eliminarItem = useCallback((index) => {
        Alert.alert(
            'Eliminar Item',
            '¿Estás seguro que quieres eliminar este item?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        setExtractedData(prev => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== index)
                        }));
                    }
                }
            ]
        );
    }, []);

    const handleCancelar = useCallback(() => {
        Alert.alert(
            'Cancelar',
            '¿Estás seguro que quieres cancelar? Se perderán los cambios.',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Sí', onPress: () => navigation.goBack() }
            ]
        );
    }, [navigation]);

    const handleGuardar = useCallback(async () => {
        if (!taskId) {
            Alert.alert('Error', 'Debe ingresar el ID de la tarea');
            return;
        }
        if (!extractedData.total || extractedData.total <= 0) {
            Alert.alert('Error', 'El total debe ser mayor a cero');
            return;
        }
        if (!extractedData.category) {
            Alert.alert('Error', 'Debe elegir una categoría');
            return;
        }
        if (!extractedData.currencyCode) {
            Alert.alert('Error', 'Seleccione una moneda');
            return;
        }
        if (!extractedData.descrip || !extractedData.descrip.trim()) {
            Alert.alert('Error', 'Agregue una descripción');
            return;
        }
        if (!costCenterAllocations || costCenterAllocations.length === 0) {
            Alert.alert('Error', 'Debe asignar al menos un centro de costo');
            return;
        }

        const totalPct = costCenterAllocations.reduce((sum, a) => sum + a.percentage, 0);
        if (totalPct !== 100) {
            Alert.alert('Error', `Los porcentajes deben sumar 100% (actual: ${totalPct}%)`);
            return;
        }
        setLoading(true);
        try {
            const expenseData: Partial<IExpense> = {
                type: extractedData.type,
                category: extractedData.category,
                ruc: (extractedData.ruc ?? '').trim() || '',
                businessName: (extractedData.businessName ?? '').trim() || '',
                address: (extractedData.address ?? '').trim() || '',
                expenseDate: new Date(extractedData.expenseDate).toISOString(),
                total: Number(extractedData.total),
                currencyCode: extractedData.currencyCode,
                igv: Number(extractedData.igv) || 0,
                discount: Number(extractedData.discount) || 0,
                detraction: Number(extractedData.detraction) || 0,
                imageUrl: extractedData.imageUrl || '',
                hasReceipt: extractedData.hasReceipt,
                receiptDetail: extractedData.receiptDetail,
                descrip: (extractedData.descrip ?? '').trim(),
                items: extractedData.items,
                taskId,
                allocations: costCenterAllocations.map(a => ({
                    costCenterId: a.costCenterId,
                    subCostCenterId: a.subCostCenterId ?? 0,
                    subSubCostCenterId: a.subSubCostCenterId ?? 0,
                    percentage: a.percentage,
                })),
            };
            console.log('Datos a enviar al crear gasto:', JSON.stringify(expenseData, null, 2));
            await createExpense(expenseData);
            // Persistir el último CC usado para el próximo registro
            await AsyncStorage.setItem(
                'lastCostCenterAllocations',
                JSON.stringify(costCenterAllocations)
            );
            Alert.alert('Éxito', 'Gasto registrado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            const serverMsg = error?.response?.data?.message
                ?? error?.response?.data
                ?? error?.message
                ?? 'Error desconocido';
            console.log('Error al guardar gasto:', JSON.stringify(error?.response?.data ?? error));
            Alert.alert('Error al guardar', String(serverMsg));
        } finally {
            setLoading(false);
        }
    }, [taskId, extractedData, userData, navigation, costCenterAllocations]);

    const handleEditTotal = useCallback(() => {
        setTempTotal(extractedData?.total?.toString() || '0');
        setTempIGV(extractedData?.igv?.toString() || '0');
        setTempDiscount(extractedData?.discount?.toString() || '0');
        setTempDetraction(extractedData?.detraction?.toString() || '0');
        setShowEditTotalModal(true);
    }, [extractedData]);

    const handleSaveTotal = useCallback(() => {
        const total = parseFloat(tempTotal) || 0;
        const igv = parseFloat(tempIGV) || 0;
        const discount = parseFloat(tempDiscount) || 0;
        const detraction = parseFloat(tempDetraction) || 0;

        setExtractedData(prev => ({
            ...prev,
            total,
            igv,
            discount,
            detraction,
        }));
        setShowEditTotalModal(false);
    }, [tempTotal, tempIGV, tempDiscount, tempDetraction]);

    const handleLongPressItem = useCallback((item, index) => {
        setEditingItem({
            ...item,
            index,
            descrip: item.descrip || '',
            quantity: item.quantity?.toString() || '1',
            unitPrice: item.unitPrice?.toString() || '0',
        });
        setShowEditItemModal(true);
    }, []);

    const handleSaveItem = useCallback(() => {
        if (!editingItem) return;

        const updatedItems = [...(extractedData.items || [])];
        const cantidad = parseFloat(editingItem.quantity) || 1;
        const precioUnitario = parseFloat(editingItem.unitPrice) || 0;
        const subtotal = cantidad * precioUnitario;

        updatedItems[editingItem.index] = {
            descrip: editingItem.descrip,
            quantity: cantidad,
            unitPrice: precioUnitario,
            subtotal: subtotal,
        };

        setExtractedData(prev => ({
            ...prev,
            items: updatedItems
        }));
        setShowEditItemModal(false);
        setEditingItem(null);
    }, [editingItem, extractedData.items]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Guardando gasto...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Sección 1: Información básica */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Información del Comprobante</Text>
                        </View>

                        <CustomSelect
                            icon="pricetag-outline"
                            label="Tipo de gasto"
                            value={extractedData.type}
                            options={tipos}
                            onSelect={(val) => setExtractedData(prev => ({ ...prev, type: val }))}
                            placeholder="Seleccionar tipo"
                        />

                        <CustomTextInput
                            icon="card-outline"
                            label="RUC"
                            value={extractedData.ruc}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, ruc: text }))}
                            placeholder="Ingresa el RUC (opcional)"
                            keyboardType="numeric"
                            maxLength={11}
                        />

                        <CustomTextInput
                            icon="business-outline"
                            label="Razón Social"
                            value={extractedData.businessName}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, businessName: text }))}
                            placeholder="Ingresa la razón social (opcional)"
                        />

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Fecha de emisión</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => {
                                    setTempDate(extractedData?.expenseDate ? new Date(extractedData.expenseDate) : new Date());
                                    setShowDateModal(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.inputIconContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.dateText}>
                                    {extractedData?.expenseDate
                                        ? moment(extractedData.expenseDate).format('DD/MM/YYYY')
                                        : 'Seleccionar fecha'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sección 2: Items */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="list" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Items del Comprobante</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => setShowAddItemModal(true)}
                            >
                                <Ionicons name="add-circle" size={24} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>

                        {extractedData.items.length > 0 ? (
                            extractedData.items.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.itemCard}
                                    onPress={() => handleLongPressItem(item, index)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.itemContent}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemDescription}>{item.descrip}</Text>
                                            {item.quantity && item.unitPrice && (
                                                <Text style={styles.itemDetails}>
                                                    {item.quantity} × S/ {item.unitPrice.toFixed(2)}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.itemRight}>
                                            <Text style={styles.itemPrice}>
                                                S/ {item.subtotal ? item.subtotal.toFixed(2) : '0.00'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => eliminarItem(index)}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyItems}>
                                <View style={styles.emptyIconContainer}>
                                    <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                                </View>
                                <Text style={styles.emptyItemsTitle}>No hay items</Text>
                                <Text style={styles.emptyItemsText}>
                                    Agrega los items del comprobante
                                </Text>
                                <TouchableOpacity
                                    style={styles.addFirstItemButton}
                                    onPress={() => setShowAddItemModal(true)}
                                >
                                    <Ionicons name="add" size={20} color="#3B82F6" />
                                    <Text style={styles.addFirstItemText}>Agregar primer ítem</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Sección 3: Resumen */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="calculator" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Resumen del Gasto</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.totalCard}
                            onPress={handleEditTotal}
                            activeOpacity={0.8}
                        >
                            <View style={styles.totalHeader}>
                                <Text style={styles.totalLabel}>Monto Total</Text>
                                <Ionicons name="create-outline" size={20} color="#6B7280" />
                            </View>
                            <Text style={styles.totalAmount}>
                                S/ {extractedData?.total ? extractedData.total.toFixed(2) : '0.00'}
                            </Text>
                            {extractedData.items.length > 0 && calcularTotal() !== extractedData.total && (
                                <View style={styles.warningBadge}>
                                    <Ionicons name="warning" size={14} color="#F59E0B" />
                                    <Text style={styles.warningText}>
                                        Total calculado: S/ {calcularTotal().toFixed(2)}
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.editHint}>Toca para editar importes</Text>
                        </TouchableOpacity>

                        {
                            extractedData.type == 'viatico' && (
                                <CustomSelect
                                    icon="apps-outline"
                                    label="Categoría"
                                    value={extractedData.category}
                                    options={viaticoCategories}
                                    onSelect={(val) => setExtractedData(prev => ({ ...prev, category: val }))}
                                    placeholder="Seleccionar categoría"
                                />
                            )
                        }
                        {
                            extractedData.type == 'compra' && (
                                <CustomSelect
                                    icon="apps-outline"
                                    label="Categoría"
                                    value={extractedData.category}
                                    options={purchaseCategories}
                                    onSelect={(val) => setExtractedData(prev => ({ ...prev, category: val }))}
                                    placeholder="Seleccionar categoría"
                                />
                            )
                        }
                        <CustomSelect
                            icon="cash-outline"
                            label="Moneda"
                            value={extractedData.currencyCode}
                            options={monedas}
                            onSelect={(val) => setExtractedData(prev => ({ ...prev, currencyCode: val }))}
                            placeholder="Seleccionar moneda"
                        />

                        <CustomTextInput
                            icon="create-outline"
                            label="Descripción general"
                            value={extractedData.descrip}
                            onChangeText={(text) => setExtractedData(prev => ({ ...prev, descrip: text }))}
                            placeholder="Describe el gasto realizado..."
                            multiline
                            numberOfLines={3}
                            required
                        />

                        <CustomSelect
                            icon="shield-checkmark-outline"
                            label="Tipo de sustento"
                            value={extractedData.receiptDetail}
                            options={opcionesSustento}
                            onSelect={(val) => {
                                const hasReceipt = val !== 'Gasto Reparable';
                                setExtractedData(prev => ({
                                    ...prev,
                                    receiptDetail: val,
                                    hasReceipt,
                                }));
                            }}
                            placeholder="Seleccionar opción"
                        />

                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>
                                Centros de Costo <Text style={styles.required}>*</Text>
                            </Text>

                            <TouchableOpacity
                                style={styles.ccAllocationButton}
                                onPress={() => {
                                    navigation.navigate('cost-center-allocation', {
                                        allocations: costCenterAllocations,
                                        onSave: (allocations) => {
                                            setCostCenterAllocations(allocations);
                                        },
                                    });
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.ccAllocationIcon}>
                                    <Ionicons
                                        name="pie-chart-outline"
                                        size={22}
                                        color={costCenterAllocations.length > 0 ? '#4F46E5' : '#9CA3AF'}
                                    />
                                </View>
                                <View style={styles.ccAllocationContent}>
                                    {costCenterAllocations.length > 0 ? (
                                        <>
                                            <Text style={styles.ccAllocationTitle}>
                                                {costCenterAllocations.length} centro{costCenterAllocations.length > 1 ? 's' : ''} asignado{costCenterAllocations.length > 1 ? 's' : ''}
                                            </Text>
                                            <Text style={styles.ccAllocationSubtitle}>
                                                {costCenterAllocations.map(a => `${a.percentage}%`).join(' · ')}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.ccAllocationPlaceholder}>
                                                Asignar centros de costo
                                            </Text>
                                            <Text style={styles.ccAllocationHint}>
                                                Toca para agregar uno o más centros de costo
                                            </Text>
                                        </>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>

                            {/* Preview de allocations */}
                            {costCenterAllocations.length > 0 && (
                                <View style={styles.ccPreviewList}>
                                    {costCenterAllocations.map((alloc, index) => (
                                        <View key={index} style={styles.ccPreviewItem}>
                                            <View style={[styles.ccPreviewDot, {
                                                backgroundColor: alloc.percentage >= 50 ? '#059669' : '#4F46E5'
                                            }]} />
                                            <Text style={styles.ccPreviewText} numberOfLines={1}>
                                                {alloc._cc1Label}
                                            </Text>
                                            <Text style={styles.ccPreviewPct}>{alloc.percentage}%</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>





                    </View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>

                {/* Botones de acción fijos */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelar}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleGuardar}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.submitButtonText}>Guardar Gasto</Text>
                    </TouchableOpacity>
                </View>

                {/* Modal: Agregar Item */}
                <Modal
                    visible={showAddItemModal}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowAddItemModal(false)}
                >
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Agregar Item</Text>
                                    <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                                        <Ionicons name="close" size={24} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalContent}>
                                    <View style={styles.modalFieldContainer}>
                                        <Text style={styles.modalLabel}>Descripción</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder="Ej: Almuerzo, Taxi, etc."
                                            placeholderTextColor="#9CA3AF"
                                            value={newItem.descrip}
                                            onChangeText={(text) => setNewItem(prev => ({ ...prev, descrip: text }))}
                                        />
                                    </View>

                                    <View style={styles.modalRow}>
                                        <View style={[styles.modalFieldContainer, { flex: 1 }]}>
                                            <Text style={styles.modalLabel}>Cantidad</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                placeholder="1"
                                                placeholderTextColor="#9CA3AF"
                                                value={newItem.quantity?.toString() ?? ''}
                                                onChangeText={(text) => setNewItem(prev => ({ ...prev, quantity: parseFloat(text) || 0 }))}
                                                keyboardType="numeric"
                                            />
                                        </View>

                                        <View style={[styles.modalFieldContainer, { flex: 1 }]}>
                                            <Text style={styles.modalLabel}>Precio Unit.</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                placeholder="0.00"
                                                placeholderTextColor="#9CA3AF"
                                                value={newItem.unitPrice?.toString() ?? ''}
                                                onChangeText={(text) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(text) || 0 }))}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.calculationPreview}>
                                        <Text style={styles.calculationLabel}>Subtotal</Text>
                                        <Text style={styles.calculationValue}>
                                            S/ {((newItem.quantity || 0) * (newItem.unitPrice || 0)).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancelButton}
                                        onPress={() => setShowAddItemModal(false)}
                                    >
                                        <Text style={styles.modalCancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalSaveButton}
                                        onPress={agregarItem}
                                    >
                                        <Text style={styles.modalSaveText}>Agregar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* Modal: Editar Totales */}
                <Modal
                    visible={showEditTotalModal}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowEditTotalModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Editar Importes</Text>
                                <TouchableOpacity onPress={() => setShowEditTotalModal(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalContent}>
                                <View style={styles.modalFieldContainer}>
                                    <Text style={styles.modalLabel}>Total</Text>
                                    <View style={styles.modalInputWithIcon}>
                                        <Ionicons name="cash-outline" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={[styles.modalInput, { paddingLeft: 8 }]}
                                            placeholder="0.00"
                                            placeholderTextColor="#9CA3AF"
                                            value={tempTotal}
                                            onChangeText={setTempTotal}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={styles.modalFieldContainer}>
                                    <Text style={styles.modalLabel}>IGV (18%)</Text>
                                    <View style={styles.modalInputWithIcon}>
                                        <Ionicons name="receipt-outline" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={[styles.modalInput, { paddingLeft: 8 }]}
                                            placeholder="0.00"
                                            placeholderTextColor="#9CA3AF"
                                            value={tempIGV}
                                            onChangeText={setTempIGV}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={styles.modalFieldContainer}>
                                    <Text style={styles.modalLabel}>Descuento</Text>
                                    <View style={styles.modalInputWithIcon}>
                                        <Ionicons name="pricetag-outline" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={[styles.modalInput, { paddingLeft: 8 }]}
                                            placeholder="0.00"
                                            placeholderTextColor="#9CA3AF"
                                            value={tempDiscount}
                                            onChangeText={setTempDiscount}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <View style={styles.modalFieldContainer}>
                                    <Text style={styles.modalLabel}>Detracción</Text>
                                    <View style={styles.modalInputWithIcon}>
                                        <Ionicons name="remove-circle-outline" size={20} color="#9CA3AF" />
                                        <TextInput
                                            style={[styles.modalInput, { paddingLeft: 8 }]}
                                            placeholder="0.00"
                                            placeholderTextColor="#9CA3AF"
                                            value={tempDetraction}
                                            onChangeText={setTempDetraction}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={() => setShowEditTotalModal(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalSaveButton}
                                    onPress={handleSaveTotal}
                                >
                                    <Text style={styles.modalSaveText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Modal: Editar Item */}
                <Modal
                    visible={showEditItemModal}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowEditItemModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Editar Item</Text>
                                <TouchableOpacity onPress={() => setShowEditItemModal(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            {editingItem && (
                                <View style={styles.modalContent}>
                                    <View style={styles.modalFieldContainer}>
                                        <Text style={styles.modalLabel}>Descripción</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder="Descripción del item"
                                            placeholderTextColor="#9CA3AF"
                                            value={editingItem.descrip}
                                            onChangeText={(text) => setEditingItem(prev => ({ ...prev, descrip: text }))}
                                        />
                                    </View>

                                    <View style={styles.modalRow}>
                                        <View style={[styles.modalFieldContainer, { flex: 1 }]}>
                                            <Text style={styles.modalLabel}>Cantidad</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                placeholder="1"
                                                placeholderTextColor="#9CA3AF"
                                                value={editingItem.quantity}
                                                onChangeText={(text) => setEditingItem(prev => ({ ...prev, quantity: text }))}
                                                keyboardType="numeric"
                                            />
                                        </View>

                                        <View style={[styles.modalFieldContainer, { flex: 1 }]}>
                                            <Text style={styles.modalLabel}>Precio Unit.</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                placeholder="0.00"
                                                placeholderTextColor="#9CA3AF"
                                                value={editingItem.unitPrice}
                                                onChangeText={(text) => setEditingItem(prev => ({ ...prev, unitPrice: text }))}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.calculationPreview}>
                                        <Text style={styles.calculationLabel}>Subtotal</Text>
                                        <Text style={styles.calculationValue}>
                                            S/ {((parseFloat(editingItem.quantity) || 0) * (parseFloat(editingItem.unitPrice) || 0)).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={() => setShowEditItemModal(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalSaveButton}
                                    onPress={handleSaveItem}
                                >
                                    <Text style={styles.modalSaveText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Modal: Selector de Fecha */}
                <Modal
                    visible={showDateModal}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowDateModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
                                <TouchableOpacity onPress={() => setShowDateModal(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateSelector}>
                                <Text style={styles.dateDisplay}>
                                    {formatDate(tempDate)}
                                </Text>

                                <View style={styles.datePickers}>
                                    <View style={styles.datePickerColumn}>
                                        <Text style={styles.datePickerLabel}>Día</Text>
                                        <View style={styles.datePickerControls}>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => adjustDate('day', -1)}
                                            >
                                                <Ionicons name="chevron-up" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                            <Text style={styles.dateValue}>
                                                {tempDate.getDate().toString().padStart(2, '0')}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => adjustDate('day', 1)}
                                            >
                                                <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.datePickerColumn}>
                                        <Text style={styles.datePickerLabel}>Mes</Text>
                                        <View style={styles.datePickerControls}>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => adjustDate('month', -1)}
                                            >
                                                <Ionicons name="chevron-up" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                            <Text style={styles.dateValue}>
                                                {(tempDate.getMonth() + 1).toString().padStart(2, '0')}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => adjustDate('month', 1)}
                                            >
                                                <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.datePickerColumn}>
                                        <Text style={styles.datePickerLabel}>Año</Text>
                                        <View style={styles.datePickerControls}>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => adjustDate('year', -1)}
                                            >
                                                <Ionicons name="chevron-up" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                            <Text style={styles.dateValue}>
                                                {tempDate.getFullYear()}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.dateButton}
                                                onPress={() => adjustDate('year', 1)}
                                            >
                                                <Ionicons name="chevron-down" size={20} color="#3B82F6" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={() => setShowDateModal(false)}
                                >
                                    <Text style={styles.modalCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalSaveButton}
                                    onPress={handleDateSelect}
                                >
                                    <Text style={styles.modalSaveText}>Seleccionar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    keyboardView: {
        flex: 1,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
    },
    helpButtonText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    progressContainer: {
        marginTop: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    progressPercentage: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3B82F6',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 3,
    },
    section: {
        backgroundColor: 'white',
        marginTop: 12,
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 8,
        flex: 1,
    },
    addButton: {
        padding: 4,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    textInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputIconContainer: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        padding: 0,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    dateText: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    selectInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    selectInputText: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    selectInputPlaceholder: {
        color: '#9CA3AF',
        fontWeight: '400',
    },
    dropdown: {
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
        maxHeight: 200,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemLast: {
        borderBottomWidth: 0,
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    itemCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemInfo: {
        flex: 1,
    },
    itemDescription: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemRight: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#059669',
    },
    deleteButton: {
        alignSelf: 'flex-start',
        padding: 8,
        marginTop: 4,
    },
    emptyItems: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyItemsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    emptyItemsText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 16,
        textAlign: 'center',
    },
    addFirstItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    addFirstItemText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    totalCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        alignItems: 'center',
    },
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#065F46',
    },
    totalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#059669',
        marginBottom: 8,
    },
    warningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 4,
    },
    warningText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
    },
    editHint: {
        fontSize: 12,
        color: '#059669',
        fontStyle: 'italic',
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    submitButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        maxHeight: screenWidth * 1.8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalContent: {
        padding: 20,
    },
    modalFieldContainer: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#111827',
    },
    modalInputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    modalRow: {
        flexDirection: 'row',
        gap: 12,
    },
    calculationPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    calculationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
    },
    calculationValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E40AF',
    },
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalSaveButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    modalSaveText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },
    dateSelector: {
        padding: 20,
        alignItems: 'center',
    },
    dateDisplay: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 24,
    },
    datePickers: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        gap: 12,
    },
    datePickerColumn: {
        flex: 1,
        alignItems: 'center',
    },
    datePickerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    datePickerControls: {
        alignItems: 'center',
    },
    dateButton: {
        padding: 8,
    },
    dateValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginVertical: 12,
        minWidth: 50,
        textAlign: 'center',
    },
    bottomSpacer: {
        height: 20,
    },
    ccAllocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    ccAllocationIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    ccAllocationContent: {
        flex: 1,
    },
    ccAllocationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    ccAllocationSubtitle: {
        fontSize: 13,
        color: '#4F46E5',
        fontWeight: '500',
        marginTop: 2,
    },
    ccAllocationPlaceholder: {
        fontSize: 15,
        color: '#9CA3AF',
    },
    ccAllocationHint: {
        fontSize: 12,
        color: '#D1D5DB',
        marginTop: 2,
    },
    ccPreviewList: {
        marginTop: 10,
        backgroundColor: '#FAFAFE',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    ccPreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    ccPreviewDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    ccPreviewText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
    },
    ccPreviewPct: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4F46E5',
        marginLeft: 8,
    },
});

