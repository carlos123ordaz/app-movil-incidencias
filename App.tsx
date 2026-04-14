import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import { customTheme } from './src/theme/customTheme';
import { MainContextApp } from './src/contexts/MainContextApp';
import { ToastProvider } from './src/contexts/ToastContext';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

// ✅ API modular
const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async (_remoteMessage) => {
  return Promise.resolve();
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  return (
    <PaperProvider theme={customTheme}>
      <ToastProvider>
        <NavigationContainer>
          <MainContextApp>
            <RootNavigator />
          </MainContextApp>
        </NavigationContainer>
      </ToastProvider>
    </PaperProvider>
  );
}
