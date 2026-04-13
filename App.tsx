<<<<<<< HEAD
=======
import React from 'react';
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import { customTheme } from './src/theme/customTheme';
import { MainContextApp } from './src/contexts/MainContextApp';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

<<<<<<< HEAD
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
            <NavigationContainer>
                <MainContextApp>
                    <RootNavigator />
                </MainContextApp>
            </NavigationContainer>
        </PaperProvider>
    );
}
=======
const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async () => {
  return Promise.resolve();
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  return (
    <PaperProvider theme={customTheme}>
      <NavigationContainer>
        <MainContextApp>
          <RootNavigator />
        </MainContextApp>
      </NavigationContainer>
    </PaperProvider>
  );
}
>>>>>>> d9e99e8c4a77c0e13dbe933a1c04802438ee52a9
