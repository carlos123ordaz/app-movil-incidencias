<<<<<<< HEAD
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function VoiceExpenseScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registro por voz</Text>
            <Text style={styles.text}>Esta pantalla todavía no está implementada en esta versión.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    text: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
=======
import { useState, useRef, useEffect, useContext } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Animated,
    ScrollView,
    TextInput,
    Modal,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MainContext } from '../../contexts/MainContextApp';
import type { IMainContext, IExpenseFormData } from '../../types';
import moment from 'moment';
import { voiceToExpense } from '../../services/Gastos';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { SafeAreaView } from 'react-native-safe-area-context';

const VOICE_EXAMPLES = [
    {
        icon: 'restaurant',
        color: '#F87171',
        title: 'Alimentación',
        example: '"Almuerzo en restaurante El Buen Sabor por 35 soles, RUC 20123456789"',
    },
    {
        icon: 'car',
        color: '#60A5FA',
        title: 'Movilidad',
        example: '"Taxi del aeropuerto al hotel, 25 soles"',
    },
    {
        icon: 'bed',
        color: '#A78BFA',
        title: 'Hospedaje',
        example: '"Hotel San Martín, 2 noches a 150 soles cada una, total 300 soles"',
    },
    {
        icon: 'cart',
        color: '#34D399',
        title: 'Compras',
        example: '"Compra de 3 cascos de seguridad a 45 soles cada uno, total 135 soles en dólares"',
    },
    {
        icon: 'receipt',
        color: '#FBBF24',
        title: 'Con detalles',
        example: '"Cena en La Rosa Náutica, 2 platos de fondo a 65 soles y 2 bebidas a 15 soles, total 160 con IGV de 24.41, RUC 20987654321"',
    },
];

const TIPS = [
    'Menciona el monto total del gasto',
    'Indica la moneda si no es soles (ej: "en dólares")',
    'Describe qué compraste o el servicio',
    'Agrega el RUC si lo tienes',
    'Puedes mencionar varios items con cantidades',
];

