import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import {
    Camera as VisionCamera,
    useCameraDevice,
    type CameraPermissionStatus,
    type PhotoFile,
} from 'react-native-vision-camera';
import {
    Camera as FaceCamera,
    type Face,
    type FrameFaceDetectionOptions,
} from 'react-native-vision-camera-face-detector';

export interface CapturedPhoto {
    uri: string;
    path?: string;
}

export interface LocationCoords {
    latitude: number;
    longitude: number;
}

type DetectionStatus =
    | 'detecting'
    | 'no-face'
    | 'multiple-faces'
    | 'align-face'
    | 'move-closer'
    | 'hold-still'
    | 'capturing'
    | 'verifying'
    | 'no-device'
    | 'no-permission';

interface FaceVerificationCameraProps {
    visible: boolean;
    verifying: boolean;
    onClose: () => void;
    onCapture: (photo: CapturedPhoto) => Promise<boolean>;
}

const GUIDE_SIZE = 260;
const CAPTURE_COOLDOWN_MS = 2500;
const STABLE_FRAMES_REQUIRED = 4;

export default function FaceVerificationCamera({
    visible,
    verifying,
    onClose,
    onCapture,
}: FaceVerificationCameraProps) {
    const { width, height } = useWindowDimensions();
    const device = useCameraDevice('front');
    const cameraRef = useRef<VisionCamera | null>(null);
    const stableFramesRef = useRef(0);
    const lastCaptureAtRef = useRef(0);
    const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus | null>(null);
    const [status, setStatus] = useState<DetectionStatus>('detecting');
    const [isCapturing, setIsCapturing] = useState(false);

    useEffect(() => {
        if (!visible) {
            stableFramesRef.current = 0;
            setIsCapturing(false);
            setStatus('detecting');
            return;
        }

        let isMounted = true;

        const requestPermission = async () => {
            let currentStatus = await VisionCamera.getCameraPermissionStatus();
            if (currentStatus !== 'granted') {
                currentStatus = await VisionCamera.requestCameraPermission();
            }

            if (!isMounted) {
                return;
            }

            setPermissionStatus(currentStatus);
            if (currentStatus !== 'granted') {
                setStatus('no-permission');
            } else if (!device) {
                setStatus('no-device');
            } else {
                setStatus('detecting');
            }
        };

        requestPermission();

        return () => {
            isMounted = false;
        };
    }, [visible, device]);

    useEffect(() => {
        if (!visible || verifying) {
            return;
        }

        if (permissionStatus === 'granted' && device) {
            setStatus((current) => (current === 'capturing' ? current : 'detecting'));
        }
    }, [visible, verifying, permissionStatus, device]);

    const faceDetectionOptions: FrameFaceDetectionOptions = {
        performanceMode: 'fast',
        landmarkMode: 'none',
        contourMode: 'none',
        classificationMode: 'all',
        minFaceSize: 0.2,
        trackingEnabled: true,
        cameraFacing: 'front',
        autoMode: true,
        windowWidth: width,
        windowHeight: height,
    };

    const getStatusMessage = (): string => {
        if (verifying) return 'Verificando identidad...';

        switch (status) {
            case 'no-face':
                return 'Buscando rostro';
            case 'multiple-faces':
                return 'Solo debe aparecer un rostro';
            case 'align-face':
                return 'Centra tu rostro en la guia';
            case 'move-closer':
                return 'Acercate un poco mas';
            case 'hold-still':
                return 'Mantente quieto';
            case 'capturing':
                return 'Capturando...';
            case 'no-device':
                return 'No se encontro camara frontal';
            case 'no-permission':
                return 'Se necesita permiso de camara';
            default:
                return 'Alinea tu rostro para capturar automaticamente';
        }
    };

    const capturePhoto = async () => {
        if (!cameraRef.current || isCapturing || verifying) {
            return;
        }

        setIsCapturing(true);
        setStatus('capturing');

        try {
            const photo: PhotoFile = await cameraRef.current.takePhoto({
                flash: 'off',
                enableShutterSound: false,
            });

            const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
            const success = await onCapture({ uri, path: photo.path });

            if (!success) {
                stableFramesRef.current = 0;
                setStatus('detecting');
            }
        } catch (error) {
            console.error('Error al capturar foto:', error);
            stableFramesRef.current = 0;
            setStatus('detecting');
        } finally {
            setIsCapturing(false);
            lastCaptureAtRef.current = Date.now();
        }
    };

    const handleFacesDetection = (faces: Face[]) => {
        if (!visible || verifying || isCapturing) {
            return;
        }

        if (!faces.length) {
            stableFramesRef.current = 0;
            setStatus('no-face');
            return;
        }

        if (faces.length > 1) {
            stableFramesRef.current = 0;
            setStatus('multiple-faces');
            return;
        }

        const face = faces[0];
        const centerX = face.bounds.x + (face.bounds.width / 2);
        const centerY = face.bounds.y + (face.bounds.height / 2);
        const guideCenterX = width / 2;
        const guideCenterY = height * 0.43;

        const isCentered =
            Math.abs(centerX - guideCenterX) < GUIDE_SIZE * 0.18 &&
            Math.abs(centerY - guideCenterY) < GUIDE_SIZE * 0.2;

        const isSizedCorrectly =
            face.bounds.width > GUIDE_SIZE * 0.42 &&
            face.bounds.width < GUIDE_SIZE * 0.92 &&
            face.bounds.height > GUIDE_SIZE * 0.42;

        const hasStableAngle =
            Math.abs(face.yawAngle) < 12 &&
            Math.abs(face.rollAngle) < 12 &&
            Math.abs(face.pitchAngle) < 12;

        if (!isSizedCorrectly) {
            stableFramesRef.current = 0;
            setStatus('move-closer');
            return;
        }

        if (!isCentered || !hasStableAngle) {
            stableFramesRef.current = 0;
            setStatus('align-face');
            return;
        }

        stableFramesRef.current += 1;

        if (stableFramesRef.current < STABLE_FRAMES_REQUIRED) {
            setStatus('hold-still');
            return;
        }

        if (Date.now() - lastCaptureAtRef.current < CAPTURE_COOLDOWN_MS) {
            return;
        }

        capturePhoto();
    };

    const guideBorderColor =
        status === 'align-face' || status === 'move-closer' || status === 'multiple-faces'
            ? 'rgba(255,255,255,0.55)'
            : '#22C55E';

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                {permissionStatus === 'granted' && device ? (
                    <FaceCamera
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={visible}
                        photo
                        faceDetectionOptions={faceDetectionOptions}
                        faceDetectionCallback={handleFacesDetection}
                    />
                ) : (
                    <View style={styles.cameraFallback} />
                )}

                <View style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Verificacion facial</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.guideArea}>
                        <View style={[styles.faceGuide, { borderColor: guideBorderColor }]} />
                    </View>

                    <View style={styles.instructionsBlock}>
                        <View style={styles.statusPill}>
                            {(verifying || isCapturing) && <ActivityIndicator size="small" color="#FFFFFF" />}
                            <Text style={styles.statusText}>{getStatusMessage()}</Text>
                        </View>
                        <Text style={styles.helperText}>La captura se envia automaticamente cuando el rostro esta listo.</Text>
                    </View>
                </View>

                <View style={styles.captureArea}>
                    <TouchableOpacity
                        style={[styles.manualButton, (verifying || isCapturing) && styles.manualButtonDisabled]}
                        onPress={capturePhoto}
                        activeOpacity={0.85}
                        disabled={verifying || isCapturing || permissionStatus !== 'granted' || !device}
                    >
                        <Ionicons name="camera-outline" size={18} color="#111827" />
                        <Text style={styles.manualButtonText}>Capturar manualmente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    cameraFallback: { flex: 1, backgroundColor: '#111827' },
    overlay: { flex: 1, justifyContent: 'space-between' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 56 : 22,
        paddingHorizontal: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    headerSpacer: { width: 40 },
    guideArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 44,
    },
    faceGuide: {
        width: GUIDE_SIZE,
        height: GUIDE_SIZE,
        borderRadius: GUIDE_SIZE / 2,
        borderWidth: 3,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    instructionsBlock: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 152,
    },
    statusPill: {
        minHeight: 46,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: 'rgba(17,24,39,0.78)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
    helperText: {
        marginTop: 12,
        color: 'rgba(255,255,255,0.72)',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },
    captureArea: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: Platform.OS === 'ios' ? 44 : 28,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    manualButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        maxWidth: 280,
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: 18,
        paddingVertical: 14,
    },
    manualButtonDisabled: { opacity: 0.6 },
    manualButtonText: { fontSize: 14, fontWeight: '700', color: '#111827' },
});
