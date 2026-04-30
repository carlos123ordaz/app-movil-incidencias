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
import { useToast } from '../../contexts/ToastContext';
import { UserArea } from '../../types';

interface TappableInfoItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
}

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
    const { toastError, toastInfo } = useToast();

    const onRefresh = async (): Promise<void> => {
        setRefreshing(true);
        try {
            if (refreshUserData) {
                await refreshUserData();
            }
        } catch (error) {
            toastError('Error al actualizar datos');
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = (): void => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: () => { logout(); },
                },
            ]
        );
    };

    const getAreaNames = (): string => {
        if (!userData?.areas || userData.areas.length === 0) {
            return 'No asignado';
        }

        if (typeof userData.areas[0] === 'object' && (userData.areas[0] as UserArea)?.name) {
            return (userData.areas as UserArea[]).map(area => area.name).join(' - ');
        }

        if (typeof userData.areas[0] === 'string') {
            return (userData.areas as string[]).join(' - ');
        }

        return 'No asignado';
    };

    const MenuItem = ({ icon, title, onPress, color = '#374151' }: MenuItemProps) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                <Ionicons name={icon as any} size={22} color="#6B7280" />
            </View>
            <Text style={[styles.menuText, { color }]}>{title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    const InfoItem = ({ icon, title, subtitle }: InfoItemProps) => (
        <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
                <Ionicons name={icon as any} size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoSubtitle}>{subtitle || 'No disponible'}</Text>
            </View>
        </View>
    );

    const TappableInfoItem = ({ icon, title, subtitle, onPress }: TappableInfoItemProps) => (
        <TouchableOpacity style={styles.infoItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.infoIconContainer}>
                <Ionicons name={icon as any} size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoSubtitle}>{subtitle || 'Sin sede asignada'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <ScrollView
            refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} />}
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {userData?.photo ? (
                        <Image source={{ uri: userData.photo }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {userData?.name?.charAt(0)?.toUpperCase() || ''}
                                {userData?.lname?.charAt(0)?.toUpperCase() || ''}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.userName}>
                    {userData?.name && userData?.lname
                        ? `${userData.name} ${userData.lname}`
                        : 'Usuario'}
                </Text>
                <Text style={styles.userEmail}>{userData?.email || 'Sin email'}</Text>
            </View>

            <View style={styles.section}>
                <InfoItem icon="briefcase-outline" title="Departamento" subtitle={getAreaNames()} />
                <InfoItem icon="person-outline" title="Cargo" subtitle={userData?.position} />
                <InfoItem icon="call-outline" title="Teléfono" subtitle={userData?.phone} />
                <InfoItem icon="card-outline" title="DNI" subtitle={userData?.dni} />
                <TappableInfoItem
                    icon="location-outline"
                    title="Sede Actual"
                    subtitle={typeof userData?.sede === 'object' && userData?.sede?.nombre
                        ? userData.sede.nombre
                        : undefined}
                    onPress={() => navigation.navigate('RegisterSede')}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cuenta</Text>
                <View style={styles.menuContainer}>
                    <MenuItem
                        icon="create-outline"
                        title="Editar Perfil"
                        onPress={() => {
                            toastInfo('Esta funcionalidad no está disponible en este momento.');
                        }}
                    />
                    <Divider />
                    <MenuItem
                        icon="lock-closed-outline"
                        title="Cambiar Contraseña"
                        onPress={() => { navigation.navigate('ChangePassword'); }}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configuración</Text>
                <View style={styles.menuContainer}>
                    <MenuItem
                        icon="notifications-outline"
                        title="Gestionar Notificaciones"
                        onPress={() => {
                            toastInfo('Esta funcionalidad no está disponible en este momento.');
                        }}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