export default function VoiceExpenseScreen() {
    const navigation = useNavigation<any>();
    const { taskId, userData } = useContext(MainContext) as IMainContext;

    // ── State ──
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [partialTranscription, setPartialTranscription] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<IExpenseFormData | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // ── Animations ──
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnim1 = useRef(new Animated.Value(0)).current;
    const waveAnim2 = useRef(new Animated.Value(0)).current;
    const waveAnim3 = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    // ── Permisos ──
    useEffect(() => {
        checkPermissions();
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const checkPermissions = async () => {
        const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
        if (result.granted) {
            setPermissionGranted(true);
        } else {
            const permResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            setPermissionGranted(permResult.granted);
        }
    };

    // ── Speech Recognition Events ──
    useSpeechRecognitionEvent('start', () => {
        setIsListening(true);
        setError(null);
    });

    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);
        stopAnimations();
    });

    useSpeechRecognitionEvent('result', (event) => {
        const text = event.results[0]?.transcript || '';
        if (event.isFinal) {
            setTranscription(prev => {
                const updated = prev ? `${prev} ${text}` : text;
                return updated.trim();
            });
            setPartialTranscription('');
        } else {
            setPartialTranscription(text);
        }
    });

    useSpeechRecognitionEvent('error', (event) => {
        console.error('Speech error:', event);
        setIsListening(false);
        stopAnimations();
        if (event.error !== 'no-speech') {
            setError('No se pudo reconocer la voz. Intenta de nuevo.');
        }
    });

    // ── Animaciones del micrófono ──
    const startAnimations = () => {
        // Pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Waves
        const createWave = (anim, delay) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );

        createWave(waveAnim1, 0).start();
        createWave(waveAnim2, 400).start();
        createWave(waveAnim3, 800).start();
    };

    const stopAnimations = () => {
        pulseAnim.stopAnimation();
        waveAnim1.stopAnimation();
        waveAnim2.stopAnimation();
        waveAnim3.stopAnimation();
        pulseAnim.setValue(1);
        waveAnim1.setValue(0);
        waveAnim2.setValue(0);
        waveAnim3.setValue(0);
    };

    // ── Iniciar/Detener reconocimiento ──
    const handleToggleListening = async () => {
        if (!permissionGranted) {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos acceso al micrófono para reconocer tu voz.'
                );
                return;
            }
            setPermissionGranted(true);
        }

        if (isListening) {
            ExpoSpeechRecognitionModule.stop();
            stopAnimations();
        } else {
            setError(null);
            setPartialTranscription('');
            startAnimations();

            ExpoSpeechRecognitionModule.start({
                lang: 'es-PE',
                interimResults: true,
                continuous: true,
                maxAlternatives: 1,
            });
        }
    };

    // ── Procesar con Gemini ──
    const handleProcess = async () => {
        const textToProcess = transcription.trim();
        if (!textToProcess) {
            Alert.alert('Sin texto', 'Dicta o escribe la descripción del gasto primero.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const response = await voiceToExpense(textToProcess);
            const data = response.data;

            if (!data.isValid) {
                setError(data.errorMessage || 'No se pudo interpretar como un gasto válido.');
                setIsProcessing(false);
                return;
            }

            setExtractedData({
                ...data,
                descrip: data.descrip || data.description || '',
                expenseDate: data.issueDate ?? data.expenseDate ?? new Date().toISOString(),
                items: (data.items || []).map((item: any) => ({
                    descrip: item.descrip || item.description || '',
                    unitOfMeasure: item.unitOfMeasure || '',
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                })),
            });
            setShowResult(true);
        } catch (err) {
            console.error('Error procesando voz:', JSON.stringify(err));
            setError('Error al procesar. Verifica tu conexión e intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Guardar gasto directamente ──
    const handleSaveExpense = async () => {
        if (!extractedData) return;
        if (!taskId) {
            Alert.alert('Error', 'No hay tarea asignada. Selecciona una tarea primero.');
            return;
        }

        // Navegar al formulario de agregar gasto con los datos pre-llenados
        // para que el usuario pueda asignar centros de costo y revisar
        navigation.navigate('agregar-gasto', {
            prefillData: ({
                ...extractedData,
                expenseDate: extractedData.expenseDate
                    ? new Date(extractedData.expenseDate)
                    : new Date(),
            }),
        });

        setShowResult(false);
        resetState();
    };

    // ── Reset ──
    const resetState = () => {
        setTranscription('');
        setPartialTranscription('');
        setExtractedData(null);
        setError(null);
    };

    // ── Helpers de display ──
    const getCategoriaInfo = (cat) => {
        const map = {
            alimentacion: { icon: 'restaurant', label: 'Alimentación', color: '#F87171' },
            movilidad: { icon: 'car', label: 'Movilidad', color: '#60A5FA' },
            hospedaje: { icon: 'bed', label: 'Hospedaje', color: '#A78BFA' },
            transporte_aereo: { icon: 'airplane', label: 'Transporte Aéreo', color: '#38BDF8' },
            transporte_terrestre: { icon: 'bus', label: 'Transporte Terrestre', color: '#34D399' },
            alquiler_vehiculo: { icon: 'car-sport', label: 'Alquiler Vehículo', color: '#FB923C' },
            alquiler_herramientas: { icon: 'hammer', label: 'Alq. Herramientas', color: '#A3A3A3' },
            materiales: { icon: 'cube', label: 'Materiales', color: '#FBBF24' },
            EPPs: { icon: 'shield-checkmark', label: 'EPPs', color: '#2DD4BF' },
            otros: { icon: 'ellipsis-horizontal', label: 'Otros', color: '#9CA3AF' },
        };
        return map[cat] || map.otros;
    };

    const getMonedaSymbol = (moneda) => {
        if (moneda === 'USD') return '$';
        if (moneda === 'EUR') return '€';
        return 'S/';
    };

    // ── Render wave ──
    const renderWave = (anim, size) => (
        <Animated.View
            style={[
                styles.wave,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    opacity: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 0],
                    }),
                    transform: [
                        {
                            scale: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 2],
                            }),
                        },
                    ],
                },
            ]}
        />
    );

    // ═══════════════════════════════════════════
    // ── MAIN RENDER ──
    // ═══════════════════════════════════════════
    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeIn }]}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={22} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gasto por Voz</Text>
                    <TouchableOpacity
                        style={styles.guideBtn}
                        onPress={() => setShowGuide(true)}
                    >
                        <Ionicons name="help-circle-outline" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                </View>

                {/* ── Instruction banner ── */}
                <View style={styles.instructionBanner}>
                    <Ionicons name="mic" size={18} color="#4F46E5" />
                    <Text style={styles.instructionText}>
                        Dicta tu gasto con el monto, categoría y detalles
                    </Text>
                </View>

                {/* ── Transcription area ── */}
                <View style={styles.transcriptionContainer}>
                    <View style={styles.transcriptionHeader}>
                        <Text style={styles.transcriptionLabel}>Descripción del gasto</Text>
                        {transcription.length > 0 && (
                            <TouchableOpacity onPress={resetState}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TextInput
                        style={styles.transcriptionInput}
                        value={
                            transcription +
                            (partialTranscription ? ` ${partialTranscription}` : '')
                        }
                        onChangeText={setTranscription}
                        placeholder='Ej: "Almuerzo en restaurante por 45 soles"'
                        placeholderTextColor="#C7C7CC"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    {isListening && (
                        <View style={styles.listeningBadge}>
                            <View style={styles.listeningDot} />
                            <Text style={styles.listeningText}>Escuchando...</Text>
                        </View>
                    )}
                </View>

                {/* ── Error ── */}
                {error && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color="#DC2626" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* ── Mic button area ── */}
                <View style={styles.micArea}>
                    <View style={styles.micContainer}>
                        {isListening && renderWave(waveAnim1, 140)}
                        {isListening && renderWave(waveAnim2, 180)}
                        {isListening && renderWave(waveAnim3, 220)}
                        <Animated.View
                            style={[
                                styles.micButton,
                                isListening && styles.micButtonActive,
                                { transform: [{ scale: pulseAnim }] },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.micTouchable}
                                onPress={handleToggleListening}
                                activeOpacity={0.7}
                                disabled={isProcessing}
                            >
                                <Ionicons
                                    name={isListening ? 'stop' : 'mic'}
                                    size={32}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                    <Text style={styles.micHint}>
                        {isListening
                            ? 'Toca para detener'
                            : 'Toca para hablar'}
                    </Text>
                </View>

                {/* ── Process button ── */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[
                            styles.processButton,
                            (!transcription.trim() || isProcessing) && styles.processButtonDisabled,
                        ]}
                        onPress={handleProcess}
                        disabled={!transcription.trim() || isProcessing}
                        activeOpacity={0.8}
                    >
                        {isProcessing ? (
                            <>
                                <ActivityIndicator size="small" color="white" />
                                <Text style={styles.processButtonText}>Procesando...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={20} color="white" />
                                <Text style={styles.processButtonText}>
                                    Procesar con IA
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* ════════════════════════════════════════════ */}
            {/* Modal: Guía de dictado                       */}
            {/* ════════════════════════════════════════════ */}
            <Modal
                visible={showGuide}
                animationType="slide"
                transparent
                onRequestClose={() => setShowGuide(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.guideSheet}>
                        <View style={styles.sheetHandle} />

                        <View style={styles.guideHeader}>
                            <View style={styles.guideIconCircle}>
                                <Ionicons name="mic-outline" size={28} color="#4F46E5" />
                            </View>
                            <Text style={styles.guideTitle}>¿Cómo dictar tu gasto?</Text>
                            <Text style={styles.guideSubtitle}>
                                Sigue estos ejemplos para mejores resultados
                            </Text>
                        </View>

                        <ScrollView
                            style={styles.guideContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Tips */}
                            <View style={styles.tipsCard}>
                                <Text style={styles.tipsTitle}>
                                    <Ionicons name="bulb" size={16} color="#F59E0B" /> Tips
                                </Text>
                                {TIPS.map((tip, i) => (
                                    <View key={i} style={styles.tipRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Examples */}
                            <Text style={styles.examplesTitle}>Ejemplos por categoría</Text>
                            {VOICE_EXAMPLES.map((item, i) => (
                                <View key={i} style={styles.exampleCard}>
                                    <View style={styles.exampleHeader}>
                                        <View style={[styles.exampleIcon, { backgroundColor: item.color + '15' }]}>
                                            <Ionicons name={item.icon} size={18} color={item.color} />
                                        </View>
                                        <Text style={styles.exampleTitle}>{item.title}</Text>
                                    </View>
                                    <Text style={styles.exampleText}>{item.example}</Text>
                                </View>
                            ))}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.guideCloseBtn}
                            onPress={() => setShowGuide(false)}
                        >
                            <Text style={styles.guideCloseBtnText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ════════════════════════════════════════════ */}
            {/* Modal: Resultado procesado                   */}
            {/* ════════════════════════════════════════════ */}
            <Modal
                visible={showResult && extractedData !== null}
                animationType="slide"
                transparent
                onRequestClose={() => setShowResult(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.resultSheet}>
                        <View style={styles.sheetHandle} />

                        <ScrollView
                            style={styles.resultContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Success header */}
                            <View style={styles.resultHeader}>
                                <View style={styles.successCircle}>
                                    <Ionicons name="checkmark" size={28} color="#059669" />
                                </View>
                                <Text style={styles.resultTitle}>Gasto reconocido</Text>
                                <Text style={styles.resultSubtitle}>
                                    Revisa los datos y confirma para continuar
                                </Text>
                            </View>

                            {extractedData && (
                                <>
                                    {/* Total */}
                                    <View style={styles.resultTotalCard}>
                                        <Text style={styles.resultTotalLabel}>Total</Text>
                                        <Text style={styles.resultTotalAmount}>
                                            {getMonedaSymbol(extractedData.currencyCode)}{' '}
                                            {(extractedData.total || 0).toLocaleString('es-PE', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </Text>
                                        <View style={styles.resultBadgeRow}>
                                            {(() => {
                                                const cat = getCategoriaInfo(extractedData.category);
                                                return (
                                                    <View style={[styles.resultBadge, { backgroundColor: cat.color + '15' }]}>
                                                        <Ionicons name={cat.icon} size={14} color={cat.color} />
                                                        <Text style={[styles.resultBadgeText, { color: cat.color }]}>
                                                            {cat.label}
                                                        </Text>
                                                    </View>
                                                );
                                            })()}
                                            <View style={[styles.resultBadge, { backgroundColor: '#EFF6FF' }]}>
                                                <Text style={[styles.resultBadgeText, { color: '#3B82F6' }]}>
                                                    {extractedData.currencyCode}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Details */}
                                    <View style={styles.resultDetailsCard}>
                                        {extractedData.descrip && (
                                            <View style={styles.resultField}>
                                                <Text style={styles.resultFieldLabel}>Descripción</Text>
                                                <Text style={styles.resultFieldValue}>
                                                    {extractedData.descrip}
                                                </Text>
                                            </View>
                                        )}
                                        {extractedData.businessName && (
                                            <View style={styles.resultField}>
                                                <Text style={styles.resultFieldLabel}>Razón Social</Text>
                                                <Text style={styles.resultFieldValue}>
                                                    {extractedData.businessName}
                                                </Text>
                                            </View>
                                        )}
                                        {extractedData.ruc && (
                                            <View style={styles.resultField}>
                                                <Text style={styles.resultFieldLabel}>RUC</Text>
                                                <Text style={styles.resultFieldValue}>
                                                    {extractedData.ruc}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.resultField}>
                                            <Text style={styles.resultFieldLabel}>Fecha</Text>
                                            <Text style={styles.resultFieldValue}>
                                                {extractedData.expenseDate
                                                    ? moment(extractedData.expenseDate).format('DD/MM/YYYY')
                                                    : 'Hoy'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Items */}
                                    {extractedData.items && extractedData.items.length > 0 && (
                                        <View style={styles.resultItemsCard}>
                                            <Text style={styles.resultItemsTitle}>
                                                Items ({extractedData.items.length})
                                            </Text>
                                            {extractedData.items.map((item, i) => (
                                                <View key={i} style={styles.resultItem}>
                                                    <View style={styles.resultItemInfo}>
                                                        <Text style={styles.resultItemName}>
                                                            {item.descrip}
                                                        </Text>
                                                        <Text style={styles.resultItemDetail}>
                                                            {item.quantity} × {getMonedaSymbol(extractedData.currencyCode)}{' '}
                                                            {(item.unitPrice || 0).toFixed(2)}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.resultItemAmount}>
                                                        {getMonedaSymbol(extractedData.currencyCode)}{' '}
                                                        {(item.subtotal || 0).toFixed(2)}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Montos adicionales */}
                                    {(extractedData.igv > 0 || extractedData.discount > 0 || extractedData.detraction > 0) && (
                                        <View style={styles.resultExtrasCard}>
                                            {extractedData.igv > 0 && (
                                                <View style={styles.resultExtraRow}>
                                                    <Text style={styles.resultExtraLabel}>IGV</Text>
                                                    <Text style={styles.resultExtraValue}>
                                                        {getMonedaSymbol(extractedData.currencyCode)} {extractedData.igv.toFixed(2)}
                                                    </Text>
                                                </View>
                                            )}
                                            {extractedData.discount > 0 && (
                                                <View style={styles.resultExtraRow}>
                                                    <Text style={styles.resultExtraLabel}>Descuento</Text>
                                                    <Text style={[styles.resultExtraValue, { color: '#059669' }]}>
                                                        -{getMonedaSymbol(extractedData.currencyCode)} {extractedData.discount.toFixed(2)}
                                                    </Text>
                                                </View>
                                            )}
                                            {extractedData.detraction > 0 && (
                                                <View style={styles.resultExtraRow}>
                                                    <Text style={styles.resultExtraLabel}>Detracción</Text>
                                                    <Text style={styles.resultExtraValue}>
                                                        {getMonedaSymbol(extractedData.currencyCode)} {extractedData.detraction.toFixed(2)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </>
                            )}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* Actions */}
                        <View style={styles.resultActions}>
                            <TouchableOpacity
                                style={styles.resultCancelBtn}
                                onPress={() => setShowResult(false)}
                            >
                                <Ionicons name="arrow-back" size={18} color="#6B7280" />
                                <Text style={styles.resultCancelText}>Volver a editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.resultConfirmBtn}
                                onPress={handleSaveExpense}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="white" />
                                <Text style={styles.resultConfirmText}>Continuar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════
// ── Styles ──
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFE',
    },
    content: {
        flex: 1,
    },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: 'white',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    guideBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Instruction banner */
    instructionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    instructionText: {
        flex: 1,
        fontSize: 13,
        color: '#4338CA',
        fontWeight: '500',
    },

    /* Transcription */
    transcriptionContainer: {
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    transcriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    transcriptionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    transcriptionInput: {
        fontSize: 15,
        color: '#111827',
        lineHeight: 22,
        minHeight: 80,
        maxHeight: 140,
        padding: 0,
    },
    listeningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    listeningDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    listeningText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
    },

    /* Error */
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#DC2626',
        fontWeight: '500',
    },

    /* Mic */
    micArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micContainer: {
        width: 220,
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wave: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    micButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            android: { elevation: 8 },
        }),
    },
    micButtonActive: {
        backgroundColor: '#DC2626',
    },
    micTouchable: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micHint: {
        marginTop: 16,
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },

    /* Actions */
    actionsRow: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    },
    processButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        paddingVertical: 16,
    },
    processButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    processButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },

    /* ═══════════════════════════ */
    /* Shared modal               */
    /* ═══════════════════════════ */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 16,
    },

    /* ═══════════════════════════ */
    /* Guide modal                 */
    /* ═══════════════════════════ */
    guideSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    guideHeader: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    guideIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    guideTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    guideSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    guideContent: {
        paddingHorizontal: 20,
    },
    tipsCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 12,
    },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: '#78350F',
        lineHeight: 18,
    },
    examplesTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    exampleCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    exampleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    exampleIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exampleTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    exampleText: {
        fontSize: 13,
        color: '#6B7280',
        fontStyle: 'italic',
        lineHeight: 19,
    },
    guideCloseBtn: {
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    guideCloseBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },

    /* ═══════════════════════════ */
    /* Result modal                */
    /* ═══════════════════════════ */
    resultSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '88%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    resultContent: {
        paddingHorizontal: 20,
    },
    resultHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    successCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    resultSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
    },

    /* Total card */
    resultTotalCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    resultTotalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#065F46',
        marginBottom: 4,
    },
    resultTotalAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#059669',
        marginBottom: 12,
    },
    resultBadgeRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    resultBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },

    /* Details card */
    resultDetailsCard: {
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    resultField: {
        marginBottom: 12,
    },
    resultFieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    resultFieldValue: {
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },

    /* Items card */
    resultItemsCard: {
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    resultItemsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 12,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    resultItemInfo: {
        flex: 1,
    },
    resultItemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    resultItemDetail: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    resultItemAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
        marginLeft: 12,
    },

    /* Extras card */
    resultExtrasCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    resultExtraRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    resultExtraLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    resultExtraValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },

    /* Result actions */
    resultActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        bottom: 30,
    },
    resultCancelBtn: {
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
    resultCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    resultConfirmBtn: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        paddingVertical: 14,
    },
    resultConfirmText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
});
