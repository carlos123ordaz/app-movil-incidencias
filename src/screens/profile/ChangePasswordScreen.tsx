import { useState, useContext } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { MainContext } from '../../contexts/MainContextApp';
import { changePassword } from '../../services/Auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
    const { userData } = useContext(MainContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    const validateForm = (): boolean => {
        if (!currentPassword.trim()) {
            Alert.alert('Error', 'Ingresa tu contraseña actual');
            return false;
        }
        if (!newPassword.trim()) {
            Alert.alert('Error', 'Ingresa una nueva contraseña');
            return false;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
            return false;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return false;
        }
        if (currentPassword === newPassword) {
            Alert.alert('Error', 'La nueva contraseña debe ser diferente a la actual');
            return false;
        }
        return true;
    };

    const handleChangePassword = async (): Promise<void> => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await changePassword(userData!._id, currentPassword, newPassword);

            Alert.alert(
                'Éxito',
                'Contraseña actualizada correctamente',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error al cambiar contraseña:', error);
            const errorMessage = error.response?.data?.error || 'Error al cambiar la contraseña';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>
                        Ingresa tu contraseña actual y elige una nueva.
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contraseña actual</Text>
                        <TextInput
                            style={styles.input}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrentPassword}
                            placeholder="Ingresa tu contraseña actual"
                            placeholderTextColor="#C0C4CC"
                            autoCapitalize="none"
                            mode="outlined"
                            outlineColor="#E5E7EB"
                            activeOutlineColor="#3B82F6"
                            right={
                                <TextInput.Icon
                                    icon={showCurrentPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                />
                            }
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nueva contraseña</Text>
                        <TextInput
                            style={styles.input}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor="#C0C4CC"
                            autoCapitalize="none"
                            mode="outlined"
                            outlineColor="#E5E7EB"
                            activeOutlineColor="#3B82F6"
                            right={
                                <TextInput.Icon
                                    icon={showNewPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                />
                            }
                        />
                        {newPassword.length > 0 && newPassword.length < 6 && (
                            <Text style={styles.helperText}>Mínimo 6 caracteres</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmar nueva contraseña</Text>
                        <TextInput
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            placeholder="Confirma tu nueva contraseña"
                            placeholderTextColor="#C0C4CC"
                            autoCapitalize="none"
                            mode="outlined"
                            outlineColor="#E5E7EB"
                            activeOutlineColor="#3B82F6"
                            right={
                                <TextInput.Icon
                                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                            }
                        />
                        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                            <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
                        )}
                    </View>

                    <View style={styles.requirementsContainer}>
                        <Text style={styles.requirementsTitle}>Requisitos</Text>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={newPassword.length >= 6 ? '#10B981' : '#9CA3AF'}
                            />
                            <Text style={styles.requirementText}>Mínimo 6 caracteres</Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={currentPassword && newPassword !== currentPassword ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={currentPassword && newPassword !== currentPassword ? '#10B981' : '#9CA3AF'}
                            />
                            <Text style={styles.requirementText}>Diferente a la contraseña actual</Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={confirmPassword && newPassword === confirmPassword ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={confirmPassword && newPassword === confirmPassword ? '#10B981' : '#9CA3AF'}
                            />
                            <Text style={styles.requirementText}>Las contraseñas coinciden</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={22} color="white" />
                            <Text style={styles.saveButtonText}>Guardar cambios</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollView: { flex: 1 },
    contentContainer: { paddingBottom: 100 },
    header: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 8 },
    headerSubtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    formContainer: {
        backgroundColor: 'white',
        marginTop: 8,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: 'white' },
    helperText: { fontSize: 12, color: '#F59E0B', marginTop: 4, marginLeft: 4 },
    errorText: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 4 },
    requirementsContainer: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 14, marginTop: 4 },
    requirementsTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12 },
    requirement: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    requirementText: { fontSize: 13, color: '#6B7280', marginLeft: 8 },
    footer: {
        position: 'absolute',
        bottom: 35,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: { backgroundColor: '#9CA3AF' },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
});
