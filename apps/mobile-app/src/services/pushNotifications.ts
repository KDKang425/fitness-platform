import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { showToast } from '../utils/Toast';

const PUSH_TOKEN_KEY = 'push_notification_token';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private static instance: PushNotificationService;
  private notificationListener: any;
  private responseListener: any;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize() {
    // Check if we're on a physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return;
    }

    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get push token
    try {
      const token = await this.getExpoPushToken();
      if (token) {
        await this.registerToken(token);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }

    // Set up notification listeners
    this.setupListeners();
  }

  private async getExpoPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });
      return token.data;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  }

  private async registerToken(token: string) {
    try {
      // Check if we already registered this token
      const savedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (savedToken === token) {
        return; // Token already registered
      }

      // Register with backend
      await api.post('/push-notifications/register', {
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Device.deviceName,
      });

      // Save token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  private setupListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // You can customize how to handle different notification types
      const { type } = notification.request.content.data;
      
      switch (type) {
        case 'new_follower':
        case 'post_like':
        case 'friend_request':
          // Could update a badge or show an in-app notification
          break;
        case 'workout_reminder':
          showToast('운동 시간입니다! 💪');
          break;
        case 'personal_record':
          showToast('축하합니다! 새로운 기록을 달성했습니다! 🎉');
          break;
      }
    });

    // Handle user tapping on a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const { type } = response.notification.request.content.data;
      
      // Navigate to appropriate screen based on notification type
      // You'll need to pass navigation prop or use a navigation service
      switch (type) {
        case 'new_follower':
        case 'friend_request':
          // Navigate to social/friends screen
          break;
        case 'post_like':
          // Navigate to the specific post
          break;
        case 'workout_reminder':
          // Navigate to workout start screen
          break;
        case 'personal_record':
          // Navigate to stats/records screen
          break;
      }
    });
  }

  async unregisterToken() {
    try {
      const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      if (token) {
        await api.delete('/push-notifications/unregister', {
          data: { token },
        });
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to unregister push token:', error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Schedule local notifications
  async scheduleWorkoutReminder(time: Date, routineName: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '운동 시간입니다! 💪',
        body: `오늘의 ${routineName} 운동을 시작해보세요.`,
        data: { type: 'workout_reminder' },
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      },
    });
  }

  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export const pushNotifications = PushNotificationService.getInstance();