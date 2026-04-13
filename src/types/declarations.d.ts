declare module '@expo/vector-icons' {
    export const Ionicons: any;
    export const MaterialCommunityIcons: any & { glyphMap: Record<string, number> };
    export const FontAwesome: any;
    export const MaterialIcons: any;
    export const Feather: any;
    export const AntDesign: any;
    export const Entypo: any;
    export const EvilIcons: any;
    export const Foundation: any;
    export const Octicons: any;
    export const SimpleLineIcons: any;
    export const Zocial: any;
}

declare module 'expo-file-system/legacy' {
    export const documentDirectory: string | null;
    export function copyAsync(options: { from: string; to: string }): Promise<void>;
    export function deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;
    export function readAsStringAsync(fileUri: string, options?: any): Promise<string>;
    export function writeAsStringAsync(fileUri: string, contents: string, options?: any): Promise<void>;
    export function getInfoAsync(fileUri: string, options?: any): Promise<any>;
    export function makeDirectoryAsync(fileUri: string, options?: any): Promise<void>;
}

declare module 'react-native-image-zoom-viewer' {
    const ImageViewer: any;
    export default ImageViewer;
}

declare module 'react-native-dropdown-select-list' {
    export const SelectList: any;
}

declare module 'react-native-event-listeners' {
    export const EventRegister: {
        addEventListener: (eventName: string, callback: (...args: any[]) => void) => string;
        removeEventListener: (id: string) => void;
        emit: (eventName: string, ...args: any[]) => void;
    };
}
