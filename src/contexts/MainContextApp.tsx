import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState, useRef, ReactNode } from 'react';
import { login as loginService, microsoftLogin as microsoftLoginService } from '../services/Auth';
import { savePushToken } from '../services/User';
import { useNavigation } from '@react-navigation/native';
import { getMessaging, getToken, onMessage, onNotificationOpenedApp, getInitialNotification } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MainContextType, User, LoginResult } from '../types';

export const MainContext = createContext<MainContextType>({} as MainContextType);

interface MainContextAppProps {
  children: ReactNode;
}

export const MainContextApp = ({ children }: MainContextAppProps) => {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<User | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const messaging = getMessaging();
  const listenersConfigured = useRef<boolean>(false);

  const refreshUserData = async (): Promise<void> => {
    try {
      const userId = userData?._id || (userData as any)?.userId;
      if (!userId) return;
      const { getUserService } = require('../services/User');
      const response = await getUserService(userId);
      const updatedUser: User = response.data;
      setUserData(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  };

  const setupNotifications = async (userId: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'android') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            return null;
          }
        }
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('incidencias', {
          name: 'Incidencias',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      const fcmToken = await getToken(messaging);
      await savePushToken(userId, fcmToken);
      await AsyncStorage.setItem('fcmToken', fcmToken);

      if (!listenersConfigured.current) {
        setupNotificationListeners();
        listenersConfigured.current = true;
      }

      return fcmToken;
    } catch (error) {
      console.error('❌ Error al configurar notificaciones:', JSON.stringify(error));
      return null;
    }
  };

  const setupNotificationListeners = (): (() => void) => {
    const unsubscribeForeground = onMessage(messaging, async (remoteMessage) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'Nueva notificación',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    });

    const unsubscribeBackground = onNotificationOpenedApp(messaging, (remoteMessage) => {
      handleNotificationNavigation(remoteMessage.data as Record<string, string>);
    });

    getInitialNotification(messaging).then((remoteMessage) => {
      if (remoteMessage) {
        handleNotificationNavigation(remoteMessage.data as Record<string, string>);
      }
    });

    const notificationListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationNavigation(response.notification.request.content.data as Record<string, string>);
      }
    );

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      notificationListener.remove();
    };
  };

  const handleNotificationNavigation = (data: Record<string, string>): void => {
    if (data?.type === 'incidencia_revision' && data?.incidenciaId) {
      navigation.navigate('DetalleIncidencia', { id: data.incidenciaId });
    }
  };

  const completeAuthentication = async (accessToken: string, refreshToken: string, user: User): Promise<void> => {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['user', JSON.stringify(user)]
    ]);

    setUserData(user);
    setIsAuthenticated(true);

    const cachedToken = await AsyncStorage.getItem('fcmToken');
    if (!cachedToken) {
      await setupNotifications(user._id);
    } else if (!listenersConfigured.current) {
      setupNotificationListeners();
      listenersConfigured.current = true;
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      const userString = await AsyncStorage.getItem('user');
      const storedTaskId = await AsyncStorage.getItem('taskId');

      if (accessToken && userString) {
        const user: User = JSON.parse(userString);
        setUserData(user);
        setIsAuthenticated(true);
        setTaskId(storedTaskId);

        const cachedToken = await AsyncStorage.getItem('fcmToken');
        if (!cachedToken) {
          await setupNotifications(user._id);
        } else {
          if (!listenersConfigured.current) {
            setupNotificationListeners();
            listenersConfigured.current = true;
          }
        }
      } else {
        setUserData(null);
        setIsAuthenticated(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }],
        });
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setUserData(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (correo: string, password: string): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await loginService(correo, password);
      const { accessToken, refreshToken, user } = response.data;

      await completeAuthentication(accessToken, refreshToken, user);

      return { success: true };
    } catch (error: any) {
      console.error('Error en login:', JSON.stringify(error));
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async (): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const { accessToken, refreshToken, user } = await microsoftLoginService();

      await completeAuthentication(accessToken, refreshToken, user);

      return { success: true };
    } catch (error: any) {
      console.error('Error en Microsoft login:', error);
      const errorMessage = error.message || 'Error al iniciar sesión con Microsoft';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'user',
        'task',
        'taskId'
      ]);

      setUserData(null);
      setTaskId(null);
      setIsAuthenticated(false);
      setError(null);

      navigation.reset({
        index: 0,
        routes: [{ name: 'login' }],
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <MainContext.Provider
      value={{
        userData,
        taskId,
        isLoading,
        isAuthenticated,
        error,
        setTaskId,
        refreshUserData,
        login: handleLogin,
        loginWithMicrosoft: handleMicrosoftLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </MainContext.Provider>
  );
};
