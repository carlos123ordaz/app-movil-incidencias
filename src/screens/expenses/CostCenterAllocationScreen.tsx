<<<<<<< HEAD
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function CostCenterAllocationScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Asignación de centros de costo</Text>
            <Text style={styles.text}>Esta pantalla todavía no está implementada en esta versión.</Text>
        </View>
=======
import { useState, useEffect, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllCostCenters } from '../../services/CostCenter';
import { getSubCostCenters } from '../../services/SubCostCenter';
import { getSubSubCostCenters } from '../../services/SubSubCostCenter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Selector reutilizable dentro de modal ───
const ModalSelector = ({ label, value, options, onSelect, placeholder, loading }: { label: string; value: string | null; options: Array<{ key: string; value: string }>; onSelect: (val: any) => void; placeholder?: string; loading?: boolean }) => {
    const displayValue = options.find(opt => opt.key === value);
    return (
        <View style={styles.modalFieldContainer}>
            <Text style={styles.modalLabel}>{label}</Text>
            {loading ? (
                <View style={styles.selectorLoading}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text style={styles.selectorLoadingText}>Cargando...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.optionsList}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                >
                    {options.length === 0 ? (
                        <View style={styles.noOptionsContainer}>
                            <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
                            <Text style={styles.noOptionsText}>
                                {placeholder || 'No hay opciones disponibles'}
                            </Text>
                        </View>
                    ) : (
                        options.map((option) => {
                            const isSelected = value === option.key;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.optionItem,
                                        isSelected && styles.optionItemSelected,
                                    ]}
                                    onPress={() => onSelect(option)}
                                    activeOpacity={0.6}
                                >
                                    <Text
                                        style={[
                                            styles.optionItemText,
                                            isSelected && styles.optionItemTextSelected,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {option.value}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
};

export default function CostCenterAllocationScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    // Recibir allocations existentes (si se está editando)
    const existingAllocations = route.params?.allocations || [];
    const onSave = route.params?.onSave; // callback key

    const [allocations, setAllocations] = useState<any[]>(
        existingAllocations.length > 0
            ? existingAllocations
            : []
    );

    // Modal para agregar/editar allocation
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Datos del formulario del modal
    const [costCenters1, setCostCenters1] = useState<any[]>([]);
    const [costCenters2, setCostCenters2] = useState<any[]>([]);
    const [costCenters3, setCostCenters3] = useState<any[]>([]);
    const [selectedCC1, setSelectedCC1] = useState<any>(null);
    const [selectedCC2, setSelectedCC2] = useState<any>(null);
    const [selectedCC3, setSelectedCC3] = useState<any>(null);
    const [percentage, setPercentage] = useState('');
    const [loadingCC1, setLoadingCC1] = useState(false);
    const [loadingCC2, setLoadingCC2] = useState(false);
    const [loadingCC3, setLoadingCC3] = useState(false);

    // Step del modal
    const [modalStep, setModalStep] = useState(1); // 1: CC1, 2: CC2, 3: CC3, 4: Porcentaje

    // Cargar CC nivel 1 al abrir modal
    useEffect(() => {
        loadCostCenters1();
    }, []);

    const loadCostCenters1 = async () => {
        try {
            setLoadingCC1(true);
            const response = await getAllCostCenters();
            const options = response.data.map(cc => ({
                key: String(cc.costCenterId),
                value: `${cc.shortName} - ${cc.descrip}`,
            }));
            setCostCenters1(options);
        } catch (error) {
            console.error('Error cargando CC nivel 1:', error);
        } finally {
            setLoadingCC1(false);
        }
    };

    const loadCostCenters2 = async (costCenterId: number) => {
        try {
            setLoadingCC2(true);
            setCostCenters2([]);
            setCostCenters3([]);
            const response = await getSubCostCenters(costCenterId);
            const options = response.data.map(cc => ({
                key: String(cc.subCostCenterId),
                value: `${cc.shortName} - ${cc.descrip}`,
            }));
            setCostCenters2(options);
        } catch (error) {
            console.error('Error cargando sub CC nivel 2:', error);
        } finally {
            setLoadingCC2(false);
        }
    };

    const loadCostCenters3 = async (subCostCenterId: number) => {
        try {
            setLoadingCC3(true);
            setCostCenters3([]);
            const response = await getSubSubCostCenters(subCostCenterId);
            const options = response.data.map(cc => ({
                key: String(cc.subSubCostCenterId),
                value: `${cc.shortName} - ${cc.descrip}`,
            }));
            setCostCenters3(options);
        } catch (error) {
            console.error('Error cargando sub sub CC nivel 3:', error);
        } finally {
            setLoadingCC3(false);
        }
    };

    // ── Porcentaje restante ──
    const usedPercentage = allocations.reduce((sum, alloc, idx) => {
        if (idx === editingIndex) return sum; // No contar el que se está editando
        return sum + (alloc.percentage || 0);
    }, 0);
    const remainingPercentage = 100 - usedPercentage;
    const totalPercentage = allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);

    // ── Abrir modal para agregar ──
    const handleAddAllocation = () => {
        if (remainingPercentage <= 0) {
            Alert.alert('Límite alcanzado', 'Ya has asignado el 100% del gasto');
            return;
        }
        setEditingIndex(null);
        resetModalForm();
        setPercentage(remainingPercentage.toString());
        setModalStep(1);
        setShowModal(true);
    };

    // ── Abrir modal para editar ──
    const handleEditAllocation = async (index: number) => {
        const alloc = allocations[index];
        setEditingIndex(index);
        setModalStep(1);

        // Restaurar selecciones
        setSelectedCC1(alloc._cc1 || null);
        setSelectedCC2(alloc._cc2 || null);
        setSelectedCC3(alloc._cc3 || null);
        setPercentage(alloc.percentage.toString());

        // Cargar sub-niveles si aplica
        if (alloc.costCenterId) {
            await loadCostCenters2(alloc.costCenterId);
            if (alloc.subCostCenterId) {
                await loadCostCenters3(alloc.subCostCenterId);
            }
        }

        setShowModal(true);
    };

    // ── Eliminar allocation ──
    const handleDeleteAllocation = (index: number) => {
        Alert.alert(
            'Eliminar asignación',
            '¿Estás seguro que deseas eliminar esta asignación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        setAllocations(prev => prev.filter((_, i) => i !== index));
                    }
                }
            ]
        );
    };

    // ── Reset form ──
    const resetModalForm = () => {
        setSelectedCC1(null);
        setSelectedCC2(null);
        setSelectedCC3(null);
        setCostCenters2([]);
        setCostCenters3([]);
        setPercentage('');
    };

    // ── Seleccionar CC1 ──
    const handleSelectCC1 = async (option: any) => {
        setSelectedCC1(option);
        setSelectedCC2(null);
        setSelectedCC3(null);
        setCostCenters3([]);
        await loadCostCenters2(Number(option.key));
    };

    // ── Seleccionar CC2 ──
    const handleSelectCC2 = async (option: any) => {
        setSelectedCC2(option);
        setSelectedCC3(null);
        await loadCostCenters3(Number(option.key));
    };

    // ── Seleccionar CC3 ──
    const handleSelectCC3 = (option: any) => {
        setSelectedCC3(option);
    };

    // ── Guardar allocation en el modal ──
    const handleSaveAllocationInModal = () => {
        if (!selectedCC1) {
            Alert.alert('Error', 'Selecciona un centro de costo');
            return;
        }
        if (costCenters2.length > 0 && !selectedCC2) {
            Alert.alert('Error', 'Selecciona un sub centro de costo');
            return;
        }
        if (costCenters3.length > 0 && !selectedCC3) {
            Alert.alert('Error', 'Selecciona un sub sub centro de costo');
            return;
        }

        const pctValue = parseFloat(percentage) || 0;
        if (pctValue <= 0 || pctValue > 100) {
            Alert.alert('Error', 'El porcentaje debe estar entre 1 y 100');
            return;
        }

        if (pctValue > remainingPercentage && editingIndex === null) {
            Alert.alert('Error', `El porcentaje máximo disponible es ${remainingPercentage}%`);
            return;
        }

        const newAllocation = {
            costCenterId: Number(selectedCC1.key),
            subCostCenterId: selectedCC2 ? Number(selectedCC2.key) : null,
            subSubCostCenterId: selectedCC3 ? Number(selectedCC3.key) : null,
            percentage: pctValue,
            // Metadata para display (no se envía al backend)
            _cc1Label: selectedCC1.value,
            _cc2Label: selectedCC2?.value || null,
            _cc3Label: selectedCC3?.value || null,
            _cc1: selectedCC1,
            _cc2: selectedCC2,
            _cc3: selectedCC3,
        };

        if (editingIndex !== null) {
            setAllocations(prev => {
                const updated = [...prev];
                updated[editingIndex] = newAllocation;
                return updated;
            });
        } else {
            setAllocations(prev => [...prev, newAllocation]);
        }

        setShowModal(false);
        resetModalForm();
    };

    // ── Guardar y volver ──
    const handleConfirm = () => {
        const total = allocations.reduce((sum, a) => sum + a.percentage, 0);

        if (allocations.length === 0) {
            Alert.alert('Error', 'Agrega al menos una asignación de centro de costo');
            return;
        }

        if (total !== 100) {
            Alert.alert(
                'Porcentaje incompleto',
                `La suma de porcentajes es ${total}%. Debe ser exactamente 100%.`,
                [{ text: 'Entendido' }]
            );
            return;
        }

        // Preparar datos limpios para enviar de vuelta
        const cleanAllocations = allocations.map(a => ({
            costCenterId: a.costCenterId,
            subCostCenterId: a.subCostCenterId,
            subSubCostCenterId: a.subSubCostCenterId,
            percentage: a.percentage,
            // Labels para display
            _cc1Label: a._cc1Label,
            _cc2Label: a._cc2Label,
            _cc3Label: a._cc3Label,
            _cc1: a._cc1,
            _cc2: a._cc2,
            _cc3: a._cc3,
        }));

        if (route.params?.onSave) {
            route.params.onSave(cleanAllocations);
        }
        navigation.goBack();
    };

    // ── Helpers de display ──
    const getPercentageColor = (pct) => {
        if (pct >= 50) return '#059669';
        if (pct >= 25) return '#D97706';
        return '#6B7280';
    };

    const renderStepContent = () => {
        switch (modalStep) {
            case 1:
                return (
                    <ModalSelector
                        label="Centro de Costo (Nivel 1)"
                        value={selectedCC1?.key}
                        options={costCenters1}
                        onSelect={(opt) => {
                            handleSelectCC1(opt);
                            // Auto-advance si hay opciones de nivel 2
                        }}
                        placeholder="Selecciona un centro de costo"
                        loading={loadingCC1}
                    />
                );
            case 2:
                return (
                    <ModalSelector
                        label="Sub Centro de Costo (Nivel 2)"
                        value={selectedCC2?.key}
                        options={costCenters2}
                        onSelect={(opt) => {
                            handleSelectCC2(opt);
                        }}
                        placeholder="Selecciona un sub centro"
                        loading={loadingCC2}
                    />
                );
            case 3:
                return (
                    <ModalSelector
                        label="SS Centro de Costo (Nivel 3)"
                        value={selectedCC3?.key}
                        options={costCenters3}
                        onSelect={handleSelectCC3}
                        placeholder="Selecciona un SS centro"
                        loading={loadingCC3}
                    />
                );
            case 4:
                return (
                    <View style={styles.modalFieldContainer}>
                        <Text style={styles.modalLabel}>Porcentaje asignado</Text>
                        <View style={styles.percentageInputRow}>
                            <View style={styles.percentageInputContainer}>
                                <TextInput
                                    style={styles.percentageInput}
                                    value={percentage}
                                    onChangeText={setPercentage}
                                    keyboardType="numeric"
                                    maxLength={3}
                                    placeholder="0"
                                    placeholderTextColor="#D1D5DB"
                                />
                                <Text style={styles.percentageSymbol}>%</Text>
                            </View>
                            <Text style={styles.percentageHint}>
                                Disponible: {remainingPercentage + (editingIndex !== null ? allocations[editingIndex]?.percentage || 0 : 0)}%
                            </Text>
                        </View>

                        {/* Quick percentage buttons */}
                        <View style={styles.quickPercentageRow}>
                            {[25, 33, 50, 100].map(pct => {
                                const maxAvailable = remainingPercentage + (editingIndex !== null ? allocations[editingIndex]?.percentage || 0 : 0);
                                const isDisabled = pct > maxAvailable;
                                return (
                                    <TouchableOpacity
                                        key={pct}
                                        style={[
                                            styles.quickPercentageBtn,
                                            isDisabled && styles.quickPercentageBtnDisabled,
                                            percentage === pct.toString() && styles.quickPercentageBtnActive,
                                        ]}
                                        onPress={() => !isDisabled && setPercentage(pct.toString())}
                                        disabled={isDisabled}
                                    >
                                        <Text style={[
                                            styles.quickPercentageText,
                                            isDisabled && styles.quickPercentageTextDisabled,
                                            percentage === pct.toString() && styles.quickPercentageTextActive,
                                        ]}>
                                            {pct}%
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Resumen de la selección */}
                        <View style={styles.selectionSummary}>
                            <Text style={styles.summaryTitle}>Resumen</Text>
                            {selectedCC1 && (
                                <View style={styles.summaryRow}>
                                    <View style={[styles.summaryDot, { backgroundColor: '#4F46E5' }]} />
                                    <Text style={styles.summaryText} numberOfLines={1}>
                                        {selectedCC1.value}
                                    </Text>
                                </View>
                            )}
                            {selectedCC2 && (
                                <View style={styles.summaryRow}>
                                    <View style={[styles.summaryDot, { backgroundColor: '#7C3AED' }]} />
                                    <Text style={styles.summaryText} numberOfLines={1}>
                                        {selectedCC2.value}
                                    </Text>
                                </View>
                            )}
                            {selectedCC3 && (
                                <View style={styles.summaryRow}>
                                    <View style={[styles.summaryDot, { backgroundColor: '#A78BFA' }]} />
                                    <Text style={styles.summaryText} numberOfLines={1}>
                                        {selectedCC3.value}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    const getStepTitle = () => {
        switch (modalStep) {
            case 1: return 'Centro de Costo';
            case 2: return 'Sub Centro';
            case 3: return 'SS Centro';
            case 4: return 'Porcentaje';
            default: return '';
        }
    };

    const canGoNext = () => {
        if (modalStep === 1) return !!selectedCC1;
        if (modalStep === 2) return costCenters2.length === 0 ? true : !!selectedCC2;
        if (modalStep === 3) return costCenters3.length === 0 ? true : !!selectedCC3;
        if (modalStep === 4) return parseFloat(percentage) > 0;
        return false;
    };

    const handleNext = () => {
        if (modalStep === 1 && !selectedCC1) {
            Alert.alert('Error', 'Selecciona un centro de costo');
            return;
        }
        if (modalStep === 2 && costCenters2.length > 0 && !selectedCC2) {
            Alert.alert('Error', 'Selecciona un sub centro de costo');
            return;
        }
        if (modalStep === 3 && costCenters3.length > 0 && !selectedCC3) {
            Alert.alert('Error', 'Selecciona un sub sub centro de costo');
            return;
        }
        if (modalStep < 4) {
            // Si no hay opciones en el siguiente nivel, saltar al porcentaje
            if (modalStep === 1 && costCenters2.length === 0 && !loadingCC2) {
                setModalStep(4);
            } else if (modalStep === 2 && costCenters3.length === 0 && !loadingCC3) {
                setModalStep(4);
            } else {
                setModalStep(modalStep + 1);
            }
        } else {
            handleSaveAllocationInModal();
        }
    };

    const handleBack = () => {
        if (modalStep > 1) {
            if (modalStep === 4) {
                // Regresar al último nivel con opciones
                if (costCenters3.length > 0) setModalStep(3);
                else if (costCenters2.length > 0) setModalStep(2);
                else setModalStep(1);
            } else {
                setModalStep(modalStep - 1);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Barra de progreso de porcentaje ── */}
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Porcentaje asignado</Text>
                        <Text style={[
                            styles.progressValue,
                            totalPercentage === 100 && styles.progressValueComplete,
                            totalPercentage > 100 && styles.progressValueError,
                        ]}>
                            {totalPercentage}%
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(totalPercentage, 100)}%`,
                                    backgroundColor: totalPercentage === 100
                                        ? '#059669'
                                        : totalPercentage > 100
                                            ? '#DC2626'
                                            : '#4F46E5',
                                },
                            ]}
                        />
                    </View>
                    {totalPercentage !== 100 && allocations.length > 0 && (
                        <Text style={styles.progressHint}>
                            {totalPercentage < 100
                                ? `Falta asignar ${100 - totalPercentage}%`
                                : 'La suma excede el 100%'}
                        </Text>
                    )}
                </View>

                {/* ── Lista de allocations ── */}
                {allocations.length > 0 ? (
                    allocations.map((alloc, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.allocationCard}
                            onPress={() => handleEditAllocation(index)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.allocationLeft}>
                                <View style={[
                                    styles.percentageBadge,
                                    { backgroundColor: getPercentageColor(alloc.percentage) + '15' }
                                ]}>
                                    <Text style={[
                                        styles.percentageBadgeText,
                                        { color: getPercentageColor(alloc.percentage) }
                                    ]}>
                                        {alloc.percentage}%
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.allocationCenter}>
                                <Text style={styles.allocationCCName} numberOfLines={1}>
                                    {alloc._cc1Label || 'Centro de costo'}
                                </Text>
                                {alloc._cc2Label && (
                                    <Text style={styles.allocationSubCC} numberOfLines={1}>
                                        → {alloc._cc2Label}
                                    </Text>
                                )}
                                {alloc._cc3Label && (
                                    <Text style={styles.allocationSubCC} numberOfLines={1}>
                                        → {alloc._cc3Label}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.allocationActions}>
                                <TouchableOpacity
                                    style={styles.deleteAllocationBtn}
                                    onPress={() => handleDeleteAllocation(index)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="pie-chart-outline" size={48} color="#D1D5DB" />
                        </View>
                        <Text style={styles.emptyTitle}>Sin asignaciones</Text>
                        <Text style={styles.emptyText}>
                            Agrega los centros de costo y el porcentaje que corresponde a cada uno
                        </Text>
                    </View>
                )}

                {/* ── Botón agregar ── */}
                <TouchableOpacity
                    style={[
                        styles.addAllocationBtn,
                        remainingPercentage <= 0 && styles.addAllocationBtnDisabled,
                    ]}
                    onPress={handleAddAllocation}
                    disabled={remainingPercentage <= 0}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={22}
                        color={remainingPercentage <= 0 ? '#D1D5DB' : '#4F46E5'}
                    />
                    <Text style={[
                        styles.addAllocationText,
                        remainingPercentage <= 0 && styles.addAllocationTextDisabled,
                    ]}>
                        Agregar centro de costo
                    </Text>
                </TouchableOpacity>

            </ScrollView>

            {/* ── Botón confirmar ── */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.confirmBtn,
                        totalPercentage !== 100 && styles.confirmBtnDisabled,
                    ]}
                    onPress={handleConfirm}
                    disabled={totalPercentage !== 100}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.confirmBtnText}>
                        Confirmar ({totalPercentage}%)
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ════════════════════════════════════════════ */}
            {/* Modal: Agregar/Editar Allocation              */}
            {/* ════════════════════════════════════════════ */}
            <Modal
                visible={showModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowModal(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingIndex !== null ? 'Editar' : 'Agregar'} Asignación
                            </Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Steps indicator */}
                        <View style={styles.stepsRow}>
                            {[1, 2, 3, 4].map(step => (
                                <View key={step} style={styles.stepContainer}>
                                    <View style={[
                                        styles.stepDot,
                                        modalStep >= step && styles.stepDotActive,
                                        modalStep === step && styles.stepDotCurrent,
                                    ]}>
                                        {modalStep > step ? (
                                            <Ionicons name="checkmark" size={12} color="white" />
                                        ) : (
                                            <Text style={[
                                                styles.stepDotText,
                                                modalStep >= step && styles.stepDotTextActive,
                                            ]}>
                                                {step}
                                            </Text>
                                        )}
                                    </View>
                                    {step < 4 && (
                                        <View style={[
                                            styles.stepLine,
                                            modalStep > step && styles.stepLineActive,
                                        ]} />
                                    )}
                                </View>
                            ))}
                        </View>

                        <Text style={styles.stepLabel}>{getStepTitle()}</Text>

                        {/* Content */}
                        <ScrollView
                            style={styles.modalContent}
                            contentContainerStyle={styles.modalContentInner}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {renderStepContent()}
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            {modalStep > 1 ? (
                                <TouchableOpacity
                                    style={styles.modalBackBtn}
                                    onPress={handleBack}
                                >
                                    <Ionicons name="arrow-back" size={18} color="#6B7280" />
                                    <Text style={styles.modalBackText}>Atrás</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.modalBackBtn}
                                    onPress={() => setShowModal(false)}
                                >
                                    <Text style={styles.modalBackText}>Cancelar</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.modalNextBtn,
                                    !canGoNext() && styles.modalNextBtnDisabled,
                                ]}
                                onPress={handleNext}
                                disabled={!canGoNext() && modalStep === 4}
                            >
                                <Text style={styles.modalNextText}>
                                    {modalStep === 4 ? 'Guardar' : 'Siguiente'}
                                </Text>
                                {modalStep < 4 && (
                                    <Ionicons name="arrow-forward" size={18} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
    );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    text: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
=======
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },

    /* Progress */
    progressSection: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    progressValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4F46E5',
    },
    progressValueComplete: {
        color: '#059669',
    },
    progressValueError: {
        color: '#DC2626',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },

    /* Allocation cards */
    allocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    allocationLeft: {
        marginRight: 14,
    },
    percentageBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 56,
        alignItems: 'center',
    },
    percentageBadgeText: {
        fontSize: 16,
        fontWeight: '700',
    },
    allocationCenter: {
        flex: 1,
    },
    allocationCCName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    allocationSubCC: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 1,
    },
    allocationActions: {
        marginLeft: 8,
    },
    deleteAllocationBtn: {
        padding: 8,
    },

    /* Empty state */
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 30,
    },

    /* Add button */
    addAllocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#EEF2FF',
        borderRadius: 14,
        paddingVertical: 16,
        borderWidth: 1.5,
        borderColor: '#C7D2FE',
        borderStyle: 'dashed',
    },
    addAllocationBtnDisabled: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
    },
    addAllocationText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4F46E5',
    },
    addAllocationTextDisabled: {
        color: '#D1D5DB',
    },

    /* Bottom actions */
    bottomActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    cancelBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    confirmBtn: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        paddingVertical: 16,
    },
    confirmBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    confirmBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },

    /* ═══════════════════════ */
    /* Modal                   */
    /* ═══════════════════════ */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        maxHeight: '90%',
        flexShrink: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },

    /* Steps */
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        marginBottom: 8,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepDotActive: {
        backgroundColor: '#4F46E5',
    },
    stepDotCurrent: {
        borderWidth: 2,
        borderColor: '#312E81',
    },
    stepDotText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    stepDotTextActive: {
        color: 'white',
    },
    stepLine: {
        width: 32,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    stepLineActive: {
        backgroundColor: '#4F46E5',
    },
    stepLabel: {
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
    },

    /* Modal content */
    modalContent: {
        flexShrink: 1,
    },
    modalContentInner: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    modalFieldContainer: {},
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 10,
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 6,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    optionItemSelected: {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
    },
    optionItemText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
        marginRight: 8,
    },
    optionItemTextSelected: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    noOptionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 24,
        justifyContent: 'center',
    },
    noOptionsText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    selectorLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 24,
        justifyContent: 'center',
    },
    selectorLoadingText: {
        fontSize: 14,
        color: '#6B7280',
    },

    /* Percentage input */
    percentageInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    percentageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4F46E5',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    percentageInput: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        minWidth: 60,
        textAlign: 'center',
    },
    percentageSymbol: {
        fontSize: 22,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 4,
    },
    percentageHint: {
        fontSize: 13,
        color: '#6B7280',
    },
    quickPercentageRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    quickPercentageBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickPercentageBtnDisabled: {
        opacity: 0.4,
    },
    quickPercentageBtnActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#4F46E5',
    },
    quickPercentageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    quickPercentageTextDisabled: {
        color: '#D1D5DB',
    },
    quickPercentageTextActive: {
        color: '#4F46E5',
    },

    /* Selection summary */
    selectionSummary: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    summaryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    summaryText: {
        fontSize: 13,
        color: '#374151',
        flex: 1,
    },

    /* Modal actions */
    modalActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        bottom: 32,
    },
    modalBackBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalBackText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    modalNextBtn: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        paddingVertical: 14,
    },
    modalNextBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    modalNextText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
});
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
