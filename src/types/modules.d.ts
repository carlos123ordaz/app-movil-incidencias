declare module '@expo/vector-icons' {
    export const Ionicons: any;
    export const MaterialCommunityIcons: any;
}

declare module 'moment/locale/es';

declare module 'expo-file-system/legacy' {
    export const documentDirectory: string | null;
    export function copyAsync(options: { from: string; to: string }): Promise<void>;
}
