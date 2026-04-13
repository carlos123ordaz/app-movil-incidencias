import { useContext, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    RefreshControl,
    Linking,
} from 'react-native';
import {
    Text,
    Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { MainContext } from '../../contexts/MainContextApp';
import { useNavigation } from '@react-navigation/native';
<<<<<<< HEAD
import { UserArea } from '../../types';

interface MenuItemProps {
    icon: string;
    title: string;
    onPress: () => void;
    color?: string;
}

interface InfoItemProps {
    icon: string;
    title: string;
    subtitle?: string;
}

export default function ProfileScreen() {
    const { userData, refreshUserData, logout } = useContext(MainContext);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const navigation = useNavigation<any>();

    const onRefresh = async (): Promise<void> => {
=======
import type { IMainContext } from '../../types';

export default function ProfileScreen() {
    const { userData, refreshUserData, logout } = useContext(MainContext) as IMainContext;
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<any>()
    const onRefresh = async () => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        setRefreshing(true);
        try {
            if (refreshUserData) {
                await refreshUserData();
            }
        } catch (error) {
            alert('Error al actualizar datos');
        } finally {
            setRefreshing(false);
        }
    };

<<<<<<< HEAD
    const handleLogout = (): void => {
=======
    const handleLogout = () => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
<<<<<<< HEAD
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: () => { logout(); },
=======
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                    },
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                },
            ]
        );
    };

<<<<<<< HEAD
    const getAreaNames = (): string => {
=======
    // Función para obtener los nombres de las áreas
    const getAreaNames = () => {
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        if (!userData?.areas || userData.areas.length === 0) {
            return 'No asignado';
        }

<<<<<<< HEAD
        if (typeof userData.areas[0] === 'object' && (userData.areas[0] as UserArea)?.name) {
            return (userData.areas as UserArea[]).map(area => area.name).join(' - ');
        }

        if (typeof userData.areas[0] === 'string') {
            return (userData.areas as string[]).join(' - ');
=======
        // Si areas es un array de objetos con propiedad name
        if (typeof userData.areas[0] === 'object' && userData.areas[0]?.name) {
            return userData.areas.map(area => (area as { name: string }).name).join(' - ');
        }

        // Si areas es un array de strings
        if (typeof userData.areas[0] === 'string') {
            return userData.areas.join(' - ');
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
        }

        return 'No asignado';
    };

<<<<<<< HEAD
    const MenuItem = ({ icon, title, onPress, color = '#374151' }: MenuItemProps) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                <Ionicons name={icon as any} size={22} color="#6B7280" />
=======
    const MenuItem = ({ icon, title, onPress, color = '#374151' }: { icon: string; title: string; onPress: () => void; color?: string }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                <Ionicons name={icon} size={22} color="#6B7280" />
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            </View>
            <Text style={[styles.menuText, { color }]}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

<<<<<<< HEAD
    const InfoItem = ({ icon, title, subtitle }: InfoItemProps) => (
        <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
                <Ionicons name={icon as any} size={20} color="#3B82F6" />
=======
    const InfoItem = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
        <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
                <Ionicons name={icon} size={20} color="#3B82F6" />
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoSubtitle}>{subtitle || 'No disponible'}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView
            refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} />}
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
<<<<<<< HEAD
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {userData?.photo ? (
                        <Image source={{ uri: userData.photo }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {userData?.name?.charAt(0)?.toUpperCase() || ''}
                                {userData?.lname?.charAt(0)?.toUpperCase() || ''}
=======
            {/* Header con foto y datos principales */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {userData?.photoUrl ? (
                        <Image
                            source={{ uri: userData.photoUrl }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {userData?.initials || `${userData?.name?.charAt(0)?.toUpperCase() || ''}${userData?.lastName?.charAt(0)?.toUpperCase() || ''}`}
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.userName}>
<<<<<<< HEAD
                    {userData?.name && userData?.lname
                        ? `${userData.name} ${userData.lname}`
=======
                    {userData?.name && userData?.lastName
                        ? `${userData.name} ${userData.lastName}`
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                        : 'Usuario'}
                </Text>
                <Text style={styles.userEmail}>{userData?.email || 'Sin email'}</Text>
            </View>

<<<<<<< HEAD
            <View style={styles.section}>
                <InfoItem icon="briefcase-outline" title="Departamento" subtitle={getAreaNames()} />
                <InfoItem icon="person-outline" title="Cargo" subtitle={userData?.position} />
                <InfoItem icon="call-outline" title="Teléfono" subtitle={userData?.phone} />
                <InfoItem icon="card-outline" title="DNI" subtitle={userData?.dni} />
            </View>

=======
            {/* Información adicional */}
            <View style={styles.section}>
                <InfoItem
                    icon="briefcase-outline"
                    title="Departamento"
                    subtitle={getAreaNames()}
                />
                <InfoItem
                    icon="person-outline"
                    title="Cargo"
                    subtitle={userData?.jobTitle}
                />
                <InfoItem
                    icon="call-outline"
                    title="Teléfono"
                    subtitle={userData?.phone}
                />
                <InfoItem
                    icon="card-outline"
                    title="DNI"
                    subtitle={userData?.dni}
                />
            </View>

            {/* Menú de cuenta */}
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cuenta</Text>
                <View style={styles.menuContainer}>
                    <MenuItem
                        icon="create-outline"
                        title="Editar Perfil"
                        onPress={() => {
<<<<<<< HEAD
                            Alert.alert('Funcionalidad no disponible', 'Esta funcionalidad no está disponible en este momento.');
=======
                            Alert.alert(
                                'Funcionalidad no disponible',
                                'Esta funcionalidad no está disponible en este momento.'
                            );
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                        }}
                    />
                    <Divider />
                    <MenuItem
                        icon="lock-closed-outline"
                        title="Cambiar Contraseña"
<<<<<<< HEAD
                        onPress={() => { navigation.navigate('ChangePassword'); }}
=======
                        onPress={() => {
                            navigation.navigate('ChangePassword');
                        }}
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                    />
                </View>
            </View>

<<<<<<< HEAD
=======
            {/* Configuración */}
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configuración</Text>
                <View style={styles.menuContainer}>
                    <MenuItem
                        icon="notifications-outline"
                        title="Gestionar Notificaciones"
                        onPress={() => {
<<<<<<< HEAD
                            Alert.alert('Funcionalidad no disponible', 'Esta funcionalidad no está disponible en este momento.');
=======
                            Alert.alert(
                                'Funcionalidad no disponible',
                                'Esta funcionalidad no está disponible en este momento.'
                            );
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                        }}
                    />
                </View>
            </View>

<<<<<<< HEAD
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
=======
            {/* Botón de cerrar sesión */}
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { backgroundColor: 'white', alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB', marginBottom: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: { backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 36, fontWeight: '700', color: 'white' },
    userName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#6B7280' },
    section: { marginTop: 16 },
    infoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    infoIconContainer: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    infoTextContainer: { flex: 1 },
    infoTitle: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    infoSubtitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, paddingVertical: 12 },
    menuContainer: { backgroundColor: 'white' },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
    menuIconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    menuText: { flex: 1, fontSize: 15, fontWeight: '500' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', marginHorizontal: 20, marginTop: 24, paddingVertical: 16, borderRadius: 12, gap: 8 },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
    bottomSpacer: { height: 32 },
});
=======
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: 'white',
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E5E7EB',
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: 'white',
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        marginTop: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    infoSubtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    menuContainer: {
        backgroundColor: 'white',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    bottomSpacer: {
        height: 32,
    },
});
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
