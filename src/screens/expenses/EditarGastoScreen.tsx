import { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Modal,
    TextInput,
} from 'react-native';
import {
    Text,
    ActivityIndicator,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SelectList } from 'react-native-dropdown-select-list';
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services';
import type { IExpenseFormData } from '../../types';
const { height: screenHeight } = Dimensions.get('window');

export default function EditarGastoScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { expense } = route.params || {};
    const { toastInfo, toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [extractedData, setExtractedData] = useState<IExpenseFormData>((expense || {}));
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState<{ descrip: string; quantity: string; unitPrice: string }>({
        descrip: '',
        quantity: '1',
        unitPrice: '',
    });
    const [showEditTotalModal, setShowEditTotalModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [tempTotal, setTempTotal] = useState('');
    const [tempIGV, setTempIGV] = useState('');
    const [tempDiscount, setTempDiscount] = useState('');
    const [tempDetraction, setTempDetraction] = useState('');

    const buildInitialAllocations = (exp: any) => {
        if (exp?.allocations?.length > 0) {
            return exp.allocations.map(alloc => ({
                costCenterId: alloc.costCenterId,
                subCostCenterId: alloc.subCostCenterId,
                subSubCostCenterId: alloc.subSubCostCenterId,
                percentage: alloc.percentage,
                _cc1Label: alloc._cc1Label || 'Centro de costo asignado',
            }));
        }
        return [];
    };

    const [costCenterAllocations, setCostCenterAllocations] = useState(() => buildInitialAllocations(expense));

    useEffect(() => {
        if (!expense) {
            toastError('No se encontró el gasto a editar');
            navigation.goBack();
        }
    }, [expense, navigation, toastError]);

    const viaticoCategories = [
        { key: 'alimentacion', value: 'Alimentación' },
        { key: 'movilidad', value: 'Movilidad' },
        { key: 'hospedaje', value: 'Hospedaje' },
        { key: 'otros', value: 'Otros' },
    ];
    const purchaseCategories = [
        { key: 'transporte_aereo', value: 'Transporte Aéreo' },
        { key: 'transporte_terrestre', value: 'Transporte Terrestre' },
        { key: 'alquiler_vehiculo', value: 'Alquiler de Vehículo' },
        { key: 'alquiler_herramientas', value: 'Alquiler de Herramientas' },
        { key: 'materiales', value: 'Materiales' },
        { key: 'epps', value: 'EPPs' },
        { key: 'otros', value: 'Otros' },
    ]

    const monedas = [
        { key: 'PEN', value: 'PEN' },
        { key: 'USD', value: 'USD' },
        { key: 'EUR', value: 'EUR' },
    ];

    const tipos = [
        { key: 'compra', value: 'Compra' },
        { key: 'viatico', value: 'Viático' },
    ];

    const opcionesSustento = [
        { key: 'Sustento con IGV', value: 'Sustento con IGV' },
        { key: 'Sustento sin IGV', value: 'Sustento sin IGV' },
        { key: 'Gasto Reparable', value: 'Gasto Reparable' },
        { key: 'RxH', value: 'RxH' },
    ];

    const formatDate = (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleDateSelect = () => {
        setExtractedData({ ...extractedData, expenseDate: tempDate });
        setShowDateModal(false);
    };

    const adjustDate = (type, increment) => {
        const newDate = new Date(tempDate);
        if (type === 'day') newDate.setDate(newDate.getDate() + increment);
        else if (type === 'month') newDate.setMonth(newDate.getMonth() + increment);
        else if (type === 'year') newDate.setFullYear(newDate.getFullYear() + increment);
        if (newDate <= new Date()) setTempDate(newDate);
    };

    const agregarItem = () => {
        if (
            newItem.descrip.trim() &&
            newItem.unitPrice.toString().trim() &&
            newItem.quantity.trim()
        ) {
            const cantidad = parseFloat(newItem.quantity) || 1;
            const precioUnitario = parseFloat(newItem.unitPrice) || 0;
            const nuevoItem = {
                descrip: newItem.descrip.trim(),
                quantity: cantidad,
                unitPrice: precioUnitario,
                subtotal: cantidad * precioUnitario,
            };
            setExtractedData({
                ...extractedData,
                items: [...(extractedData.items || []), nuevoItem],
            });
            setNewItem({ descrip: '', quantity: '1', unitPrice: '' });
            setShowAddItemModal(false);
        } else {
            toastInfo('Por favor completa todos los campos del item');
        }
    };

    const eliminarItem = (index) => {
        Alert.alert('Eliminar Item', '¿Estás seguro que quieres eliminar este item?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                    const nuevosItems = extractedData.items.filter((_, i) => i !== index);
                    setExtractedData({ ...extractedData, items: nuevosItems });
                },
            },
        ]);
    };

    const handleCancelar = () => {
        Alert.alert(
            'Cancelar',
            '¿Estás seguro que quieres cancelar? Se perderán los cambios.',
            [
                { text: 'No', style: 'cancel' },
                { text: 'Sí', onPress: () => navigation.goBack() },
            ]
        );
    };

    const handleGuardar = async () => {
        if (!extractedData?.total || extractedData.total <= 0) {
            toastInfo('El total debe ser mayor a 0');
            return;
        }
        if (!costCenterAllocations || costCenterAllocations.length === 0) {
            toastInfo('Debe asignar al menos un centro de costo');
            return;
        }
        const totalPct = costCenterAllocations.reduce((sum, a) => sum + a.percentage, 0);
        if (totalPct !== 100) {
            toastInfo(`Los porcentajes deben sumar 100% (actual: ${totalPct}%)`);
            return;
        }
        try {
            setLoading(true);
            const updatedExpense = {
                ...extractedData,
                expenseDate: moment(extractedData.expenseDate || new Date()).format('YYYY-MM-DD HH:mm:ss'),
                allocations: costCenterAllocations,
            };
            const id = (expense as any)._id || expense.expenseId;
            const response = await api.put(`/api/expenses/${id}`, updatedExpense);
            if (response.data.ok) {
                toastInfo('Gasto actualizado correctamente');
                navigation.navigate('HomeTabs', { screen: 'Gastos' });
            }
        } catch (error) {
            console.error('Error al actualizar gasto:', JSON.stringify(error));
            toastError(
                (error as any).response?.data?.error ||
                'No se pudo actualizar el gasto. Intenta nuevamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEditTotal = () => {
        setTempTotal(extractedData?.total?.toString() || '0');
        setTempIGV(extractedData?.igv?.toString() || '0');
        setTempDiscount(extractedData?.discount?.toString() || '0');
        setTempDetraction(extractedData?.detraction?.toString() || '0');
        setShowEditTotalModal(true);
    };

    const handleSaveTotal = () => {
        setExtractedData({
            ...extractedData,
            total: parseFloat(tempTotal) || 0,
            igv: parseFloat(tempIGV) || 0,
            discount: parseFloat(tempDiscount) || 0,
            detraction: parseFloat(tempDetraction) || 0,
        });
        setShowEditTotalModal(false);
    };

    const handleLongPressItem = (item, index) => {
        setEditingItem({
            ...item,
            index,
            descrip: item.descrip || '',
            quantity: item.quantity?.toString() || '1',
            unitPrice: item.unitPrice?.toString() || '0',
        });
        setShowEditItemModal(true);
    };

    const handleSaveItem = () => {
        if (!editingItem) return;
        const updatedItems = [...(extractedData.items || [])];
        const cantidad = editingItem.quantity || 1;
        const precioUnitario = editingItem.unitPrice || 0;
        updatedItems[editingItem.index] = {
            descrip: editingItem.descrip,
            quantity: cantidad,
            unitPrice: precioUnitario,
            subtotal: cantidad * precioUnitario,
        };
        setExtractedData({ ...extractedData, items: updatedItems });
        setShowEditItemModal(false);
        setEditingItem(null);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Guardando cambios...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Detalles del comprobante ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="receipt-outline" size={18} color="#374151" />
                            <Text style={styles.sectionTitle}>Detalles del comprobante</Text>
                        </View>

                        <FieldGroup label="Tipo">
                            <SelectList
                                setSelected={(val) =>
                                    setExtractedData({ ...extractedData, type: val })
                                }
                                data={tipos}
                                save="key"
                                defaultOption={tipos.find((t) => t.key === extractedData?.type)}
                                placeholder="Seleccionar tipo"
                                search={false}
                                boxStyles={styles.selectBox}
                                inputStyles={styles.selectInput}
                                dropdownStyles={styles.selectDropdown}
                            />
                        </FieldGroup>

                        <FieldGroup label="RUC">
                            <TextInput
                                style={styles.input}
                                value={extractedData?.ruc || ''}
                                onChangeText={(text) =>
                                    setExtractedData({ ...extractedData, ruc: text })
                                }
                                placeholder="Ingresa el RUC"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                maxLength={11}
                            />
                        </FieldGroup>

                        <FieldGroup label="Razón social">
                            <TextInput
                                style={styles.input}
                                value={extractedData?.businessName || ''}
                                onChangeText={(text) =>
                                    setExtractedData({ ...extractedData, businessName: text })
                                }
                                placeholder="Ingresa la razón social"
                                placeholderTextColor="#9CA3AF"
                            />
                        </FieldGroup>

                        <FieldGroup label="Dirección">
                            <TextInput
                                style={styles.input}
                                value={extractedData?.address || ''}
                                onChangeText={(text) =>
                                    setExtractedData({ ...extractedData, address: text })
                                }
                                placeholder="Dirección del establecimiento"
                                placeholderTextColor="#9CA3AF"
                            />
                        </FieldGroup>

                        <FieldGroup label="Fecha de emisión">
                            <TouchableOpacity
                                style={styles.dateBtn}
                                onPress={() => {
                                    setTempDate(
                                        extractedData?.expenseDate
                                            ? new Date(extractedData.expenseDate)
                                            : new Date()
                                    );
                                    setShowDateModal(true);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.dateBtnText}>
                                    {extractedData?.expenseDate
                                        ? moment(extractedData.expenseDate).format('DD/MM/YYYY')
                                        : 'Seleccionar fecha'}
                                </Text>
                                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        </FieldGroup>
                    </View>

                    <View style={styles.divider} />

                    {/* ── Items del comprobante ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="list-outline" size={18} color="#374151" />
                            <Text style={styles.sectionTitle}>Items del comprobante</Text>
                            <TouchableOpacity
                                style={styles.addChip}
                                onPress={() => setShowAddItemModal(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="add" size={16} color="#4F46E5" />
                                <Text style={styles.addChipText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {extractedData?.items && extractedData.items.length > 0 ? (
                            <View style={styles.itemsList}>
                                {extractedData.items.map((item, index) => (
                                    <View key={index}>
                                        {index > 0 && <View style={styles.itemSeparator} />}
                                        <TouchableOpacity
                                            style={styles.itemRow}
                                            onPress={() => handleLongPressItem(item, index)}
                                            activeOpacity={0.6}
                                        >
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemDesc}>
                                                    {item.descrip}
                                                </Text>
                                                {item.quantity && item.unitPrice && (
                                                    <Text style={styles.itemQty}>
                                                        {item.quantity} ×{' S/'}
                                                        {item.unitPrice.toFixed(2)}
                                                    </Text>
                                                )}
                                            </View>
                                            <Text style={styles.itemPrice}>
                                                S/{' '}
                                                {item.subtotal
                                                    ? item.subtotal.toFixed(2)
                                                    : '0.00'}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => eliminarItem(index)}
                                                hitSlop={{
                                                    top: 8,
                                                    bottom: 8,
                                                    left: 8,
                                                    right: 8,
                                                }}
                                                style={styles.deleteItemBtn}
                                            >
                                                <Ionicons
                                                    name="trash-outline"
                                                    size={16}
                                                    color="#EF4444"
                                                />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyItems}>
                                <View style={styles.emptyCircle}>
                                    <Ionicons
                                        name="receipt-outline"
                                        size={32}
                                        color="#D1D5DB"
                                    />
                                </View>
                                <Text style={styles.emptyTitle}>No hay items agregados</Text>
                                <TouchableOpacity
                                    style={styles.emptyAddBtn}
                                    onPress={() => setShowAddItemModal(true)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add" size={16} color="#4F46E5" />
                                    <Text style={styles.emptyAddBtnText}>
                                        Agregar primer ítem
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* ── Resumen del gasto ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="calculator-outline" size={18} color="#374151" />
                            <Text style={styles.sectionTitle}>Resumen del Gasto</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.totalCard}
                            onPress={handleEditTotal}
                            activeOpacity={0.7}
                        >
                            <View style={styles.totalCardTop}>
                                <Text style={styles.totalCardLabel}>Monto Total</Text>
                                <Ionicons name="create-outline" size={16} color="#9CA3AF" />
                            </View>
                            <Text style={styles.totalCardAmount}>
                                S/{' '}
                                {extractedData?.total
                                    ? extractedData.total.toFixed(2)
                                    : '0.00'}
                            </Text>
                            <Text style={styles.totalCardHint}>Toca para editar importes</Text>
                        </TouchableOpacity>

                        {
                            extractedData.type === 'viatico' ? (
                                <FieldGroup label="Categoría">
                                    <SelectList
                                        setSelected={(val) =>
                                            setExtractedData({ ...extractedData, category: val })
                                        }
                                        data={viaticoCategories}
                                        save="key"
                                        defaultOption={viaticoCategories.find(
                                            (c) => c.key === extractedData?.category
                                        )}
                                        placeholder="Seleccionar categoría"
                                        search={false}
                                        boxStyles={styles.selectBox}
                                        inputStyles={styles.selectInput}
                                        dropdownStyles={styles.selectDropdown}
                                    />
                                </FieldGroup>
                            ) : (
                                <FieldGroup label="Categoría">
                                    <SelectList
                                        setSelected={(val) =>
                                            setExtractedData({ ...extractedData, category: val })
                                        }
                                        data={purchaseCategories}
                                        save="key"
                                        defaultOption={purchaseCategories.find(
                                            (c) => c.key === extractedData?.category
                                        )}
                                        placeholder="Seleccionar categoría"
                                        search={false}
                                        boxStyles={styles.selectBox}
                                        inputStyles={styles.selectInput}
                                        dropdownStyles={styles.selectDropdown}
                                    />
                                </FieldGroup>
                            )
                        }

                        <FieldGroup label="Moneda">
                            <SelectList
                                setSelected={(val) =>
                                    setExtractedData({ ...extractedData, currencyCode: val })
                                }
                                data={monedas}
                                save="key"
                                defaultOption={monedas.find(
                                    (m) => m.key === extractedData?.currencyCode
                                )}
                                placeholder="Seleccionar moneda"
                                search={false}
                                boxStyles={styles.selectBox}
                                inputStyles={styles.selectInput}
                                dropdownStyles={styles.selectDropdown}
                            />
                        </FieldGroup>

                        <FieldGroup label="Descripción general">
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={extractedData?.descrip || ''}
                                onChangeText={(text) =>
                                    setExtractedData({ ...extractedData, descrip: text })
                                }
                                placeholder="Agregar una descripción"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </FieldGroup>

                        <FieldGroup label="¿Sustento?">
                            <SelectList
                                setSelected={(val) => {
                                    const hasReceipt = val !== 'Gasto Reparable';
                                    setExtractedData({
                                        ...extractedData,
                                        receiptDetail: val,
                                        hasReceipt,
                                    });
                                }}
                                data={opcionesSustento}
                                save="value"
                                defaultOption={opcionesSustento.find(
                                    (s) => s.value === extractedData?.receiptDetail
                                )}
                                placeholder="Seleccionar opción"
                                search={false}
                                boxStyles={styles.selectBox}
                                inputStyles={styles.selectInput}
                                dropdownStyles={styles.selectDropdown}
                            />
                        </FieldGroup>
                        {/* ✅ CENTROS DE COSTO */}
                        <View style={styles.divider} />

                        <View style={[styles.sectionHeader, { marginTop: 16, marginBottom: 12 }]}>
                            <Ionicons name="briefcase-outline" size={18} color="#374151" />
                            <Text style={styles.sectionTitle}>Centros de Costo</Text>
                        </View>

                        <View style={styles.ccFieldContainer}>
                            <Text style={styles.ccFieldLabel}>
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

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── Botones de acción fijos ── */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancelar}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                        onPress={handleGuardar}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={18} color="#fff" />
                                <Text style={styles.saveBtnText}>Guardar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ════════════════════════════════════ */}
                {/* Modal: Agregar item                 */}
                {/* ════════════════════════════════════ */}
                <Modal
                    visible={showAddItemModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowAddItemModal(false)}
                >
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <View style={styles.modalOverlay}>
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                activeOpacity={1}
                                onPress={() => setShowAddItemModal(false)}
                            />
                            <View style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <Text style={styles.modalTitle}>Agregar nuevo ítem</Text>

                                <ModalField label="Descripción">
                                    <TextInput
                                        style={styles.modalInput}
                                        value={newItem.descrip}
                                        onChangeText={(text) =>
                                            setNewItem({ ...newItem, descrip: text })
                                        }
                                        placeholder="Descripción del item"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </ModalField>

                                <View style={styles.modalRow}>
                                    <ModalField label="Cantidad" flex={1}>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={newItem.quantity}
                                            onChangeText={(text) =>
                                                setNewItem({ ...newItem, quantity: text })
                                            }
                                            keyboardType="numeric"
                                            placeholder="1"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </ModalField>
                                    <ModalField label="Precio unitario" flex={1}>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={newItem.unitPrice}
                                            onChangeText={(text) =>
                                                setNewItem({ ...newItem, unitPrice: text })
                                            }
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </ModalField>
                                </View>

                                <View style={styles.subtotalPreview}>
                                    <Text style={styles.subtotalLabel}>Subtotal</Text>
                                    <Text style={styles.subtotalValue}>
                                        S/{' '}
                                        {(
                                            (parseFloat(newItem.quantity) || 0) *
                                            (parseFloat(newItem.unitPrice) || 0)
                                        ).toFixed(2)}
                                    </Text>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancelBtn}
                                        onPress={() => setShowAddItemModal(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.modalCancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalConfirmBtn}
                                        onPress={agregarItem}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.modalConfirmText}>Agregar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* ════════════════════════════════════ */}
                {/* Modal: Editar totales                */}
                {/* ════════════════════════════════════ */}
                <Modal
                    visible={showEditTotalModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowEditTotalModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            activeOpacity={1}
                            onPress={() => setShowEditTotalModal(false)}
                        />
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHandle} />
                            <Text style={styles.modalTitle}>Editar Importes</Text>

                            <ModalField label="Total" icon="cash-outline">
                                <TextInput
                                    style={styles.modalInput}
                                    value={tempTotal}
                                    onChangeText={setTempTotal}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </ModalField>

                            <ModalField label="IGV (18%)" icon="pricetag-outline">
                                <TextInput
                                    style={styles.modalInput}
                                    value={tempIGV}
                                    onChangeText={setTempIGV}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </ModalField>

                            <ModalField label="Descuento" icon="arrow-down-outline">
                                <TextInput
                                    style={styles.modalInput}
                                    value={tempDiscount}
                                    onChangeText={setTempDiscount}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </ModalField>

                            <ModalField label="Detracción" icon="document-outline">
                                <TextInput
                                    style={styles.modalInput}
                                    value={tempDetraction}
                                    onChangeText={setTempDetraction}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </ModalField>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setShowEditTotalModal(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.modalCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalConfirmBtn}
                                    onPress={handleSaveTotal}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalConfirmText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ════════════════════════════════════ */}
                {/* Modal: Editar item                   */}
                {/* ════════════════════════════════════ */}
                <Modal
                    visible={showEditItemModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowEditItemModal(false)}
                >
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <View style={styles.modalOverlay}>
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                activeOpacity={1}
                                onPress={() => setShowEditItemModal(false)}
                            />
                            <View style={styles.modalSheet}>
                                <View style={styles.modalHandle} />
                                <Text style={styles.modalTitle}>Editar Item</Text>

                                {editingItem && (
                                    <>
                                        <ModalField label="Descripción">
                                            <TextInput
                                                style={styles.modalInput}
                                                value={editingItem.descrip}
                                                onChangeText={(text) =>
                                                    setEditingItem({
                                                        ...editingItem,
                                                        descrip: text,
                                                    })
                                                }
                                                placeholder="Descripción"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </ModalField>

                                        <View style={styles.modalRow}>
                                            <ModalField label="Cantidad" flex={1}>
                                                <TextInput
                                                    style={styles.modalInput}
                                                    value={editingItem.quantity}
                                                    onChangeText={(text) =>
                                                        setEditingItem({
                                                            ...editingItem,
                                                            quantity: text,
                                                        })
                                                    }
                                                    keyboardType="numeric"
                                                    placeholderTextColor="#9CA3AF"
                                                />
                                            </ModalField>
                                            <ModalField label="Precio Unit." flex={1}>
                                                <TextInput
                                                    style={styles.modalInput}
                                                    value={editingItem.unitPrice}
                                                    onChangeText={(text) =>
                                                        setEditingItem({
                                                            ...editingItem,
                                                            unitPrice: text,
                                                        })
                                                    }
                                                    keyboardType="numeric"
                                                    placeholderTextColor="#9CA3AF"
                                                />
                                            </ModalField>
                                        </View>

                                        <View style={styles.subtotalPreview}>
                                            <Text style={styles.subtotalLabel}>Subtotal</Text>
                                            <Text style={styles.subtotalValue}>
                                                S/{' '}
                                                {(
                                                    (editingItem.quantity || 0) *
                                                    (editingItem.unitPrice || 0)
                                                ).toFixed(2)}
                                            </Text>
                                        </View>
                                    </>
                                )}

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalCancelBtn}
                                        onPress={() => setShowEditItemModal(false)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.modalCancelText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalConfirmBtn}
                                        onPress={handleSaveItem}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.modalConfirmText}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* ════════════════════════════════════ */}
                {/* Modal: Fecha                        */}
                {/* ════════════════════════════════════ */}
                <Modal
                    visible={showDateModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowDateModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            activeOpacity={1}
                            onPress={() => setShowDateModal(false)}
                        />
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHandle} />
                            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>

                            <Text style={styles.dateDisplay}>{formatDate(tempDate)}</Text>

                            <View style={styles.datePickers}>
                                <DateColumn
                                    label="Día"
                                    value={tempDate.getDate().toString().padStart(2, '0')}
                                    onUp={() => adjustDate('day', -1)}
                                    onDown={() => adjustDate('day', 1)}
                                />
                                <DateColumn
                                    label="Mes"
                                    value={(tempDate.getMonth() + 1)
                                        .toString()
                                        .padStart(2, '0')}
                                    onUp={() => adjustDate('month', -1)}
                                    onDown={() => adjustDate('month', 1)}
                                />
                                <DateColumn
                                    label="Año"
                                    value={tempDate.getFullYear().toString()}
                                    onUp={() => adjustDate('year', -1)}
                                    onDown={() => adjustDate('year', 1)}
                                />
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setShowDateModal(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.modalCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalConfirmBtn}
                                    onPress={handleDateSelect}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.modalConfirmText}>Seleccionar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

