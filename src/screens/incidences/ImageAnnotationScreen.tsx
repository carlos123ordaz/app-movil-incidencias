import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Alert,
    GestureResponderEvent,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import Svg, { Path, Circle, Line, Polygon } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import { EventRegister } from 'react-native-event-listeners';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Point {
    x: number;
    y: number;
}

interface Annotation {
    type: string;
    points: Point[];
    color: string;
    strokeWidth: number;
}

interface ToolItem {
    name: string;
    icon: string;
    label: string;
}

export default function ImageAnnotationScreen({ route, navigation }: any) {
    const { imageUri, returnScreen } = route.params as { imageUri: string; returnScreen: string };

    const viewShotRef = useRef<any>(null);
    const [currentTool, setCurrentTool] = useState<string>('draw');
    const [currentColor, setCurrentColor] = useState<string>('#FF0000');
    const [paths, setPaths] = useState<Annotation[]>([]);
    const [currentPath, setCurrentPath] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [history, setHistory] = useState<Annotation[][]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);

    const colors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000'];
    const tools: ToolItem[] = [
        { name: 'draw', icon: 'pencil', label: 'Dibujar' },
        { name: 'arrow', icon: 'arrow-forward', label: 'Flecha' },
        { name: 'circle', icon: 'ellipse-outline', label: 'Círculo' },
        { name: 'rectangle', icon: 'square-outline', label: 'Rectángulo' },
    ];

    const handleTouchStart = (event: GestureResponderEvent): void => {
        const { locationX, locationY } = event.nativeEvent;
        setIsDrawing(true);
        setCurrentPath([{ x: locationX, y: locationY }]);
    };

    const handleTouchMove = (event: GestureResponderEvent): void => {
        if (!isDrawing) return;
        const { locationX, locationY } = event.nativeEvent;
        setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
    };

    const handleTouchEnd = (): void => {
        if (currentPath.length > 0) {
            const newAnnotation: Annotation = {
                type: currentTool,
                points: currentPath,
                color: currentColor,
                strokeWidth: 4,
            };
            const newPaths = [...paths, newAnnotation];
            setPaths(newPaths);
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(newPaths);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        setCurrentPath([]);
        setIsDrawing(false);
    };

    const undo = (): void => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setPaths(history[historyIndex - 1] || []);
        } else {
            setPaths([]);
            setHistoryIndex(-1);
        }
    };

    const redo = (): void => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setPaths(history[historyIndex + 1]);
        }
    };

    const clearAll = (): void => {
        Alert.alert(
            'Limpiar anotaciones',
            '¿Estás seguro de eliminar todas las anotaciones?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpiar',
                    style: 'destructive',
                    onPress: () => {
                        setPaths([]);
                        setCurrentPath([]);
                        const newHistory = [...history, []];
                        setHistory(newHistory);
                        setHistoryIndex(newHistory.length - 1);
                    }
                }
            ]
        );
    };

    const renderAnnotation = (annotation: Annotation, index: number) => {
        const { type, points, color, strokeWidth } = annotation;
        if (points.length === 0) return null;

        switch (type) {
            case 'draw': {
                const pathData = points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
                return (
                    <Path key={`annotation-${index}`} d={pathData} stroke={color} strokeWidth={strokeWidth}
                        fill="none" strokeLinecap="round" strokeLinejoin="round" />
                );
            }
            case 'arrow': {
                if (points.length < 2) return null;
                const start = points[0];
                const end = points[points.length - 1];
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                const arrowLength = 20;
                const arrowAngle = Math.PI / 6;
                const arrowPoint1 = {
                    x: end.x - arrowLength * Math.cos(angle - arrowAngle),
                    y: end.y - arrowLength * Math.sin(angle - arrowAngle),
                };
                const arrowPoint2 = {
                    x: end.x - arrowLength * Math.cos(angle + arrowAngle),
                    y: end.y - arrowLength * Math.sin(angle + arrowAngle),
                };
                return (
                    <React.Fragment key={`annotation-${index}`}>
                        <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={strokeWidth} />
                        <Polygon points={`${end.x},${end.y} ${arrowPoint1.x},${arrowPoint1.y} ${arrowPoint2.x},${arrowPoint2.y}`} fill={color} />
                    </React.Fragment>
                );
            }
            case 'circle': {
                if (points.length < 2) return null;
                const circleStart = points[0];
                const circleEnd = points[points.length - 1];
                const radius = Math.sqrt(Math.pow(circleEnd.x - circleStart.x, 2) + Math.pow(circleEnd.y - circleStart.y, 2));
                return <Circle key={`annotation-${index}`} cx={circleStart.x} cy={circleStart.y} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" />;
            }
            case 'rectangle': {
                if (points.length < 2) return null;
                const rectStart = points[0];
                const rectEnd = points[points.length - 1];
                const rectPath = `M ${rectStart.x} ${rectStart.y} L ${rectEnd.x} ${rectStart.y} L ${rectEnd.x} ${rectEnd.y} L ${rectStart.x} ${rectEnd.y} Z`;
                return <Path key={`annotation-${index}`} d={rectPath} stroke={color} strokeWidth={strokeWidth} fill="none" />;
            }
            default:
                return null;
        }
    };

    const renderCurrentDrawing = () => {
        if (currentPath.length === 0 || !isDrawing) return null;

        switch (currentTool) {
            case 'draw': {
                const pathData = currentPath.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
                return <Path d={pathData} stroke={currentColor} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
            }
            case 'arrow': {
                if (currentPath.length < 2) return null;
                const start = currentPath[0];
                const end = currentPath[currentPath.length - 1];
                return <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={currentColor} strokeWidth={4} strokeDasharray="5,5" />;
            }
            case 'circle': {
                if (currentPath.length < 2) return null;
                const circleStart = currentPath[0];
                const circleEnd = currentPath[currentPath.length - 1];
                const radius = Math.sqrt(Math.pow(circleEnd.x - circleStart.x, 2) + Math.pow(circleEnd.y - circleStart.y, 2));
                return <Circle cx={circleStart.x} cy={circleStart.y} r={radius} stroke={currentColor} strokeWidth={4} strokeDasharray="5,5" fill="none" />;
            }
            case 'rectangle': {
                if (currentPath.length < 2) return null;
                const rectStart = currentPath[0];
                const rectEnd = currentPath[currentPath.length - 1];
                const rectPath = `M ${rectStart.x} ${rectStart.y} L ${rectEnd.x} ${rectStart.y} L ${rectEnd.x} ${rectEnd.y} L ${rectStart.x} ${rectEnd.y} Z`;
                return <Path d={rectPath} stroke={currentColor} strokeWidth={4} strokeDasharray="5,5" fill="none" />;
            }
            default:
                return null;
        }
    };

    const saveAnnotatedImage = async (): Promise<void> => {
        try {
            setSaving(true);
            const uri = await viewShotRef.current.capture();
            const fileName = `annotated_${Date.now()}.jpg`;
            const newUri = `${FileSystem.documentDirectory}${fileName}`;
            await FileSystem.copyAsync({ from: uri, to: newUri });
            EventRegister.emit('imageAnnotated', { annotatedUri: newUri, returnScreen: returnScreen || 'FormIncidence' });
            navigation.goBack();
        } catch (error) {
            console.error('Error al guardar imagen anotada:', error);
            Alert.alert('Error', 'No se pudo guardar la imagen anotada');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Anotar Imagen</Text>
                <TouchableOpacity style={[styles.headerButton, styles.saveButton]} onPress={saveAnnotatedImage} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark" size={24} color="white" />}
                </TouchableOpacity>
            </View>

            <View style={styles.canvasContainer}>
                <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.viewShot}>
                    <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
                    <View
                        style={styles.svgContainer}
                        onStartShouldSetResponder={() => true}
                        onResponderGrant={handleTouchStart}
                        onResponderMove={handleTouchMove}
                        onResponderRelease={handleTouchEnd}
                    >
                        <Svg style={styles.svg}>
                            {paths.map((annotation, index) => renderAnnotation(annotation, index))}
                            {renderCurrentDrawing()}
                        </Svg>
                    </View>
                </ViewShot>
            </View>

            <View style={styles.toolsPanel}>
                <View style={styles.historyControls}>
                    <TouchableOpacity style={[styles.historyButton, historyIndex <= 0 && styles.historyButtonDisabled]} onPress={undo} disabled={historyIndex <= 0}>
                        <Ionicons name="arrow-undo" size={20} color={historyIndex <= 0 ? '#9CA3AF' : 'white'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.historyButton, historyIndex >= history.length - 1 && styles.historyButtonDisabled]} onPress={redo} disabled={historyIndex >= history.length - 1}>
                        <Ionicons name="arrow-redo" size={20} color={historyIndex >= history.length - 1 ? '#9CA3AF' : 'white'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.historyButton, paths.length === 0 && styles.historyButtonDisabled]} onPress={clearAll} disabled={paths.length === 0}>
                        <Ionicons name="trash-outline" size={20} color={paths.length === 0 ? '#9CA3AF' : 'white'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.toolsContainer}>
                    {tools.map(tool => (
                        <TouchableOpacity
                            key={tool.name}
                            style={[styles.toolButton, currentTool === tool.name && styles.toolButtonActive]}
                            onPress={() => setCurrentTool(tool.name)}
                        >
                            <Ionicons name={tool.icon as any} size={24} color={currentTool === tool.name ? '#3B82F6' : 'white'} />
                            <Text style={[styles.toolLabel, currentTool === tool.name && styles.toolLabelActive]}>{tool.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.colorPickerContainer}>
                    <Text style={styles.colorPickerLabel}>Color:</Text>
                    <View style={styles.colorPicker}>
                        {colors.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[styles.colorButton, { backgroundColor: color }, currentColor === color && styles.colorButtonActive]}
                                onPress={() => setCurrentColor(color)}
                            >
                                {currentColor === color && (
                                    <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' ? '#000' : '#fff'} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.8)' },
    headerButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    saveButton: { backgroundColor: '#10B981' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: 'white' },
    canvasContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    viewShot: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.6, position: 'relative' },
    image: { width: '100%', height: '100%' },
    svgContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    svg: { flex: 1 },
    toolsPanel: { backgroundColor: 'rgba(0,0,0,0.9)', paddingVertical: 16, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    historyControls: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
    historyButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    historyButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
    toolsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    toolButton: { alignItems: 'center', padding: 8, borderRadius: 8, minWidth: 70 },
    toolButtonActive: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
    toolLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },
    toolLabelActive: { color: '#3B82F6', fontWeight: '600' },
    colorPickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    colorPickerLabel: { color: 'white', fontSize: 14, fontWeight: '600', marginRight: 12 },
    colorPicker: { flexDirection: 'row', gap: 8 },
    colorButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    colorButtonActive: { borderColor: 'white', transform: [{ scale: 1.1 }] },
});
