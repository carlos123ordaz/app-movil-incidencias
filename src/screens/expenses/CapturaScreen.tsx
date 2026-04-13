import { useState, useRef, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
    View,
    StyleSheet,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    Alert,
    Animated,
} from 'react-native';
import {
    Text,
    ActivityIndicator,
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CapturaScreen() {

    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
    const cameraRef = useRef<any>(null);
    const navigation = useNavigation<any>();
    const scanningAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
        startScanningAnimation();
    }, []);

    const startScanningAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanningAnimation, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanningAnimation, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const takePicture = async () => {
        if (cameraRef.current && !isScanning) {
            try {
                setIsScanning(true);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                    skipProcessing: false,
                });

                if (photo?.uri) {
                    const fileName = `receipt_${Date.now()}.jpg`;
                    const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
                    await FileSystem.copyAsync({
                        from: photo.uri,
                        to: permanentUri,
                    });
                    navigation.navigate('revisar', {
                        imageUri: permanentUri,
                        photo,
                        source: 'camera'
                    });
                }
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'No se pudo capturar la imagen. Intenta nuevamente.');
            } finally {
                setIsScanning(false);
            }
        }
    };
    const pickPDFDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedPDF = result.assets[0];
                const fileName = `receipt_${Date.now()}.pdf`;
                const permanentUri = `${FileSystem.documentDirectory}${fileName}`;

                await FileSystem.copyAsync({
                    from: selectedPDF.uri,
                    to: permanentUri,
                });

                navigation.navigate('revisar', {
                    photo: {
                        type: 'application/pdf',
                        uri: permanentUri,
                        fileName: fileName,
                        isPDF: true,
                    }
                });
            }
        } catch (error) {
            console.error('Error picking PDF:', error);
            Alert.alert('Error', 'No se pudo seleccionar el PDF.');
        }
    };
    const pickImageFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: false,
                quality: 0.8,
                allowsMultipleSelection: false,
            });
            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0];
                const manipulatedImage = await ImageManipulator.manipulateAsync(
                    selectedImage.uri,
                    [],
                    {
                        compress: 0.8,
                        format: SaveFormat.JPEG,
                    }
                );
                const fileName = `receipt_${Date.now()}.jpg`;
                const permanentUri = `${FileSystem.documentDirectory}${fileName}`;
                await FileSystem.copyAsync({
                    from: manipulatedImage.uri,
                    to: permanentUri,
                });
                navigation.navigate('revisar', {
                    photo: {
                        type: 'image/jpeg',
                        uri: permanentUri,
                        fileName: fileName,
                        width: manipulatedImage.width,
                        height: manipulatedImage.height
                    }
                });
            }
        } catch (error) {
            console.error('Error picking/manipulating image:', error);
            Alert.alert('Error', 'No se pudo procesar la imagen.');
        }
    };

    const navigateToManualEntry = () => {
        navigation.navigate('agregar-gasto');
    };

    const toggleFlash = () => {
        setFlashMode(current => {
            switch (current) {
                case 'off': return 'on';
                case 'on': return 'off';
                default: return 'off';
            }
        });
    };

    const toggleCamera = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Cargando cámara...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={80} color="#666" />
                    <Text style={styles.permissionTitle}>Acceso a Cámara Requerido</Text>
                    <Text style={styles.permissionText}>
                        Para escanear comprobantes necesitamos acceso a tu cámara
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={facing}
                    flash={flashMode}
                />
                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.scanningArea}>
                        <View style={styles.documentFrame}>
                            <Animated.View
                                style={[
                                    styles.scanLine,
                                    {
                                        transform: [{
                                            translateY: scanningAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, screenHeight * 0.5],
                                            }),
                                        }],
                                        opacity: scanningAnimation.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [0.3, 1, 0.3],
                                        }),
                                    },
                                ]}
                            />

                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                    </View>

                    <View style={styles.additionalOptions}>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={pickImageFromGallery}
                        >
                            <Ionicons name="image" size={24} color="white" />
                            <Text style={styles.optionText}>Galería</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionButton} onPress={pickPDFDocument}>
                            <Ionicons name="document-text-outline" size={24} color="white" />
                            <Text style={styles.optionText}>PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={navigateToManualEntry}
                        >
                            <Ionicons name="create-outline" size={24} color="white" />
                            <Text style={styles.optionText}>Manual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => navigation.navigate('voice-expense')}
                        >
                            <Ionicons name="mic" size={24} color="white" />
                            <Text style={styles.optionText}>Voz</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cameraControls}>
                        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
                            <Ionicons
                                name={flashMode === 'on' ? 'flash' : 'flash-off'}
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.captureButton, isScanning && styles.capturingButton]}
                            onPress={takePicture}
                            disabled={isScanning}
                        >
                            {isScanning ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <View style={styles.captureButtonInner} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
                            <Ionicons name="camera-reverse" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    permissionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    permissionButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    scanningArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    documentFrame: {
        width: screenWidth * 0.8,
        height: screenHeight * 0.5,
        position: 'relative',
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: 12,
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#4F46E5',
        borderRadius: 2,
        shadowColor: '#4F46E5',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#4F46E5',
        borderWidth: 4,
    },
    topLeft: {
        top: -15,
        left: -15,
        borderBottomWidth: 0,
        borderRightWidth: 0,
        borderTopLeftRadius: 12,
    },
    topRight: {
        top: -15,
        right: -15,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
        borderTopRightRadius: 12,
    },
    bottomLeft: {
        bottom: -15,
        left: -15,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomLeftRadius: 12,
    },
    bottomRight: {
        bottom: -15,
        right: -15,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderBottomRightRadius: 12,
    },
    additionalOptions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 20,
        gap: 10,
    },
    optionButton: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    optionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    cameraControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    capturingButton: {
        opacity: 0.7,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    },
});