/* ── Componentes auxiliares ── */

function FieldGroup({ label, children }) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </View>
    );
}

function ModalField({ label, icon, children, flex }: { label: string; icon?: string; children: React.ReactNode; flex?: number }) {
    return (
        <View style={[styles.modalFieldGroup, flex && { flex }]}>
            <View style={styles.modalFieldLabelRow}>
                {icon && <Ionicons name={icon} size={14} color="#9CA3AF" />}
                <Text style={styles.modalFieldLabel}>{label}</Text>
            </View>
            {children}
        </View>
    );
}

function DateColumn({ label, value, onUp, onDown }: { label: string; value: string | number; onUp: () => void; onDown: () => void }) {
    return (
        <View style={styles.dateCol}>
            <Text style={styles.dateColLabel}>{label}</Text>
            <TouchableOpacity onPress={onUp} style={styles.dateArrow}>
                <Ionicons name="chevron-up" size={20} color="#4F46E5" />
            </TouchableOpacity>
            <Text style={styles.dateColValue}>{value}</Text>
            <TouchableOpacity onPress={onDown} style={styles.dateArrow}>
                <Ionicons name="chevron-down" size={20} color="#4F46E5" />
            </TouchableOpacity>
        </View>
    );
}

/* ═══════════════════════════════════════════ */
/*  STYLES                                    */
/* ═══════════════════════════════════════════ */
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 14,
        fontSize: 15,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    /* ── Sections ── */
    section: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 20,
    },

    /* ── Fields ── */
    fieldGroup: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    dateBtnText: {
        fontSize: 15,
        color: '#111827',
    },
    selectBox: {
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#fff',
        paddingVertical: 13,
    },
    selectInput: {
        fontSize: 15,
        color: '#111827',
    },
    selectDropdown: {
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        borderRadius: 12,
    },

    /* ── Items ── */
    addChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
    },
    addChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },
    itemsList: {
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemDesc: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    itemQty: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginRight: 8,
    },
    deleteItemBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemSeparator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 12,
    },
    emptyItems: {
        alignItems: 'center',
        paddingVertical: 32,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 14,
    },
    emptyCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#4F46E5',
    },
    emptyAddBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },

    /* ── Total card ── */
    totalCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    totalCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    totalCardLabel: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    totalCardAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    totalCardHint: {
        fontSize: 12,
        color: '#D1D5DB',
    },

    /* ── Bottom bar ── */
    bottomBar: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 8 : 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    saveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 15,
        borderRadius: 14,
        backgroundColor: '#4F46E5',
    },
    saveBtnDisabled: {
        backgroundColor: '#D1D5DB',
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },

    /* ════════════════════════ */
    /* Modals (bottom sheet)   */
    /* ════════════════════════ */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: screenHeight * 0.8,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalFieldGroup: {
        marginBottom: 14,
    },
    modalFieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 6,
    },
    modalFieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#fff',
    },
    modalRow: {
        flexDirection: 'row',
        gap: 10,
    },

    /* Subtotal preview */
    subtotalPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    subtotalLabel: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    subtotalValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#059669',
    },

    /* Modal actions */
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
    },
    modalConfirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },

    /* ── Date picker ── */
    dateDisplay: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 20,
    },
    datePickers: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    dateCol: {
        alignItems: 'center',
        flex: 1,
    },
    dateColLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 8,
    },
    dateArrow: {
        padding: 6,
    },
    dateColValue: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginVertical: 6,
        minWidth: 44,
        textAlign: 'center',
    },

    /* ── Centros de Costo ── */
    ccFieldContainer: {
        marginBottom: 16,
    },
    ccFieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    required: {
        color: '#EF4444',
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
