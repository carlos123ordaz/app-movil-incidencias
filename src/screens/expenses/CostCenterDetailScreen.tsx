<<<<<<< HEAD
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function CostCenterDetailScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Centro de costo</Text>
            <Text style={styles.text}>Esta pantalla todavía no está implementada en esta versión.</Text>
        </View>
=======
import { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSubCostCenters } from '../../services/SubCostCenter';
import { getSubSubCostCenters } from '../../services/SubSubCostCenter';

export default function CostCenterDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { costCenterId, subCostCenterId } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [costCenters, setCostCenters] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [costCenterId, subCostCenterId]);

    const loadData = async () => {
        try {
            setLoading(true);
            let response;
            if (costCenterId !== undefined) {
                // Mostrar sub centros de costo del centro padre
                response = await getSubCostCenters(costCenterId);
            } else {
                // Mostrar sub sub centros de costo (filtrado por subCostCenterId si se provee)
                response = await getSubSubCostCenters(subCostCenterId);
            }
            setCostCenters(response.data);
        } catch (error) {
            console.error('Error al cargar centros de costo:', error);
            Alert.alert('Error', 'No se pudieron cargar los centros de costo');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Centros de Costo</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Centros de Costo</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {costCenters.length > 0 ? (
                    costCenters.map((cc, index) => (
                        <View key={cc.subSubCostCenterId ?? cc.subCostCenterId ?? index} style={styles.card}>

                            <View style={styles.cardBody}>
                                <View style={styles.codeContainer}>
                                    <Ionicons
                                        name="pricetag"
                                        size={18}
                                        color="#6B7280"
                                    />
                                    <Text style={styles.codeLabel}>Código:</Text>
                                    <Text style={styles.codeValue}>{cc.shortName}</Text>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.descriptionContainer}>
                                    <View style={styles.descriptionHeader}>
                                        <Ionicons
                                            name="document-text"
                                            size={18}
                                            color="#6B7280"
                                        />
                                        <Text style={styles.descriptionLabel}>
                                            Descripción
                                        </Text>
                                    </View>
                                    <Text style={styles.descriptionText}>
                                        {cc.descrip || 'Sin descripción disponible'}
                                    </Text>
                                </View>
                                {cc.comment && (
                                    <>
                                        <View style={styles.divider} />
                                        <View style={styles.commentContainer}>
                                            <View style={styles.commentHeader}>
                                                <Ionicons
                                                    name="chatbox-ellipses"
                                                    size={18}
                                                    color="#3B82F6"
                                                />
                                                <Text style={styles.commentLabel}>
                                                    Comentario
                                                </Text>
                                            </View>
                                            <View style={styles.commentBox}>
                                                <Text style={styles.commentText}>
                                                    {cc.comment}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            No hay centros de costo
                        </Text>
                        <Text style={styles.emptyText}>
                            No se encontraron centros de costo en este nivel
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
    );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    text: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
=======
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardBody: {
        padding: 16,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    codeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    codeValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 14,
    },
    descriptionContainer: {
        gap: 8,
    },
    descriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    descriptionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    descriptionText: {
        fontSize: 15,
        color: '#111827',
        lineHeight: 22,
    },
    commentContainer: {
        gap: 10,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    commentLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    commentBox: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#3B82F6',
    },
    commentText: {
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
