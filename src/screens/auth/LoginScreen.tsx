import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import {
    Text,
    TextInput,
    Button,
    Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect } from 'react-native-svg';
import { MainContext } from '../../contexts/MainContextApp';

const MicrosoftIcon = () => (
    <Svg width={20} height={20} viewBox="0 0 21 21">
        <Rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <Rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <Rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <Rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </Svg>
);

interface FormErrors {
    email?: string | null;
    password?: string | null;
}

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const { login, loginWithMicrosoft, isAuthenticated } = useContext(MainContext);

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isMicrosoftLoading, setIsMicrosoftLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (isAuthenticated) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'HomeTabs' }],
            });
        }
    }, [isAuthenticated]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!email.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Ingresa un correo electrónico válido';
        }
        if (!password.trim()) {
            newErrors.password = 'La contraseña es requerida';
        } else if (password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (): Promise<void> => {
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        const result = await login(email, password);

        if (!result.success) {
            Alert.alert(
                'Error de inicio de sesión',
                result.error || 'Por favor verifica tus credenciales',
                [{ text: 'OK' }]
            );
        }
        setIsLoading(false);
    };

    const handleMicrosoftLogin = async (): Promise<void> => {
        setIsMicrosoftLoading(true);
        setErrors({});
        const result = await loginWithMicrosoft();
        if (!result.success) {
            Alert.alert(
                'Error de inicio de sesión',
                result.error || 'No se pudo iniciar sesión con Microsoft',
                [{ text: 'OK' }]
            );
        }
        setIsMicrosoftLoading(false);
    };

    const handleForgotPassword = (): void => {
        if (!email.trim()) {
            Alert.alert(
                'Correo requerido',
                'Por favor ingresa tu correo electrónico primero',
                [{ text: 'OK' }]
            );
            return;
        }
        Alert.alert(
            'Recuperar contraseña',
            `Se enviaron instrucciones de recuperación a ${email}`,
            [{ text: 'OK' }]
        );
    };

    const anyLoading = isLoading || isMicrosoftLoading;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <View style={styles.iconBackground}>
                                <Ionicons name="receipt" size={40} color="#4F46E5" />
                            </View>
                        </View>

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>CORSUSA.com</Text>
                            <Text style={styles.subtitle}>
                                Tu gestión más simple, rápida y segura.
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Correo electrónico"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (errors.email) setErrors({ ...errors, email: null });
                                    }}
                                    mode="outlined"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    left={<TextInput.Icon icon="email-outline" />}
                                    style={styles.textInput}
                                    error={!!errors.email}
                                    disabled={anyLoading}
                                />
                                {errors.email && (
                                    <Text style={styles.errorText}>{errors.email}</Text>
                                )}
                            </View>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    label="Contraseña"
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: null });
                                    }}
                                    mode="outlined"
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                    left={<TextInput.Icon icon="lock-outline" />}
                                    right={
                                        <TextInput.Icon
                                            icon={showPassword ? "eye-off" : "eye"}
                                            onPress={() => setShowPassword(!showPassword)}
                                        />
                                    }
                                    style={styles.textInput}
                                    error={!!errors.password}
                                    disabled={anyLoading}
                                />
                                {errors.password && (
                                    <Text style={styles.errorText}>{errors.password}</Text>
                                )}
                            </View>

                            <View style={styles.forgotContainer}>
                                <Button
                                    mode="text"
                                    onPress={handleForgotPassword}
                                    textColor="#4F46E5"
                                    disabled={anyLoading}
                                    labelStyle={styles.forgotText}
                                >
                                    ¿Olvidaste tu contraseña?
                                </Button>
                            </View>

                            <Button
                                mode="contained"
                                onPress={handleLogin}
                                style={styles.loginButton}
                                labelStyle={styles.loginButtonText}
                                disabled={anyLoading}
                                loading={isLoading}
                            >
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Button>

                            <View style={styles.dividerContainer}>
                                <Divider style={styles.dividerLine} />
                                <Text style={styles.dividerText}>o continúa con</Text>
                                <Divider style={styles.dividerLine} />
                            </View>

                            <Button
                                mode="outlined"
                                onPress={handleMicrosoftLogin}
                                style={styles.microsoftButton}
                                labelStyle={styles.microsoftButtonText}
                                disabled={anyLoading}
                                loading={isMicrosoftLoading}
                                icon={() => !isMicrosoftLoading ? <MicrosoftIcon /> : null}
                            >
                                {isMicrosoftLoading
                                    ? 'Conectando...'
                                    : 'Iniciar sesión con Microsoft'}
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, minHeight: '100%' },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
    iconContainer: { alignItems: 'center', marginBottom: 40 },
    iconBackground: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center' },
    titleContainer: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
    form: { width: '100%' },
    inputContainer: { marginBottom: 20 },
    textInput: { backgroundColor: 'white' },
    errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 12 },
    forgotContainer: { alignItems: 'flex-end', marginBottom: 32, marginTop: -8 },
    forgotText: { fontSize: 14 },
    loginButton: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 4 },
    loginButtonText: { fontSize: 16, fontWeight: '600' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: { marginHorizontal: 12, fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
    microsoftButton: { borderRadius: 12, paddingVertical: 4, borderColor: '#D1D5DB', borderWidth: 1 },
    microsoftButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
