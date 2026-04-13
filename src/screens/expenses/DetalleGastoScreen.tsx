import { useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Platform,
    Linking
} from 'react-native';
import {
    Text,
    ActivityIndicator,
} from 'react-native-paper';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getExpenseById } from '../../services/Gastos';
import type { IExpense } from '../../types';

export default function DetalleGastoScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;
    const [showImageModal, setShowImageModal] = useState(false);
    const [expense, setExpense] = useState<IExpense | null>(null);

    const getGasto = () => {
        getExpenseById(id)
            .then((res) => {
                const data = res.data;
                setExpense({
                    ...data,
                    // La API devuelve "edited" pero IExpense usa "modified"
                    modified: data.edited,
                    // La API devuelve "modifiedAt" pero IExpense usa "updatedAt"
                    updatedAt: data.modifiedAt,
                    // La API devuelve "costCenterAllocations" pero IExpense usa "allocations"
                    allocations: Array.isArray(data.costCenterAllocations)
                        ? data.costCenterAllocations.map((a: any) => ({
                            costCenterId: a.costCenterId,
                            costCenterName: a.costCenterName,
                            subCostCenterId: a.subCostCenterId,
                            subCostCenterName: a.subCostCenterName,
                            subSubCostCenterId: a.subSubCostCenterId,
                            subSubCostCenterName: a.subSubCostCenterName,
                            percentage: a.percentage,
                        }))
                        : [],
                    items: Array.isArray(data.items)
                        ? data.items.map((item: any) => ({
                            ...item,
                            quantity: Number(item.quantity ?? 0),
                            unitPrice: Number(item.unitPrice ?? 0),
                            subtotal: Number(item.subtotal ?? 0),
                        }))
                        : [],
                });
            })
            .catch((error) => {
                alert('Error: ' + error.message);
            });
    };

    useEffect(() => {
        getGasto();
    }, [id]);



    const categoriaConfig = {
        movilidad: { name: 'car', color: '#60A5FA', bg: '#EFF6FF', text: 'Movilidad' },
        hospedaje: { name: 'bed', color: '#A78BFA', bg: '#F5F3FF', text: 'Hospedaje' },
        alimentacion: { name: 'restaurant', color: '#F87171', bg: '#FEF2F2', text: 'Alimentación' },
        transporte_aereo: { name: 'restaurant', color: '#F87171', bg: '#FEF2F2', text: 'Transporte Aéreo' },
        transporte_terrestre: { name: 'restaurant', color: '#F87171', bg: '#FEF2F2', text: 'Transporte Terrestre' },
        alquiler_vehiculo: { name: 'restaurant', color: '#F87171', bg: '#FEF2F2', text: 'Alquiler de Vehículo' },
        alquiler_herramientas: { name: 'restaurant', color: '#F87171', bg: '#FEF2F2', text: 'Alquiler de Herramientas' },
        materiales: { name: 'ellipsis-horizontal', color: '#FBBF24', bg: '#FFFBEB', text: 'Materiales' },
        epps: { name: 'ellipsis-horizontal', color: '#FBBF24', bg: '#FFFBEB', text: 'EPPs' },
        otros: { name: 'ellipsis-horizontal', color: '#FBBF24', bg: '#FFFBEB', text: 'Otros' },
    };
    const handleEditGasto = () => {
        navigation.navigate('editar', { expense });
    };

    const formatDate = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatAmount = (total: number) => {
        const currencyCode = expense?.currencyCode ?? 'PEN';
        const symbol = currencyCode === 'USD' ? '$' : 'S/';
        return `${symbol}${total ? total.toFixed(2) : '0.00'}`;
    };

    const calculateSubtotal = () => {
        return expense.total - expense.igv;
    };

    if (!expense) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator animating size="large" />
                <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
        );
    }

    const getTipo = {
        viatico: 'Viático',
        compra: 'Compra',
    };

    const expenseType = expense.type ?? 'viatico';
    const expenseCategory = expense.category ?? 'otros';
    const businessName = expense.businessName ?? '';
    const expenseDate = expense.expenseDate ?? new Date();
    const currencyCode = expense.currencyCode ?? 'PEN';
    const address = expense.address ?? '';
    const discount = expense.discount ?? 0;
    const detraction = expense.detraction ?? 0;
    const imageUrl = expense.imageUrl ?? '';
    const hasReceipt = Boolean(expense.hasReceipt ?? false);
    const receiptDetail = String(expense.receiptDetail ?? '');
    const description = String(expense.descrip ?? '');
    const catConfig = categoriaConfig[expenseCategory] || categoriaConfig.otros;

    const hasCostCenters = expense.allocations?.length > 0;
    const isPDF = imageUrl.toLowerCase().endsWith('.pdf') ||
        imageUrl.includes('application/pdf');
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={22} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Detalle del gasto</Text>

                <TouchableOpacity
                    style={styles.editHeaderBtn}
                    onPress={handleEditGasto}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={18} color="#4F46E5" />
                    <Text style={styles.editHeaderBtnText}>Editar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero Card ── */}
                <View style={styles.heroCard}>
                    <View style={styles.heroTop}>
                        <View style={[styles.catIconCircle, { backgroundColor: catConfig.bg }]}>
                            <Ionicons name={catConfig.name} size={24} color={catConfig.color} />
                        </View>
                        <View style={styles.heroBadges}>
                            <View style={[styles.tipoBadge, { backgroundColor: catConfig.bg }]}>
                                <Text style={[styles.tipoBadgeText, { color: catConfig.color }]}>
                                    {getTipo[expenseType] || expenseType}
                                </Text>
                            </View>
                            <View style={[styles.tipoBadge, { backgroundColor: catConfig.bg }]}>
                                <View style={[styles.catDotSmall, { backgroundColor: catConfig.color }]} />
                                <Text style={[styles.tipoBadgeText, { color: catConfig.color }]}>
                                    {catConfig.text}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.mainAmount}>{formatAmount(expense.total)}</Text>
                    <Text style={styles.establishmentName}>{businessName}</Text>
                    <Text style={styles.heroDate}>
                        {formatDate(expenseDate)} · {formatTime(expenseDate)}
                    </Text>

                    {expense.modified && (
                        <View style={styles.modifiedBadge}>
                            <Ionicons name="alert-circle" size={13} color="#D97706" />
                            <Text style={styles.modifiedText}>Modificado después del registro</Text>
                        </View>
                    )}
                </View>

                {/* ── Detalles ── */}
                <View style={styles.card}>
                    <SectionHeader icon="receipt-outline" title="Detalles" />
                    <View style={styles.cardBody}>
                        <DetailRow label="RUC" value={expense.ruc} mono />
                        <DetailRow label="Moneda" value={currencyCode} />
                        {address && (
                            <DetailRow label="Dirección" value={address} valueLines={2} />
                        )}
                    </View>
                </View>

                {/* ── Centro de Costo ── */}
                {hasCostCenters && (
                    <View style={styles.card}>
                        <SectionHeader icon="git-branch-outline" title="Centro de Costo" />
                        <View style={styles.cardBody}>
                            {expense.allocations.map((alloc, index) => (
                                <View key={index}>
                                    {expense.allocations.length > 1 && (
                                        <View style={styles.allocationPctRow}>
                                            <Ionicons name="pie-chart-outline" size={13} color="#6B7280" />
                                            <Text style={styles.allocationPctText}>Asignación {index + 1} · {alloc.percentage}%</Text>
                                        </View>
                                    )}
                                    <View style={styles.ccTimeline}>
                                        {alloc.costCenterId != null && (
                                            <CostCenterNode
                                                label="Centro de Costo"
                                                code={String(alloc.costCenterId)}
                                                description={alloc.costCenterName ?? ''}
                                                level={1}
                                                isLast={alloc.subCostCenterId == null}
                                            />
                                        )}
                                        {alloc.subCostCenterId != null && (
                                            <CostCenterNode
                                                label="Sub Centro de Costo"
                                                code={String(alloc.subCostCenterId)}
                                                description={alloc.subCostCenterName ?? ''}
                                                level={2}
                                                isLast={alloc.subSubCostCenterId == null}
                                            />
                                        )}
                                        {alloc.subSubCostCenterId != null && (
                                            <CostCenterNode
                                                label="Sub Sub Centro de Costo"
                                                code={String(alloc.subSubCostCenterId)}
                                                description={alloc.subSubCostCenterName ?? ''}
                                                level={3}
                                                isLast
                                            />
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── Montos ── */}
                <View style={styles.card}>
                    <SectionHeader icon="calculator-outline" title="Montos" />
                    <View style={styles.cardBody}>
                        <DetailRow label="Subtotal" value={formatAmount(calculateSubtotal())} />
                        <DetailRow label="IGV (18%)" value={formatAmount(expense.igv)} />
                        {discount > 0 && (
                            <DetailRow
                                label="Descuento"
                                value={`-${formatAmount(discount)}`}
                                valueColor="#059669"
                            />
                        )}
                        {detraction > 0 && (
                            <DetailRow label="Detracción" value={formatAmount(detraction)} />
                        )}
                        <View style={styles.totalDivider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>{formatAmount(expense.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Items ── */}
                {expense.items && expense.items.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
                            <SectionHeader icon="list-outline" title="Items" />
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{expense.items.length}</Text>
                            </View>
                        </View>
                        <View style={styles.cardBody}>
                            {expense.items.map((item, index) => (
                                <View key={index}>
                                    {index > 0 && <View style={styles.itemSeparator} />}
                                    <View style={styles.itemRow}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemDesc}>{item.descrip ?? ''}</Text>
                                            <Text style={styles.itemQty}>
                                                {Number(item.quantity ?? item.quantity ?? 0)} × {formatAmount(Number(item.unitPrice ?? item.unitPrice ?? 0))}
                                            </Text>
                                        </View>
                                        <Text style={styles.itemTotal}>
                                            {formatAmount(Number(item.subtotal ?? 0))}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.card}>
                    <SectionHeader icon="document-outline" title="Comprobante" />
                    <View style={styles.cardBody}>
                        {imageUrl ? (
                            isPDF ? (
                                // Vista para PDF
                                <TouchableOpacity
                                    style={styles.pdfContainer}
                                    onPress={() => Linking.openURL(imageUrl)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.pdfIconCircle}>
                                        <Ionicons name="document-text" size={36} color="#4F46E5" />
                                    </View>
                                    <View style={styles.pdfInfo}>
                                        <Text style={styles.pdfTitle}>Comprobante PDF</Text>
                                        <Text style={styles.pdfSubtitle}>Toca para abrir</Text>
                                    </View>
                                    <View style={styles.pdfArrow}>
                                        <Ionicons name="open-outline" size={18} color="#4F46E5" />
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                // Vista para imagen (código existente)
                                <TouchableOpacity
                                    style={styles.receiptContainer}
                                    onPress={() => setShowImageModal(true)}
                                    activeOpacity={0.85}
                                >
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.receiptImage}
                                        contentFit="contain"
                                    />
                                    <View style={styles.receiptOverlay}>
                                        <Ionicons name="expand-outline" size={14} color="#fff" />
                                        <Text style={styles.receiptOverlayText}>Ampliar</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        ) : (
                            <View style={styles.noImage}>
                                <View style={styles.noImageCircle}>
                                    <Ionicons name="image-outline" size={28} color="#D1D5DB" />
                                </View>
                                <Text style={styles.noImageTitle}>Sin comprobante</Text>
                                <Text style={styles.noImageSubtitle}>No se adjuntó imagen</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Sustento ── */}
                {hasReceipt && receiptDetail && (
                    <View style={styles.card}>
                        <SectionHeader icon="document-text-outline" title="Sustento del gasto" color="#4F46E5" />
                        <View style={styles.cardBody}>
                            <View style={styles.textBox}>
                                <Text style={styles.textBoxContent}>{receiptDetail}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Descripción ── */}
                {description && (
                    <View style={styles.card}>
                        <SectionHeader icon="chatbox-ellipses-outline" title="Descripción" />
                        <View style={styles.cardBody}>
                            <View style={styles.textBox}>
                                <Text style={styles.textBoxContent}>{description}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Meta info ── */}
                <View style={styles.metaSection}>
                    <Text style={styles.metaText}>
                        Creado el {formatDate(expense.createdAt)} · {formatTime(expense.createdAt)}
                    </Text>
                    {expense.updatedAt && expense.createdAt !== expense.updatedAt && (
                        <Text style={styles.metaText}>
                            Actualizado el {formatDate(expense.updatedAt)}
                        </Text>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Modal imagen completa ── */}
            <Modal
                visible={showImageModal}
                transparent
                onRequestClose={() => setShowImageModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <ImageViewer
                        imageUrls={[{ url: imageUrl }]}
                        onCancel={() => setShowImageModal(false)}
                        enableSwipeDown
                        onSwipeDown={() => setShowImageModal(false)}
                        backgroundColor="#000"
                        renderIndicator={() => null}
                        saveToLocalByLongPress={false}   // evita conflicto con long press
                        onClick={() => setShowImageModal(false)}  // tap en imagen también cierra
                    />
                    {/* Botón de cierre absolutamente posicionado, FUERA del ImageViewer */}
                    <View style={{
                        position: 'absolute',
                        top: Platform.OS === 'ios' ? 54 : 20,
                        left: 0,
                        right: 0,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 20,
                        zIndex: 9999,
                        elevation: 10,              // importante para Android
                        pointerEvents: 'box-none',  // permite tocar a través excepto en hijos
                    }}>
                        <Text style={styles.imgModalTitle}>Comprobante</Text>
                        <TouchableOpacity
                            onPress={() => setShowImageModal(false)}
                            hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                borderRadius: 24,
                                padding: 10,          // más grande (era 6)
                                minWidth: 48,         // área mínima táctil
                                minHeight: 48,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

/* ── SectionHeader ── */
function SectionHeader({ icon, title, color = '#374151' }: { icon: string; title: string; color?: string }) {
    return (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={17} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        </View>
    );
}

/* ── DetailRow ── */
function DetailRow({ label, value, valueColor = '#111827', valueLines = 1, mono = false }: { label: string; value: string; valueColor?: string; valueLines?: number; mono?: boolean }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text
                style={[
                    styles.detailValue,
                    { color: valueColor },
                    mono && styles.monoText,
                ]}
                numberOfLines={valueLines}
            >
                {value}
            </Text>
        </View>
    );
}

/* ── CostCenterNode (timeline style) ── */
function CostCenterNode({ label, code, description, level, isLast }: { label: string; code: string; description: string; level: number; isLast?: boolean }) {
    const levelConfig = {
        1: { color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE', codeBg: '#BFDBFE' },
        2: { color: '#16A34A', bg: '#F0FDF4', border: '#DCFCE7', codeBg: '#BBF7D0' },
        3: { color: '#CA8A04', bg: '#FEFCE8', border: '#FEF9C3', codeBg: '#FEF08A' },
    };

    const config = levelConfig[level] || levelConfig[1];

    return (
        <View style={styles.ccNodeWrapper}>
            {/* Timeline dot + line */}
            <View style={styles.ccTimelineTrack}>
                <View style={[styles.ccNodeDot, { backgroundColor: config.color }]} />
                {!isLast && <View style={styles.ccNodeLine} />}
            </View>

            {/* Content */}
            <View style={[styles.ccNodeContent, { backgroundColor: config.bg, borderColor: config.border }]}>
                <Text style={styles.ccNodeLabel}>{label}</Text>
                <View style={styles.ccNodeRow}>
                    <View style={[styles.ccNodeCodeBadge, { backgroundColor: config.codeBg }]}>
                        <Text style={[styles.ccNodeCodeText, { color: config.color }]}>{code}</Text>
                    </View>
                    <Text style={[styles.ccNodeDescription, { color: config.color }]} numberOfLines={2}>
                        {description}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 14,
        fontSize: 15,
        color: '#6B7280',
    },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    editHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    editHeaderBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F46E5',
    },

    /* ── Hero Card ── */
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    catIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroBadges: {
        flexDirection: 'row',
        gap: 6,
    },
    tipoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tipoBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    catDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    mainAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -1,
        marginBottom: 4,
    },
    establishmentName: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 4,
    },
    heroDate: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
    modifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 14,
    },
    modifiedText: {
        fontSize: 12,
        color: '#D97706',
        fontWeight: '600',
    },

    /* ── Cards ── */
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },

    /* ── Detail rows ── */
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 9,
    },
    detailLabel: {
        fontSize: 14,
        color: '#9CA3AF',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
        textAlign: 'right',
        flex: 1.2,
    },
    monoText: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 0.5,
    },

    /* ── Total ── */
    totalDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginTop: 6,
        marginBottom: 2,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },

    /* ── Centro de Costo (timeline) ── */
    allocationPctRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 6,
        marginTop: 4,
    },
    allocationPctText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    ccTimeline: {
        gap: 0,
    },
    ccNodeWrapper: {
        flexDirection: 'row',
        minHeight: 60,
    },
    ccTimelineTrack: {
        width: 24,
        alignItems: 'center',
        paddingTop: 2,
    },
    ccNodeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        zIndex: 1,
    },
    ccNodeLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginTop: 2,
        marginBottom: -2,
    },
    ccNodeContent: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        marginLeft: 4,
    },
    ccNodeLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 5,
    },
    ccNodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ccNodeCodeBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 5,
    },
    ccNodeCodeText: {
        fontSize: 11.5,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    ccNodeDescription: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },

    /* ── Items ── */
    countBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    itemInfo: {
        flex: 1,
        marginRight: 16,
    },
    itemDesc: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
        marginBottom: 3,
    },
    itemQty: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    itemTotal: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '700',
    },
    itemSeparator: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },

    /* ── Comprobante ── */
    receiptContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F9FAFB',
        position: 'relative',
    },
    receiptImage: {
        width: '100%',
        height: 220,
    },
    receiptOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    receiptOverlayText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    noImage: {
        alignItems: 'center',
        paddingVertical: 32,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
    },
    noImageCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    noImageTitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    noImageSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },

    /* ── Text boxes ── */
    textBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    textBoxContent: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 21,
    },

    /* ── Meta info ── */
    metaSection: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    metaText: {
        fontSize: 12,
        color: '#D1D5DB',
        lineHeight: 18,
    },

    /* ── Modal imagen ── */
    imgModalTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    pdfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
        padding: 16,
        gap: 12,
    },
    pdfIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    pdfInfo: {
        flex: 1,
    },
    pdfTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3730A3',
        marginBottom: 2,
    },
    pdfSubtitle: {
        fontSize: 12,
        color: '#6366F1',
    },
    pdfArrow: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
