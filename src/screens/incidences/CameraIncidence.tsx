import { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Platform,
    Linking,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CameraIncidenceProps {
    onImageCaptured: (imageUri: string) => void;
    onClose: () => void;
    onNavigateToAnnotation?: (imageUri: string) => void;
    currentImageCount?: number;
    maxImages?: number;
}

export default function CameraIncidence({
    onImageCaptured,
    onClose,
    onNavigateToAnnotation,
    currentImageCount = 0,
    maxImages = 5,
}: CameraIncidenceProps) {
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCapturing, setIsCapturing] = useState<boolean>(false);
    const cameraRef = useRef<any>(null);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    const requestGalleryPermissions = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
    };

    const toggleCameraFacing = (): void => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const takePicture = async (): Promise<void> => {
        if (!cameraRef.current || isCapturing) return;

        try {
            setIsCapturing(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: false,
            });

            handleImageTaken(photo.uri);
        } catch (error) {
            console.error('Error al capturar foto:', error);
            Alert.alert('Error', 'No se pudo capturar la foto');
        } finally {
            setIsCapturing(false);
        }
    };

    const pickFromGallery = async (): Promise<void> => {
        try {
            const hasPermission = await requestGalleryPermissions();

            if (!hasPermission) {
                Alert.alert(
                    'Permisos necesarios',
                    'Necesitamos acceso a tu galería para seleccionar fotos. Por favor, ve a Configuración y habilita el permiso.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Ir a Configuración', onPress: () => {
                                if (Platform.OS === 'ios') {
                                    Linking.openURL('app-settings:');
                                }
                            }
                        }
                    ]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                handleImageTaken(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error al seleccionar imagen:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    const handleImageTaken = (imageUri: string): void => {
        setCapturedImage(imageUri);

        Alert.alert(
            '📝 Anotaciones',
            '¿Deseas agregar anotaciones a esta imagen?',
            [
                {
                    text: 'No, usar original',
                    style: 'cancel',
                    onPress: () => {
                        onImageCaptured(imageUri);
                        setCapturedImage(null);
                    }
                },
                {
                    text: 'Sí, anotar',
                    onPress: () => {
                        setCapturedImage(null);
                        if (onNavigateToAnnotation) {
                            onNavigateToAnnotation(imageUri);
                        }
                    }
                }
            ],
            { cancelable: false }
        );
    };

    const retakePhoto = (): void => {
        setCapturedImage(null);
    };

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Cargando cámara...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
                <Text style={styles.permissionTitle}>Permiso de cámara necesario</Text>
                <Text style={styles.permissionText}>
                    Para capturar fotos de incidencias, necesitamos acceso a tu cámara.
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Ionicons name="camera" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.permissionButtonText}>Permitir acceso a cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelPermissionButton} onPress={onClose}>
                    <Text style={styles.cancelPermissionButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (capturedImage) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.previewContainer}>
                    <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                    <View style={styles.previewActions}>
                        <TouchableOpacity style={[styles.previewButton, styles.retakeButton]} onPress={retakePhoto}>
                            <Ionicons name="camera-reverse" size={24} color="white" />
                            <Text style={styles.previewButtonText}>Repetir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.counterText}>
                    {currentImageCount}/{maxImages} imágenes
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
                    <Ionicons name="images" size={32} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.captureButton, isCapturing && styles.capturingButton]}
                    onPress={takePicture}
                    disabled={isCapturing}
                >
                    <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                    <Ionicons name="camera-reverse" size={32} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    loadingText: { marginTop: 16, fontSize: 16, color: '#9CA3AF' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 24 },
    permissionTitle: { fontSize: 20, fontWeight: '600', color: 'white', marginTop: 16, marginBottom: 8, textAlign: 'center' },
    permissionText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
    permissionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    permissionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    cancelPermissionButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12 },
    cancelPermissionButtonText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
    camera: { flex: 1 },
    header: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
    closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    counterText: { fontSize: 16, fontWeight: '600', color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    controls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 40, zIndex: 10 },
    galleryButton: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.3)' },
    capturingButton: { opacity: 0.5 },
    captureButtonInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'white' },
    flipButton: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    previewContainer: { flex: 1, backgroundColor: '#000' },
    previewImage: { flex: 1, resizeMode: 'contain' },
    previewActions: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 16 },
    previewButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, gap: 8 },
    retakeButton: { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
    previewButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
