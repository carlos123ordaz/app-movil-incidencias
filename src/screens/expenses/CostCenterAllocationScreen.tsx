import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function CostCenterAllocationScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Asignación de centros de costo</Text>
            <Text style={styles.text}>Esta pantalla todavía no está implementada en esta versión.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    text: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
