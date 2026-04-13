import { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    KeyboardAvoidingView,
    Alert,
    FlatList,
    Modal,
    ActivityIndicator,
    TextInput,
    ListRenderItemInfo,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNavigation } from '@react-navigation/native';
import { incidenciaService } from '../../services/incidenciaService';
import { MainContext } from '../../contexts/MainContextApp';
import CameraIncidence from './CameraIncidence';
import { EventRegister } from 'react-native-event-listeners';

interface SeverityItem {
    label: string;
    color: string;
    bg: string;
    icon: string;
}

interface SeverityButtonProps {
    item: SeverityItem;
    selected: boolean;
    onPress: () => void;
}

interface SelectInputProps {
    icon: string;
    placeholder: string;
    value: string;
    onPress: () => void;
    error?: boolean;
}

interface CustomTextInputProps {
    icon: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    numberOfLines?: number;
    error?: boolean;
}

interface ProgressIndicatorProps {
    imagenes: string[];
    tipoIncidente: string;
    gradoSeveridad: string;
    areaAfectada: string;
    descripcion: string;
}

const SeverityButton = ({ item, selected, onPress }: SeverityButtonProps) => (
    <TouchableOpacity
        style={[
            styles.severityButton,
            selected && {
                backgroundColor: item.bg,
                borderColor: item.color,
            }
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Ionicons
            name={item.icon as any}
            size={20}
            color={selected ? item.color : '#9CA3AF'}
        />
        <Text style={[
            styles.severityButtonText,
            selected && { color: item.color, fontWeight: '700' }
        ]}>
            {item.label}
        </Text>
    </TouchableOpacity>
);

const SelectInput = ({ icon, placeholder, value, onPress, error }: SelectInputProps) => (
    <TouchableOpacity
        style={[styles.selectInput, error && styles.inputError]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.inputIconContainer}>
            <Ionicons name={icon as any} size={20} color={value ? '#3B82F6' : '#9CA3AF'} />
        </View>
        <Text style={[
            styles.selectInputText,
            !value && styles.selectInputPlaceholder
        ]}>
            {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
    </TouchableOpacity>
);

const CustomTextInput = ({ icon, placeholder, value, onChangeText, multiline, numberOfLines, error }: CustomTextInputProps) => (
    <View style={[styles.textInputContainer, error && styles.inputError]}>
        <View style={styles.inputIconContainer}>
            <Ionicons name={icon as any} size={20} color={value ? '#3B82F6' : '#9CA3AF'} />
        </View>
        <TextInput
            style={[
                styles.textInput,
                multiline && { height: (numberOfLines ?? 1) * 24, textAlignVertical: 'top' }
            ]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            numberOfLines={numberOfLines}
        />
    </View>
);

const ProgressIndicator = ({ imagenes, tipoIncidente, gradoSeveridad, areaAfectada, descripcion }: ProgressIndicatorProps) => {
    const campos = [
        { completado: !!tipoIncidente, label: 'Tipo' },
        { completado: !!gradoSeveridad, label: 'Severidad' },
        { completado: !!areaAfectada, label: 'Área' },
        { completado: !!descripcion, label: 'Descripción' },
        { completado: imagenes.length > 0, label: 'Imágenes' },
    ];
    const completados = campos.filter(c => c.completado).length;
    const porcentaje = (completados / campos.length) * 100;

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Progreso del reporte</Text>
                <Text style={styles.progressPercentage}>{completados}/{campos.length}</Text>
            </View>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${porcentaje}%` }]} />
            </View>
        </View>
    );
};

export default function FormIncidence() {
    const navigation = useNavigation<any>();
    const { userData } = useContext(MainContext);

    const [fecha, setFecha] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [ubicacion, setUbicacion] = useState<string>('');
    const [areaAfectada, setAreaAfectada] = useState<string>('');
    const [showAreaMenu, setShowAreaMenu] = useState<boolean>(false);
    const [tipoIncidente, setTipoIncidente] = useState<string>('');
    const [showTipoMenu, setShowTipoMenu] = useState<boolean>(false);
    const [gradoSeveridad, setGradoSeveridad] = useState<string>('');
    const [descripcion, setDescripcion] = useState<string>('');
    const [recomendacion, setRecomendacion] = useState<string>('');
    const [imagenes, setImagenes] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showCamera, setShowCamera] = useState<boolean>(false);

    const MAX_IMAGES = 5;

    const areas: string[] = [
        'Servicios', 'Proyectos', 'UN VA', 'UN AU', 'UN AI', 'QHSE',
        'Asistente de Gerencia', 'Ventas internas', 'Contabilidad y Finanzas',
        'Logística', 'Compras e Importaciones', 'Almacén y Distribución',
        'Gerencia', 'Operaciones', 'TD', 'Marketing', 'Administración Financiera'
    ];

    const tiposIncidente: string[] = [
        'Acto Inseguro / Subestándar',
        'Condición Insegura / Subestándar',
        'Incidente de Trabajo (Sin lesión)',
        'Accidente de Trabajo',
        'Daño a la propiedad',
        'Daño ambiental',
        'Desviación a procedimiento / estándar'
    ];

    const gradosSeveridad: SeverityItem[] = [
        { label: 'Bajo', color: '#0891B2', bg: '#CFFAFE', icon: 'information-circle' },
        { label: 'Medio', color: '#D97706', bg: '#FEF3C7', icon: 'alert-circle' },
        { label: 'Alto', color: '#DC2626', bg: '#FEE2E2', icon: 'warning' },
        { label: 'Crítico', color: '#991B1B', bg: '#FEE2E2', icon: 'alert' },
    ];

    useEffect(() => {
        const listener = EventRegister.addEventListener('imageAnnotated', (data: any) => {
            if (data.annotatedUri && imagenes.length < MAX_IMAGES) {
                setImagenes(prev => [...prev, data.annotatedUri]);
            }
        });

        return () => {
            EventRegister.removeEventListener(listener as string);
        };
    }, [imagenes.length]);

    const handleConfirmDate = useCallback((date: Date): void => {
        setFecha(date);
        setShowDatePicker(false);
    }, []);

    const formatDateTime = useCallback((date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} • ${hours}:${minutes}`;
    }, []);

    const handleImageCaptured = useCallback((imageUri: string): void => {
        if (imagenes.length < MAX_IMAGES) {
            setImagenes(prev => [...prev, imageUri]);
            setShowCamera(false);
        } else {
            Alert.alert('Límite alcanzado', `Solo puedes agregar hasta ${MAX_IMAGES} imágenes`);
            setShowCamera(false);
        }
    }, [imagenes.length]);

    const handleAddImage = useCallback((): void => {
        if (imagenes.length >= MAX_IMAGES) {
            Alert.alert('Límite alcanzado', `Solo puedes agregar hasta ${MAX_IMAGES} imágenes`);
            return;
        }
        setShowCamera(true);
    }, [imagenes.length]);

    const handleRemoveImage = useCallback((index: number): void => {
        Alert.alert(
            'Eliminar imagen',
            '¿Estás seguro de eliminar esta imagen?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        setImagenes(prev => prev.filter((_, i) => i !== index));
                    }
                }
            ]
        );
    }, []);

    const submitForm = useCallback(async (): Promise<void> => {
        try {
            setIsSubmitting(true);
            const reporte = { fecha, ubicacion, areaAfectada, tipoIncidente, gradoSeveridad, descripcion, recomendacion, imagenes };
            await incidenciaService.registrarIncidencia(reporte, userData!._id);
            Alert.alert(
                'Incidencia registrada',
                'Tu reporte ha sido enviado exitosamente',
                [{ text: 'OK', onPress: () => navigation.navigate('HomeTabs', { screen: 'Incidencias' }) }]
            );
        } catch (error) {
            console.error('Error al registrar incidencia:', error);
            Alert.alert('Error', 'No se pudo registrar la incidencia. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    }, [fecha, ubicacion, areaAfectada, tipoIncidente, gradoSeveridad, descripcion, recomendacion, imagenes, userData, navigation]);

    const handleSubmit = useCallback(async (): Promise<void> => {
        if (!fecha || !ubicacion || !areaAfectada || !tipoIncidente || !gradoSeveridad || !descripcion) {
            Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios (*)');
            return;
        }
        if (imagenes.length === 0) {
            Alert.alert(
                'Sin imágenes',
                'Se recomienda agregar al menos una imagen del incidente. ¿Deseas continuar sin imágenes?',
                [
                    { text: 'Agregar imagen', style: 'cancel' },
                    { text: 'Continuar', onPress: submitForm }
                ]
            );
            return;
        }
        await submitForm();
    }, [fecha, ubicacion, areaAfectada, tipoIncidente, gradoSeveridad, descripcion, imagenes, submitForm]);

    const renderImageItem = useCallback(({ item, index }: ListRenderItemInfo<string>) => (
        <View style={styles.imageItem}>
            <Image source={{ uri: item }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.imageNumber}>
                <Text style={styles.imageNumberText}>{index + 1}</Text>
            </View>
        </View>
    ), [handleRemoveImage]);

    return (
        <>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.container}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Sección 1: Información básica */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Información Básica</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Tipo de incidente <Text style={styles.required}>*</Text>
                            </Text>
                            <SelectInput
                                icon="alert-circle-outline"
                                placeholder="Selecciona el tipo de incidente"
                                value={tipoIncidente}
                                onPress={() => setShowTipoMenu(!showTipoMenu)}
                            />
                            {showTipoMenu && (
                                <View style={styles.dropdown}>
                                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                        {tiposIncidente.map((tipo, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.dropdownItem, index === tiposIncidente.length - 1 && styles.dropdownItemLast]}
                                                onPress={() => { setTipoIncidente(tipo); setShowTipoMenu(false); }}
                                            >
                                                <Text style={styles.dropdownItemText}>{tipo}</Text>
                                                {tipoIncidente === tipo && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Nivel de severidad <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.severityContainer}>
                                {gradosSeveridad.map((grado) => (
                                    <SeverityButton
                                        key={grado.label}
                                        item={grado}
                                        selected={gradoSeveridad === grado.label}
                                        onPress={() => setGradoSeveridad(grado.label)}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Área afectada <Text style={styles.required}>*</Text>
                            </Text>
                            <SelectInput
                                icon="business-outline"
                                placeholder="Selecciona el área afectada"
                                value={areaAfectada}
                                onPress={() => setShowAreaMenu(!showAreaMenu)}
                            />
                            {showAreaMenu && (
                                <View style={styles.dropdown}>
                                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                        {areas.map((area, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.dropdownItem, index === areas.length - 1 && styles.dropdownItemLast]}
                                                onPress={() => { setAreaAfectada(area); setShowAreaMenu(false); }}
                                            >
                                                <Text style={styles.dropdownItemText}>{area}</Text>
                                                {areaAfectada === area && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Fecha y hora <Text style={styles.required}>*</Text>
                            </Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                                <View style={styles.inputIconContainer}>
                                    <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.dateInputText}>{formatDateTime(fecha)}</Text>
                                <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <DateTimePickerModal
                            isVisible={showDatePicker}
                            mode="datetime"
                            date={fecha}
                            onConfirm={handleConfirmDate}
                            onCancel={() => setShowDatePicker(false)}
                            locale="es_ES"
                            confirmTextIOS="Confirmar"
                            cancelTextIOS="Cancelar"
                        />
                    </View>

                    {/* Sección 2: Ubicación */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="location" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Ubicación</Text>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Lugar específico <Text style={styles.required}>*</Text>
                            </Text>
                            <CustomTextInput
                                icon="pin-outline"
                                placeholder="Ej: Oficina 201, Piso 2, Edificio A..."
                                value={ubicacion}
                                onChangeText={setUbicacion}
                                multiline
                                numberOfLines={2}
                            />
                        </View>
                    </View>

                    {/* Sección 3: Descripción */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Descripción del Incidente</Text>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Detalles <Text style={styles.required}>*</Text>
                            </Text>
                            <Text style={styles.helperText}>Describe qué ocurrió, cómo ocurrió y las circunstancias</Text>
                            <CustomTextInput
                                icon="create-outline"
                                placeholder="Sea lo más específico posible sobre lo ocurrido..."
                                value={descripcion}
                                onChangeText={setDescripcion}
                                multiline
                                numberOfLines={5}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Recomendaciones (opcional)</Text>
                            <Text style={styles.helperText}>¿Qué acciones sugieres para prevenir este incidente?</Text>
                            <CustomTextInput
                                icon="bulb-outline"
                                placeholder="Ej: Mejorar la señalización, capacitación adicional..."
                                value={recomendacion}
                                onChangeText={setRecomendacion}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>

                    {/* Sección 4: Evidencia fotográfica */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="images" size={20} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>Evidencia Fotográfica</Text>
                            <View style={styles.imageCount}>
                                <Text style={styles.imageCountText}>{imagenes.length}/{MAX_IMAGES}</Text>
                            </View>
                        </View>

                        {imagenes.length > 0 && (
                            <FlatList
                                data={imagenes}
                                horizontal
                                renderItem={renderImageItem}
                                keyExtractor={(_, index) => index.toString()}
                                contentContainerStyle={styles.imagesList}
                                showsHorizontalScrollIndicator={false}
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.addImageButton, imagenes.length >= MAX_IMAGES && styles.addImageButtonDisabled]}
                            onPress={handleAddImage}
                            disabled={imagenes.length >= MAX_IMAGES}
                            activeOpacity={0.7}
                        >
                            <View style={styles.addImageContent}>
                                <Ionicons name="camera" size={32} color={imagenes.length >= MAX_IMAGES ? '#D1D5DB' : '#3B82F6'} />
                                <Text style={[styles.addImageButtonText, imagenes.length >= MAX_IMAGES && styles.addImageButtonTextDisabled]}>
                                    {imagenes.length >= MAX_IMAGES
                                        ? 'Límite alcanzado'
                                        : imagenes.length === 0
                                            ? 'Tomar fotografía'
                                            : 'Agregar más fotos'
                                    }
                                </Text>
                                {imagenes.length === 0 && (
                                    <Text style={styles.addImageHint}>Recomendado para documentar el incidente</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Botón de envío */}
                    <View style={styles.submitContainer}>
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <>
                                    <ActivityIndicator color="white" size="small" />
                                    <Text style={styles.submitButtonText}>Enviando...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="send" size={20} color="white" />
                                    <Text style={styles.submitButtonText}>Enviar Reporte</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.submitHint}>Los campos marcados con * son obligatorios</Text>
                    </View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={showCamera}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowCamera(false)}
            >
                <CameraIncidence
                    onImageCaptured={handleImageCaptured}
                    onClose={() => setShowCamera(false)}
                    onNavigateToAnnotation={(imageUri: string) => {
                        setShowCamera(false);
                        navigation.navigate('ImageAnnotation', { imageUri, returnScreen: 'FormIncidence' });
                    }}
                    currentImageCount={imagenes.length}
                    maxImages={MAX_IMAGES}
                />
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { paddingBottom: 32 },
    header: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
    progressContainer: { marginTop: 12 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progressText: { fontSize: 13, fontWeight: '600', color: '#374151' },
    progressPercentage: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
    progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },
    section: { backgroundColor: 'white', marginTop: 12, padding: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginLeft: 8, flex: 1 },
    imageCount: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    imageCountText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    required: { color: '#EF4444' },
    helperText: { fontSize: 12, color: '#9CA3AF', marginBottom: 8, lineHeight: 16 },
    dateInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 14 },
    dateInputText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
    inputIconContainer: { marginRight: 12 },
    textInputContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 14 },
    textInput: { flex: 1, fontSize: 15, color: '#111827', padding: 0 },
    inputError: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
    selectInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 14 },
    selectInputText: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
    selectInputPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
    dropdown: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8, maxHeight: 240, overflow: 'hidden' },
    dropdownScroll: { maxHeight: 240 },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    dropdownItemLast: { borderBottomWidth: 0 },
    dropdownItemText: { fontSize: 14, color: '#374151', flex: 1 },
    severityContainer: { flexDirection: 'row', gap: 10 },
    severityButton: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', gap: 6 },
    severityButtonText: { fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
    imagesList: { paddingVertical: 12, gap: 12 },
    imageItem: { position: 'relative', marginRight: 12 },
    imagePreview: { width: 140, height: 140, borderRadius: 12, backgroundColor: '#F3F4F6' },
    removeImageButton: { position: 'absolute', top: -10, right: -10, backgroundColor: '#EF4444', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    imageNumber: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    imageNumberText: { color: 'white', fontSize: 12, fontWeight: '700' },
    addImageButton: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 2, borderColor: '#3B82F6', borderStyle: 'dashed', padding: 24, alignItems: 'center', marginTop: 12 },
    addImageButtonDisabled: { borderColor: '#D1D5DB', backgroundColor: '#F3F4F6' },
    addImageContent: { alignItems: 'center' },
    addImageButtonText: { fontSize: 15, fontWeight: '600', color: '#3B82F6', marginTop: 8 },
    addImageButtonTextDisabled: { color: '#9CA3AF' },
    addImageHint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    submitContainer: { paddingHorizontal: 20, paddingTop: 24 },
    submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, gap: 10 },
    submitButtonDisabled: { backgroundColor: '#9CA3AF' },
    submitButtonText: { fontSize: 16, fontWeight: '700', color: 'white' },
    submitHint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
    bottomSpacer: { height: 32 },
});
