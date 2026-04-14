import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import ToastBanner from '../components/ToastBanner';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
    message: string | null;
    variant: ToastVariant;
    duration: number;
}

interface ToastContextValue {
    showToast: (message?: string, variant?: ToastVariant, duration?: number) => void;
    toastInfo: (message?: string, duration?: number) => void;
    toastSuccess: (message?: string, duration?: number) => void;
    toastError: (message?: string, duration?: number) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastState>({
        message: null,
        variant: 'info',
        duration: 2200,
    });

    const hideToast = useCallback(() => {
        setToast((current) => ({ ...current, message: null }));
    }, []);

    const showToast = useCallback((message?: string, variant: ToastVariant = 'info', duration = 2200) => {
        if (!message) {
            return;
        }

        setToast({
            message,
            variant,
            duration,
        });
    }, []);

    const value = useMemo<ToastContextValue>(() => ({
        showToast,
        toastInfo: (message, duration) => showToast(message, 'info', duration),
        toastSuccess: (message, duration) => showToast(message, 'success', duration),
        toastError: (message, duration) => showToast(message, 'error', duration),
        hideToast,
    }), [hideToast, showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastBanner
                visible={!!toast.message}
                message={toast.message}
                onHide={hideToast}
                duration={toast.duration}
                variant={toast.variant}
                position="top"
            />
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}
