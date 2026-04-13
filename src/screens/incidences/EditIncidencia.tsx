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
import { useNavigation, useRoute } from '@react-navigation/native';
import { incidenciaService } from '../../services/incidenciaService';
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
}

interface CustomTextInputProps {
    icon: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    numberOfLines?: number;
}

const SeverityButton = ({ item, selected, onPress }: SeverityButtonProps) => (
    <TouchableOpacity
        style={[styles.severityButton, selected && { backgroundColor: item.bg, borderColor: item.color }]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Ionicons name={item.icon as any} size={20} color={selected ? item.color : '#9CA3AF'} />
        <Text style={[styles.severityButtonText, selected && { color: item.color, fontWeight: '700' }]}>
            {item.label}
        </Text>
    </TouchableOpacity>
);

const SelectInput = ({ icon, placeholder, value, onPress }: SelectInputProps) => (
    <TouchableOpacity style={styles.selectInput} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.inputIconContainer}>
            <Ionicons name={icon as any} size={20} color={value ? '#3B82F6' : '#9CA3AF'} />
        </View>
        <Text style={[styles.selectInputText, !value && styles.selectInputPlaceholder]}>
            {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
    </TouchableOpacity>
);

const CustomTextInput = ({ icon, placeholder, value, onChangeText, multiline, numberOfLines }: CustomTextInputProps) => (
    <View style={styles.textInputContainer}>
        <View style={styles.inputIconContainer}>
            <Ionicons name={icon as any} size={20} color={value ? '#3B82F6' : '#9CA3AF'} />
        </View>
        <TextInput
            style={[styles.textInput, multiline && { height: (numberOfLines ?? 1) * 24, textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            numberOfLines={numberOfLines}
        />
    </View>
);

export default function EditIncidencia() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params as { id: string };

    const [loading, setLoading] = useState<boolean>(true);
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
    const [imagenesOriginales, setImagenesOriginales] = useState<string[]>([]);
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
        loadIncidencia();
    }, [id]);

    useEffect(() => {
        const listener = EventRegister.addEventListener('imageAnnotated', (data: any) => {
            if (data.returnScreen === 'EditIncidencia' && data.annotatedUri && imagenes.length < MAX_IMAGES) {
                setImagenes(prev => [...prev, data.annotatedUri]);
                Alert.alert('Imagen agregada', 'La imagen anotada se agregó correctamente');
            }
        });
        return () => {
            EventRegister.removeEventListener(listener as string);
        };
    }, [imagenes.length]);

    const loadIncidencia = async (): Promise<void> => {
        try {
            setLoading(true);
            const data = await incidenciaService.getIncidenciaById(id);
            setFecha(new Date(data.fecha));
            setUbicacion(data.ubicacion);
            setAreaAfectada(data.areaAfectada);
            setTipoIncidente(data.tipoIncidente);
            setGradoSeveridad(data.gradoSeveridad);
            setDescripcion(data.descripcion);
            setRecomendacion(data.recomendacion || '');
            const existingImages: string[] = data.imagenes || [];
            setImagenes(existingImages);
            setImagenesOriginales(existingImages);
        } catch (error) {
            console.error('Error al cargar incidencia:', error);
            Alert.alert('Error', 'No se pudo cargar la incidencia');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

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
            Alert.alert('Límite alcanzado', `Solo puedes tener hasta ${MAX_IMAGES} imágenes`);
            setShowCamera(false);
        }
    }, [imagenes.length]);

    const handleAddImage = useCallback((): void => {
        if (imagenes.length >= MAX_IMAGES) {
            Alert.alert('Límite alcanzado', `Solo puedes tener hasta ${MAX_IMAGES} imágenes`);
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
                    onPress: () => { setImagenes(prev => prev.filter((_, i) => i !== index)); }
                }
            ]
        );
    }, []);

    const handleSubmit = useCallback(async (): Promise<void> => {
        if (!fecha || !ubicacion || !areaAfectada || !tipoIncidente || !gradoSeveridad || !descripcion) {
            Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios (*)');
            return;
        }

        try {
            setIsSubmitting(true);
            const updateData: any = { fecha, ubicacion, areaAfectada, tipoIncidente, gradoSeveridad, descripcion, recomendacion };

            const imagenesChanged = JSON.stringify(imagenes) !== JSON.stringify(imagenesOriginales);
            if (imagenesChanged) {
                updateData.imagenes = imagenes;
                updateData.replaceImages = false;
            }

            await incidenciaService.updateIncidencia(id, updateData);
            Alert.alert(
                'Incidencia actualizada',
                'Los cambios se guardaron correctamente',
                [{ text: 'OK', onPress: () => navigation.navigate('HomeTabs', { screen: 'Incidencias' }) }]
            );
        } catch (error) {
            console.error('Error al actualizar incidencia:', error);
            Alert.alert('Error', 'No se pudo actualizar la incidencia. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    }, [fecha, ubicacion, areaAfectada, tipoIncidente, gradoSeveridad, descripcion, recomendacion, imagenes, imagenesOriginales, id, navigation]);

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Cargando incidencia...</Text>
            </View>
        );
    }

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
                            <Text style={styles.label}>Tipo de incidente <Text style={styles.required}>*</Text></Text>
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
                            <Text style={styles.label}>Nivel de severidad <Text style={styles.required}>*</Text></Text>
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
                            <Text style={styles.label}>Área afectada <Text style={styles.required}>*</Text></Text>
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
                            <Text style={styles.label}>Fecha y hora <Text style={styles.required}>*</Text></Text>
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
                            <Text style={styles.label}>Lugar específico <Text style={styles.required}>*</Text></Text>
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
                            <Text style={styles.label}>Detalles <Text style={styles.required}>*</Text></Text>
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
                                        : imagenes.length === 0 ? 'Tomar fotografía' : 'Agregar más fotos'
                                    }
                                </Text>
                                {imagenes.length === 0 && (
                                    <Text style={styles.addImageHint}>Recomendado para documentar el incidente</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Botones de acción */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={isSubmitting} activeOpacity={0.7}>
                            <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <>
                                    <ActivityIndicator color="white" size="small" />
                                    <Text style={styles.submitButtonText}>Guardando...</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="white" />
                                    <Text style={styles.submitButtonText}>Guardar Cambios</Text>
                                </>
                            )}
                        </TouchableOpacity>
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
                        navigation.navigate('ImageAnnotation', { imageUri, returnScreen: 'EditIncidencia' });
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    loadingText: { marginTop: 16, fontSize: 15, color: '#6B7280' },
    header: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 2 },
    headerSubtitle: { fontSize: 13, color: '#6B7280' },
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
    actionsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 24, gap: 12 },
    cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 16, gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    submitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, gap: 8 },
    submitButtonDisabled: { backgroundColor: '#9CA3AF' },
    submitButtonText: { fontSize: 15, fontWeight: '700', color: 'white' },
    bottomSpacer: { height: 32 },
});
