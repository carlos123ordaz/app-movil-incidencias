import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

type ToastVariant = 'success' | 'error' | 'info';
type ToastPosition = 'top' | 'bottom';

interface ToastBannerProps {
    visible: boolean;
    message: string | null;
    onHide: () => void;
    duration?: number;
    variant?: ToastVariant;
    position?: ToastPosition;
}

const variantConfig: Record<ToastVariant, { icon: keyof typeof Ionicons.glyphMap; iconColor: string }> = {
    success: { icon: 'checkmark-circle', iconColor: '#DCFCE7' },
    error: { icon: 'close-circle', iconColor: '#FECACA' },
    info: { icon: 'information-circle', iconColor: '#DBEAFE' },
};

export default function ToastBanner({
    visible,
    message,
    onHide,
    duration = 2000,
    variant = 'info',
    position = 'top',
}: ToastBannerProps) {
    useEffect(() => {
        if (!visible || !message) {
            return;
        }

        const timeoutId = setTimeout(() => {
            onHide();
        }, duration);

        return () => clearTimeout(timeoutId);
    }, [visible, message, duration, onHide]);

    if (!visible || !message) {
        return null;
    }

    const currentVariant = variantConfig[variant];

    return (
        <View pointerEvents="none" style={[styles.wrapper, position === 'top' ? styles.top : styles.bottom]}>
            <View style={styles.toast}>
                <Ionicons name={currentVariant.icon} size={18} color={currentVariant.iconColor} />
                <Text style={styles.text}>{message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    top: {
        top: 66,
    },
    bottom: {
        bottom: 28,
    },
    toast: {
        minHeight: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    text: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
