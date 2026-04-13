// components/AppLoader.tsx
import React, { useContext, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { MainContext } from '../contexts/MainContextApp';
import type { IMainContext } from '../types';

interface AppLoaderProps {
    children: ReactNode;
}

export default function AppLoader({ children }: AppLoaderProps) {
    const { isLoading } = useContext(MainContext);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
});
