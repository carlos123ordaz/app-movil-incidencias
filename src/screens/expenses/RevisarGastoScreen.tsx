import React, { useState, useEffect, useContext } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SelectList } from 'react-native-dropdown-select-list';
import { captureVoucher, createExpense } from '../../services/Gastos';
import moment from 'moment';
import { MainContext } from '../../contexts/MainContextApp';
import { useToast } from '../../contexts/ToastContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { IMainContext, IExpenseFormData, IExpenseItem } from '../../types';


const { width: screenWidth } = Dimensions.get('window');

/* ── Helper components (outside main to avoid re-mount loops) ── */
const BottomSheet = ({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableOpacity style={bsStyles.overlay} activeOpacity={1} onPress={onClose}>
                <View />
            </TouchableOpacity>
            <View style={bsStyles.container}>
                <View style={bsStyles.handle} />
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {children}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    </Modal>
);

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>
            {label}
        </Text>
        {children}
    </View>
);

const ModalField = ({ label, icon, value, onChangeText, keyboardType, ...props }: { label: string; icon?: string; value: string; onChangeText: (text: string) => void; keyboardType?: any;[key: string]: any }) => (
    <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 }}>
            {label}
        </Text>
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                backgroundColor: '#fff',
            }}
        >
            {icon && (
                <View style={{ paddingLeft: 14 }}>
                    <Ionicons name={icon} size={16} color="#9CA3AF" />
                </View>
            )}
            <TextInput
                style={{
                    flex: 1,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontSize: 15,
                    color: '#111827',
                    ...(icon ? { paddingLeft: 0 } : {}),
                }}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                placeholderTextColor="#D1D5DB"
                {...props}
            />
        </View>
    </View>
);

const bsStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '80%',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 18,
    },
});

export default function RevisarGastoScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { photo } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ type: string; message: string; canRetry?: boolean } | null>(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [extractedData, setExtractedData] = useState<IExpenseFormData | null>(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState<IExpenseItem>({
        descrip: '',
        subtotal: 0,
        quantity: 1,
        unitPrice: 0,
    });

    const [showEditTotalModal, setShowEditTotalModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);

    const [editingItem, setEditingItem] = useState<any>(null);
    const [tempTotal, setTempTotal] = useState('');
    const [tempIGV, setTempIGV] = useState('');
    const [tempDiscount, setTempDiscount] = useState('');
    const [tempDetraction, setTempDetraction] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { taskId, userData } = useContext(MainContext) as IMainContext;
    const { toastInfo, toastSuccess, toastError } = useToast();

    const [costCenterAllocations, setCostCenterAllocations] = useState<any[]>([]);

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
    ];

    const MONEDAS = [
        { key: 'PEN', value: 'Soles' },
        { key: 'USD', value: 'Dólares' },
    ];

    const EXPENSE_TYPES = [
        { key: 'viatico', value: 'Viático' },
        { key: 'compra', value: 'Compra' },
    ];

    const SUSTENTOS = [
        { key: 'Sustento con IGV', value: 'Sustento con IGV' },
        { key: 'Sustento sin IGV', value: 'Sustento sin IGV' },
        { key: 'RxH', value: 'RxH' },
        { key: 'Gasto Reparable', value: 'Gasto Reparable' },
    ];

    const handleDropdownChange = (value, field) => {
        setExtractedData({ ...extractedData, [field]: value });
    };

    const readVoucher = async () => {
        if (extractedData) return;
        try {
            setLoading(true);
            setError(null);
            const formData = new FormData();
            formData.append('image', {
                uri: photo.uri,
                type: photo.type || (photo.isPDF ? 'application/pdf' : 'image/jpeg'),
                name: photo.fileName || (photo.isPDF ? 'document.pdf' : 'image.jpg'),
            } as any);
            const response = await captureVoucher(formData);
            if (response.data && !response.data.isValid) {
                setError({
                    type: 'invalid_receipt',
                    message:
                        response.data.errorMessage ||
                        'El comprobante no pudo ser procesado correctamente',
                    canRetry: true,
                });
                return;
            }
            const d = response.data;
            setExtractedData({
                type: d.type || 'viatico',
                ruc: d.ruc || '',
                businessName: d.businessName || '',
                address: d.address || '',
                expenseDate: d.expenseDate || new Date(),
                items: d.items || [],
                total: d.total || 0,
                igv: d.igv || 0,
                discount: d.discount || 0,
                detraction: d.detraction || 0,
                currencyCode: d.currencyCode || 'PEN',
                category: d.category || 'alimentacion',
                descrip: d.descrip || '',
                hasReceipt: d.con_sustento ?? true,
                receiptDetail: d.receiptDetail || 'Sustento con IGV',
                imageUrl: d.imageUrl,
            } as any);
        } catch (error) {
            console.error('Error al procesar el comprobante:', error);
            let errorInfo = {
                type: 'network',
                message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
                canRetry: true,
            };
            if (error.response) {
                const status = error.response.status;
                if (status === 400) {
                    errorInfo = {
                        type: 'invalid_file',
                        message: 'El archivo de imagen no es válido. Selecciona otra imagen.',
                        canRetry: true,
                    };
                } else if (status === 500) {
                    errorInfo = {
                        type: 'server',
                        message: 'Error en el servidor. Intenta nuevamente en unos momentos.',
                        canRetry: true,
                    };
                }
            } else if (error.request) {
                errorInfo = {
                    type: 'network',
                    message: 'Sin conexión a internet. Verifica tu conexión e intenta nuevamente.',
                    canRetry: true,
                };
            }
            setError(errorInfo);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (photo) {
            readVoucher();
        } else {
            setError({
                type: 'no_image',
                message: 'No se encontró la imagen del comprobante.',
                canRetry: false,
            });
            setLoading(false);
        }
    }, [photo]);

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
            newItem.descrip?.trim() &&
            newItem.unitPrice !== undefined &&
            newItem.quantity !== undefined
        ) {
            const nuevoItem: IExpenseItem = {
                descrip: newItem.descrip.trim(),
                quantity: Number(newItem.quantity) || 1,
                unitPrice: Number(newItem.unitPrice) || 0,
                subtotal:
                    (Number(newItem.quantity) || 1) *
                    (Number(newItem.unitPrice) || 0),
            };
            setExtractedData({
                ...extractedData,
                items: [...(extractedData.items || []), nuevoItem],
            });
            setNewItem({ descrip: '', subtotal: 0, quantity: 1, unitPrice: 0 });
            setShowAddItemModal(false);
        } else {
            toastInfo('Por favor completa todos los campos del item');
        }
    };

    const eliminarItem = (index: number) => {
        Alert.alert('Eliminar Item', '¿Estás seguro que quieres eliminar este item?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                    setExtractedData({
                        ...extractedData,
                        items: extractedData.items.filter((_, i) => i !== index),
                    });
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
        if (isSaving) return;
        if (!taskId) {
            toastInfo('Debe ingresar el ID de la tarea');
            return;
        }
        if (!extractedData?.total || extractedData.total === 0) {
            toastInfo('Debe ingresar un total válido');
            return;
        }
        if (!extractedData?.descrip) {
            toastInfo('Debe ingresar una descripción');
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
        setIsSaving(true);
        try {
            const expenseData = {
                ...extractedData,
                taskId,
                expenseDate: new Date(extractedData.expenseDate || new Date()).toISOString(),
                allocations: costCenterAllocations,
                imageUrl: extractedData.imageUrl || '',
            };
            await createExpense(expenseData);
            setIsSaving(false);
            toastSuccess('El gasto ha sido guardado correctamente');
            navigation.navigate('HomeTabs', { screen: 'Gastos' });
        } catch (error) {
            setIsSaving(false);
            console.error('Error al guardar:', JSON.stringify(error));
            toastError('No se pudo guardar el gasto. Intenta nuevamente.');
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
            total: Number(tempTotal) || 0,
            igv: Number(tempIGV) || 0,
            discount: Number(tempDiscount) || 0,
            detraction: Number(tempDetraction) || 0,
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
            subtotal: item.subtotal?.toString() || '0',
        });
        setShowEditItemModal(true);
    };

    const handleSaveItem = () => {
        if (!editingItem) return;
        const updatedItems = [...(extractedData.items || [])];
        const cantidad = editingItem.quantity || 1;
        const precioUnitario = editingItem.unitPrice || 0;
        updatedItems[editingItem.index] = {
            ...updatedItems[editingItem.index],
            descrip: editingItem.descrip,
            quantity: cantidad,
            unitPrice: precioUnitario,
            subtotal: cantidad * precioUnitario,
        };
        setExtractedData({ ...extractedData, items: updatedItems });
        setShowEditItemModal(false);
        setEditingItem(null);
    };

    const renderDropdownField = (value, options, field, placeholder) => (
        <SelectList
            setSelected={(val) => handleDropdownChange(val, field)}
            data={options}
            save="key"
            placeholder={placeholder || 'Seleccionar'}
            defaultOption={options.find((opt) => opt.key === value)}
            search={false}
            boxStyles={styles.selectBox}
            dropdownStyles={styles.selectDropdown}
            inputStyles={styles.selectInput}
        />
    );

    // ─── Loading timer ───
    const [loadingTime, setLoadingTime] = useState(0);
    useEffect(() => {
        let interval;
        if (loading) {
            setLoadingTime(0);
            interval = setInterval(() => setLoadingTime((p) => p + 1), 1000);
        }
        return () => interval && clearInterval(interval);
    }, [loading]);
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.loadingCircle}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
                <Text style={styles.loadingTitle}>Analizando comprobante</Text>
                <Text style={styles.loadingTimer}>{loadingTime}s</Text>
            </View>
        );
    }

    /* ════════════════════════════════ */
    /* Error state                      */
    /* ════════════════════════════════ */
    if (error) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.errorCard}>
                    <View style={styles.errorIconCircle}>
                        <Ionicons
                            name={
                                error.type === 'invalid_receipt'
                                    ? 'document-text-outline'
                                    : error.type === 'network'
                                        ? 'wifi-outline'
                                        : error.type === 'server'
                                            ? 'server-outline'
                                            : 'alert-circle-outline'
                            }
                            size={36}
                            color="#DC2626"
                        />
                    </View>
                    <Text style={styles.errorTitle}>
                        {error.type === 'invalid_receipt'
                            ? 'Comprobante no válido'
                            : error.type === 'network'
                                ? 'Sin conexión'
                                : error.type === 'server'
                                    ? 'Error del servidor'
                                    : 'Error inesperado'}
                    </Text>
                    <Text style={styles.errorMessage}>{error.message}</Text>

                    {error.type === 'invalid_receipt' && (
                        <View style={styles.errorTips}>
                            <Text style={styles.tipsTitle}>Consejos:</Text>
                            <Text style={styles.tipItem}>
                                • Asegúrate que sea una factura o boleta válida
                            </Text>
                            <Text style={styles.tipItem}>
                                • Verifica que la imagen esté clara y completa
                            </Text>
                            <Text style={styles.tipItem}>
                                • Evita imágenes borrosas o con poca luz
                            </Text>
                        </View>
                    )}

                    <View style={styles.errorActions}>
                        <TouchableOpacity
                            style={styles.errorOutlineBtn}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.errorOutlineBtnText}>Cambiar</Text>
                        </TouchableOpacity>
                        {error.canRetry && (
                            <TouchableOpacity
                                style={styles.errorRetryBtn}
                                onPress={readVoucher}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.errorRetryBtnText}>Intentar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    /* ════════════════════════════════ */
    /* Main form                        */
    /* ════════════════════════════════ */
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Receipt image ── */}
                    <View style={styles.imageSection}>
                        {photo?.isPDF ? (
                            // Vista para PDF
                            <View style={[styles.imageWrapper, styles.pdfPreview]}>
                                <Ionicons name="document-text" size={48} color="#4F46E5" />
                                <Text style={styles.pdfFileName} numberOfLines={2}>
                                    {photo.fileName || 'comprobante.pdf'}
                                </Text>
                                <View style={styles.pdfBadge}>
                                    <Text style={styles.pdfBadgeText}>PDF</Text>
                                </View>
                            </View>
                        ) : photo?.uri ? (
                            <View style={styles.imageWrapper}>
                                <Image
                                    source={{ uri: photo.uri }}
                                    style={styles.receiptImage}
                                    contentFit="contain"
                                />
                            </View>
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="document-outline" size={36} color="#D1D5DB" />
                                <Text style={styles.placeholderText}>Comprobante</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* ── Detalles del comprobante ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={18} color="#374151" />
                            <Text style={styles.sectionTitle}>Detalles del comprobante</Text>
                        </View>

                        <FieldGroup label="RUC">
                            <TextInput
                                style={styles.input}
                                value={extractedData?.ruc || ''}
                                onChangeText={(t) =>
                                    setExtractedData({ ...extractedData, ruc: t })
                                }
                                placeholder="Ingresa el RUC"
                                placeholderTextColor="#D1D5DB"
                                keyboardType="numeric"
                            />
                        </FieldGroup>

                        <FieldGroup label="Razón social">
                            <TextInput
                                style={styles.input}
                                value={extractedData?.businessName || ''}
                                onChangeText={(t) =>
                                    setExtractedData({ ...extractedData, businessName: t })
                                }
                                placeholder="Ingresa la razón social"
                                placeholderTextColor="#D1D5DB"
                            />
                        </FieldGroup>

                        <FieldGroup label="Fecha">
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => {
                                    setTempDate(
                                        extractedData?.expenseDate
                                            ? new Date(extractedData.expenseDate)
                                            : new Date()
                                    );
                                    setShowDateModal(true);
                                }}
                                activeOpacity={0.6}
                            >
                                <Text
                                    style={[
                                        styles.dateText,
                                        !extractedData?.expenseDate && { color: '#D1D5DB' },
                                    ]}
                                >
                                    {extractedData?.expenseDate
                                        ? moment(extractedData.expenseDate).format('DD/MM/YYYY')
                                        : 'Seleccionar fecha'}
                                </Text>
                                <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        </FieldGroup>
                    </View>

                    <View style={styles.divider} />

                    {/* ── Items ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="list-outline" size={18} color="#374151" />
                            <Text style={styles.sectionTitle}>Items del comprobante</Text>
                            <TouchableOpacity
                                style={styles.addItemChip}
                                onPress={() => setShowAddItemModal(true)}
                            >
                                <Ionicons name="add" size={14} color="#4F46E5" />
                                <Text style={styles.addItemChipText}>Agregar</Text>
                            </TouchableOpacity>
                        </View>

                        {extractedData?.items?.length > 0 ? (
                            extractedData.items.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.itemRow}
                                    onPress={() => handleLongPressItem(item, index)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemDesc} numberOfLines={2}>
                                            {item.descrip}
                                        </Text>
                                        {item.quantity && item.unitPrice ? (
                                            <Text style={styles.itemDetail}>
                                                {item.quantity} × S/
                                                {item.unitPrice}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text style={styles.itemPrice}>
                                        S/
                                        {item.subtotal
                                            ? item.subtotal.toLocaleString('es-PE', {
                                                minimumFractionDigits: 2,
                                            })
                                            : '0.00'}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.deleteItemBtn}
                                        onPress={() => eliminarItem(index)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Ionicons name="close" size={14} color="#DC2626" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyItems}>
                                <View style={styles.emptyItemsCircle}>
                                    <Ionicons name="receipt-outline" size={28} color="#D1D5DB" />
                                </View>
                                <Text style={styles.emptyItemsText}>
                                    No se encontraron items
                                </Text>
                                <TouchableOpacity
                                    style={styles.addFirstBtn}
                                    onPress={() => setShowAddItemModal(true)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="add" size={16} color="#4F46E5" />
                                    <Text style={styles.addFirstBtnText}>
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
                            <Text style={styles.totalLabel}>Monto Total</Text>
                            <Text style={styles.totalAmount}>
                                $
                                {extractedData?.total
                                    ? extractedData.total.toLocaleString('es-PE', {
                                        minimumFractionDigits: 2,
                                    })
                                    : '0.00'}
                            </Text>
                            <View style={styles.totalEditHint}>
                                <Ionicons name="pencil-outline" size={12} color="#9CA3AF" />
                                <Text style={styles.totalEditHintText}>
                                    Toca para editar importes
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <FieldGroup label="Tipo de gasto">
                            {renderDropdownField(
                                extractedData?.type,
                                EXPENSE_TYPES,
                                'type',
                                'Seleccionar tipo de gasto'
                            )}
                        </FieldGroup>

                        {
                            extractedData?.type === 'viatico' ? (
                                <FieldGroup label="Categoría">
                                    {renderDropdownField(
                                        extractedData?.category,
                                        viaticoCategories,
                                        'category',
                                        'Seleccionar categoría'
                                    )}
                                </FieldGroup>
                            ) : (
                                <FieldGroup label="Categoría">
                                    {renderDropdownField(
                                        extractedData?.category,
                                        purchaseCategories,
                                        'category',
                                        'Seleccionar categoría'
                                    )}
                                </FieldGroup>
                            )
                        }

                        <FieldGroup label="Moneda">
                            {renderDropdownField(
                                extractedData?.currencyCode,
                                MONEDAS,
                                'currencyCode',
                                'Seleccionar moneda'
                            )}
                        </FieldGroup>

                        <FieldGroup label="Descripción general">
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={extractedData?.descrip || ''}
                                onChangeText={(t) =>
                                    setExtractedData({ ...extractedData, descrip: t })
                                }
                                placeholder="Agregar una descripción"
                                placeholderTextColor="#D1D5DB"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </FieldGroup>

                        <FieldGroup label="Detalle de Sustento">
                            {renderDropdownField(
                                extractedData?.receiptDetail,
                                SUSTENTOS,
                                'receiptDetail',
                                'Seleccionar sustento'
                            )}
                        </FieldGroup>



                        {/* ✅ CENTROS DE COSTO */}
                        <View style={styles.divider} />

                        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                            <Ionicons name="briefcase-outline" size={18} color="#374151" />
                            <Text style={styles.sectionTitle}>Centros de Costo</Text>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>
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

                    <View style={{ height: 24 }} />
                </ScrollView>

                {/* ── Bottom bar ── */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancelar}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                        onPress={handleGuardar}
                        disabled={isSaving}
                        activeOpacity={0.8}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-outline" size={18} color="#fff" />
                                <Text style={styles.saveBtnText}>Guardar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ═══════════════════════════════ */}
                {/* Modal: Add item                 */}
                {/* ═══════════════════════════════ */}
                <BottomSheet
                    visible={showAddItemModal}
                    onClose={() => setShowAddItemModal(false)}
                >
                    <Text style={styles.sheetTitle}>Agregar nuevo ítem</Text>
                    <ModalField
                        label="Descripción"
                        value={newItem.descrip ?? ''}
                        onChangeText={(t) => setNewItem({ ...newItem, descrip: t })}
                        placeholder="Nombre del producto o servicio"
                    />
                    <View style={styles.rowFields}>
                        <View style={{ flex: 1 }}>
                            <ModalField
                                label="Cantidad"
                                value={newItem.quantity?.toString() ?? ''}
                                onChangeText={(t) => setNewItem({ ...newItem, quantity: Number(t) || 0 })}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ModalField
                                label="Precio unitario"
                                value={newItem.unitPrice?.toString() ?? ''}
                                onChangeText={(t) =>
                                    setNewItem({ ...newItem, unitPrice: Number(t) || 0 })
                                }
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                    <View style={styles.subtotalPreview}>
                        <Text style={styles.subtotalPreviewText}>
                            Subtotal: $
                            {(
                                (Number(newItem.quantity) || 0) *
                                (Number(newItem.unitPrice) || 0)
                            ).toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.sheetActions}>
                        <TouchableOpacity
                            style={styles.sheetCancelBtn}
                            onPress={() => setShowAddItemModal(false)}
                        >
                            <Text style={styles.sheetCancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetSaveBtn} onPress={agregarItem}>
                            <Text style={styles.sheetSaveBtnText}>Agregar</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheet>

                {/* ═══════════════════════════════ */}
                {/* Modal: Edit totals              */}
                {/* ═══════════════════════════════ */}
                <BottomSheet
                    visible={showEditTotalModal}
                    onClose={() => setShowEditTotalModal(false)}
                >
                    <Text style={styles.sheetTitle}>Editar Importes</Text>
                    <ModalField
                        label="Total"
                        icon="cash-outline"
                        value={tempTotal}
                        onChangeText={setTempTotal}
                        keyboardType="numeric"
                    />
                    <ModalField
                        label="IGV"
                        icon="pricetag-outline"
                        value={tempIGV}
                        onChangeText={setTempIGV}
                        keyboardType="numeric"
                    />
                    <ModalField
                        label="Descuento"
                        icon="gift-outline"
                        value={tempDiscount}
                        onChangeText={setTempDiscount}
                        keyboardType="numeric"
                    />
                    <ModalField
                        label="Detracción"
                        icon="receipt-outline"
                        value={tempDetraction}
                        onChangeText={setTempDetraction}
                        keyboardType="numeric"
                    />
                    <View style={styles.sheetActions}>
                        <TouchableOpacity
                            style={styles.sheetCancelBtn}
                            onPress={() => setShowEditTotalModal(false)}
                        >
                            <Text style={styles.sheetCancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.sheetSaveBtn}
                            onPress={handleSaveTotal}
                        >
                            <Text style={styles.sheetSaveBtnText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheet>

                {/* ═══════════════════════════════ */}
                {/* Modal: Edit item                */}
                {/* ═══════════════════════════════ */}
                <BottomSheet
                    visible={showEditItemModal}
                    onClose={() => setShowEditItemModal(false)}
                >
                    <Text style={styles.sheetTitle}>Editar Item</Text>
                    {editingItem && (
                        <>
                            <ModalField
                                label="Descripción"
                                value={editingItem.descrip}
                                onChangeText={(t) =>
                                    setEditingItem({ ...editingItem, descrip: t })
                                }
                            />
                            <View style={styles.rowFields}>
                                <View style={{ flex: 1 }}>
                                    <ModalField
                                        label="Cantidad"
                                        value={editingItem.quantity}
                                        onChangeText={(t) =>
                                            setEditingItem({ ...editingItem, quantity: t })
                                        }
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ModalField
                                        label="Precio Unit."
                                        value={editingItem.uniptPrice}
                                        onChangeText={(t) =>
                                            setEditingItem({
                                                ...editingItem,
                                                unitPrice: t,
                                            })
                                        }
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                            <View style={styles.subtotalPreview}>
                                <Text style={styles.subtotalPreviewText}>
                                    Subtotal: $
                                    {(
                                        (editingItem.quantity || 0) *
                                        (editingItem.unitPrice || 0)
                                    ).toFixed(2)}
                                </Text>
                            </View>
                        </>
                    )}
                    <View style={styles.sheetActions}>
                        <TouchableOpacity
                            style={styles.sheetCancelBtn}
                            onPress={() => setShowEditItemModal(false)}
                        >
                            <Text style={styles.sheetCancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.sheetSaveBtn}
                            onPress={handleSaveItem}
                        >
                            <Text style={styles.sheetSaveBtnText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheet>

                {/* ═══════════════════════════════ */}
                {/* Modal: Date picker              */}
                {/* ═══════════════════════════════ */}
                <BottomSheet
                    visible={showDateModal}
                    onClose={() => setShowDateModal(false)}
                >
                    <Text style={styles.sheetTitle}>Seleccionar Fecha</Text>

                    <Text style={styles.dateDisplay}>
                        {tempDate.toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        })}
                    </Text>

                    <View style={styles.datePickers}>
                        {[
                            { label: 'Día', type: 'day', value: tempDate.getDate().toString().padStart(2, '0') },
                            { label: 'Mes', type: 'month', value: (tempDate.getMonth() + 1).toString().padStart(2, '0') },
                            { label: 'Año', type: 'year', value: tempDate.getFullYear().toString() },
                        ].map((col) => (
                            <View key={col.type} style={styles.dateCol}>
                                <Text style={styles.dateColLabel}>{col.label}</Text>
                                <TouchableOpacity
                                    style={styles.dateArrow}
                                    onPress={() => adjustDate(col.type, -1)}
                                >
                                    <Ionicons name="chevron-up" size={20} color="#4F46E5" />
                                </TouchableOpacity>
                                <Text style={styles.dateColValue}>{col.value}</Text>
                                <TouchableOpacity
                                    style={styles.dateArrow}
                                    onPress={() => adjustDate(col.type, 1)}
                                >
                                    <Ionicons name="chevron-down" size={20} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={styles.sheetActions}>
                        <TouchableOpacity
                            style={styles.sheetCancelBtn}
                            onPress={() => setShowDateModal(false)}
                        >
                            <Text style={styles.sheetCancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.sheetSaveBtn}
                            onPress={handleDateSelect}
                        >
                            <Text style={styles.sheetSaveBtnText}>Seleccionar</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheet>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    /* ── Shared ── */
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    scrollView: {
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
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 20,
    },

    /* ── Loading ── */
    loadingCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    loadingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 6,
    },
    loadingTimer: {
        fontSize: 14,
        color: '#9CA3AF',
    },

    /* ── Error ── */
    errorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        padding: 28,
        alignItems: 'center',
        maxWidth: 360,
        width: '100%',
    },
    errorIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 20,
    },
    errorTips: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 14,
        width: '100%',
        marginBottom: 20,
    },
    tipsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#DC2626',
        marginBottom: 6,
    },
    tipItem: {
        fontSize: 13,
        color: '#991B1B',
        lineHeight: 19,
        marginBottom: 2,
    },
    errorActions: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    errorOutlineBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    errorOutlineBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    errorRetryBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
    },
    errorRetryBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },

    /* ── Image section ── */
    imageSection: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    imageWrapper: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    receiptImage: {
        width: screenWidth * 0.55,
        height: 190,
        borderRadius: 8,
    },
    placeholderImage: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 160,
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    placeholderText: {
        fontSize: 13,
        color: '#D1D5DB',
        marginTop: 8,
    },

    /* ── Sections ── */
    section: {
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },

    /* ── Fields ── */
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    dateText: {
        fontSize: 15,
        color: '#111827',
    },

    /* ── Items ── */
    addItemChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    addItemChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemInfo: {
        flex: 1,
    },
    itemDesc: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    itemDetail: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginRight: 10,
    },
    deleteItemBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyItems: {
        alignItems: 'center',
        paddingVertical: 28,
    },
    emptyItemsCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyItemsText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 14,
    },
    addFirstBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#C7D2FE',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    addFirstBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },

    /* ── Total card ── */
    totalCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        padding: 18,
        alignItems: 'center',
        marginBottom: 18,
    },
    totalLabel: {
        fontSize: 13,
        color: '#9CA3AF',
        marginBottom: 6,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    totalEditHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    totalEditHintText: {
        fontSize: 11,
        color: '#D1D5DB',
    },

    /* ── SelectList override ── */
    selectBox: {
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
    },
    selectDropdown: {
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginTop: 4,
    },
    selectInput: {
        fontSize: 15,
        color: '#111827',
    },

    /* ── Bottom bar ── */
    bottomBar: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
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
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    saveBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },

    /* ── Sheet actions ── */
    sheetTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 20,
    },
    sheetActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        marginBottom: 25,
    },
    sheetCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
    },
    sheetCancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    sheetSaveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
    },
    sheetSaveBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },

    rowFields: {
        flexDirection: 'row',
        gap: 10,
    },
    subtotalPreview: {
        backgroundColor: '#ECFDF5',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    subtotalPreviewText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#059669',
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
    },
    dateCol: {
        alignItems: 'center',
        flex: 1,
    },
    dateColLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    dateArrow: {
        padding: 6,
    },
    dateColValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginVertical: 6,
        minWidth: 44,
        textAlign: 'center',
    },
    pdfPreview: {
        alignItems: 'center',
        justifyContent: 'center',
        width: screenWidth * 0.55,
        height: 190,
        gap: 10,
    },
    pdfFileName: {
        fontSize: 13,
        color: '#374151',
        textAlign: 'center',
        paddingHorizontal: 10,
        fontWeight: '500',
    },
    pdfBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    pdfBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },

    /* ── Centros de Costo ── */
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
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
