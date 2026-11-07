declare module 'expo-router' {
  export const router: any;
  export type router = any;
  export const Stack: any;
  export type Stack = any;
  export const Tabs: any;
  export type Tabs = any;
  export const Redirect: any;
  export type Redirect = any;
  export const Link: any;
  export type Link = any;
  export const Slot: any;
  export type Slot = any;
  export const useRouter: any;
  export type useRouter = any;
  export const useSegments: any;
  export type useSegments = any;
  export const usePathname: any;
  export type usePathname = any;
  export const useFocusEffect: any;
  export type useFocusEffect = any;
  export const useNavigation: any;
  export type useNavigation = any;
  export const SplashScreen: any;
  export type SplashScreen = any;
  export const ErrorBoundary: any;
  export type ErrorBoundary = any;
  export function useLocalSearchParams<T = Record<string, string>>(): T;
  export function useGlobalSearchParams<T = Record<string, string>>(): T;
  export type Href = any;
}
declare module 'react-native-safe-area-context' {
  export const SafeAreaView: any;
  export type SafeAreaView = any;
  export const SafeAreaProvider: any;
  export type SafeAreaProvider = any;
  export const useSafeAreaInsets: any;
  export type useSafeAreaInsets = any;
  export const initialWindowMetrics: any;
  export type initialWindowMetrics = any;
  export type Edge = 'top' | 'right' | 'bottom' | 'left';
}
declare module 'expo-notifications' {
  export const setNotificationHandler: any;
  export type setNotificationHandler = any;
  export const getPermissionsAsync: any;
  export type getPermissionsAsync = any;
  export const requestPermissionsAsync: any;
  export type requestPermissionsAsync = any;
  export const scheduleNotificationAsync: any;
  export type scheduleNotificationAsync = any;
  export const cancelScheduledNotificationAsync: any;
  export type cancelScheduledNotificationAsync = any;
  export const cancelAllScheduledNotificationsAsync: any;
  export type cancelAllScheduledNotificationsAsync = any;
  export const setNotificationChannelAsync: any;
  export type setNotificationChannelAsync = any;
  export const addNotificationResponseReceivedListener: any;
  export type addNotificationResponseReceivedListener = any;
  export const addNotificationReceivedListener: any;
  export type addNotificationReceivedListener = any;
  export const getLastNotificationResponseAsync: any;
  export type getLastNotificationResponseAsync = any;
  export const AndroidImportance: any;
  export type AndroidImportance = any;
  export const SchedulableTriggerInputTypes: any;
  export type SchedulableTriggerInputTypes = any;
  export const getAllScheduledNotificationsAsync: any;
  export type getAllScheduledNotificationsAsync = any;
  export const dismissAllNotificationsAsync: any;
  export type dismissAllNotificationsAsync = any;
  export const useLastNotificationResponse: any;
  export type useLastNotificationResponse = any;
}
declare module '@shopify/flash-list' {
  export const FlashList: any;
  export type FlashList = any;
}
declare module 'expo-clipboard' {
  export const setStringAsync: any;
  export type setStringAsync = any;
  export const getStringAsync: any;
  export type getStringAsync = any;
  export const hasStringAsync: any;
  export type hasStringAsync = any;
}
declare module 'expo-sharing' {
  export const shareAsync: any;
  export type shareAsync = any;
  export const isAvailableAsync: any;
  export type isAvailableAsync = any;
}
declare module 'expo-haptics' {
  export const selectionAsync: any;
  export type selectionAsync = any;
  export const impactAsync: any;
  export type impactAsync = any;
  export const notificationAsync: any;
  export type notificationAsync = any;
  export const ImpactFeedbackStyle: any;
  export type ImpactFeedbackStyle = any;
  export const NotificationFeedbackType: any;
  export type NotificationFeedbackType = any;
}
declare module 'expo-file-system' {
  export const File: any;
  export type File = any;
  export const Paths: any;
  export type Paths = any;
  export const Directory: any;
  export type Directory = any;
}
declare module 'expo-keep-awake' {
  export const activateKeepAwakeAsync: any;
  export type activateKeepAwakeAsync = any;
  export const deactivateKeepAwake: any;
  export type deactivateKeepAwake = any;
  export const useKeepAwake: any;
  export type useKeepAwake = any;
}
declare module 'expo-image-picker' {
  export const launchImageLibraryAsync: any;
  export type launchImageLibraryAsync = any;
  export const launchCameraAsync: any;
  export type launchCameraAsync = any;
  export const requestCameraPermissionsAsync: any;
  export type requestCameraPermissionsAsync = any;
  export const requestMediaLibraryPermissionsAsync: any;
  export type requestMediaLibraryPermissionsAsync = any;
  export const MediaTypeOptions: any;
  export type MediaTypeOptions = any;
}
declare module 'expo-crypto' {
  export const randomUUID: any;
  export type randomUUID = any;
  export const getRandomBytes: any;
  export type getRandomBytes = any;
  export const digestStringAsync: any;
  export type digestStringAsync = any;
  export const CryptoDigestAlgorithm: any;
  export type CryptoDigestAlgorithm = any;
}
declare module 'react-native-svg' {
  const _default: any;
  export default _default;
  export const Svg: any;
  export type Svg = any;
  export const Path: any;
  export type Path = any;
  export const Circle: any;
  export type Circle = any;
  export const Rect: any;
  export type Rect = any;
  export const Line: any;
  export type Line = any;
  export const Polyline: any;
  export type Polyline = any;
  export const G: any;
  export type G = any;
  export const Defs: any;
  export type Defs = any;
  export const LinearGradient: any;
  export type LinearGradient = any;
  export const Stop: any;
  export type Stop = any;
  export const Text: any;
  export type Text = any;
}
declare module 'react-native-qrcode-svg' {
  const _default: any;
  export default _default;
}
declare module 'react-native-gesture-handler' {
  export const GestureHandlerRootView: any;
  export type GestureHandlerRootView = any;
  export const Gesture: any;
  export type Gesture = any;
  export const GestureDetector: any;
  export type GestureDetector = any;
  export const Swipeable: any;
  export type Swipeable = any;
}
declare module 'expo-status-bar' {
  export const StatusBar: any;
  export type StatusBar = any;
}
declare module 'expo-sqlite/kv-store' {
  const _default: any;
  export default _default;
  export const Storage: any;
  export type Storage = any;
}
declare module 'expo-sqlite' {
  export const openDatabaseAsync: any;
  export type openDatabaseAsync = any;
  export const SQLiteProvider: any;
  export type SQLiteProvider = any;
  export const useSQLiteContext: any;
  export type useSQLiteContext = any;
  type Arg = string | number | null | boolean | Uint8Array;
  export interface SQLiteDatabase {
    execSync(sql: string): void;
    runSync(sql: string, params?: Arg[]): { changes: number; lastInsertRowId: number };
    getFirstSync<T>(sql: string, params?: Arg[]): T | null;
    getAllSync<T>(sql: string, params?: Arg[]): T[];
    withTransactionSync(fn: () => void): void;
  }
  export function openDatabaseSync(name: string): SQLiteDatabase;
}
declare module 'expo-splash-screen' {
  export const preventAutoHideAsync: any;
  export type preventAutoHideAsync = any;
  export const hideAsync: any;
  export type hideAsync = any;
  export const setOptions: any;
  export type setOptions = any;
}
declare module 'expo-modules-core' {
  export const requireNativeModule: any;
  export type requireNativeModule = any;
  export const EventEmitter: any;
  export type EventEmitter = any;
  export function requireOptionalNativeModule<T = any>(name: string): T | null;
}
declare module 'expo-local-authentication' {
  export const authenticateAsync: any;
  export type authenticateAsync = any;
  export const hasHardwareAsync: any;
  export type hasHardwareAsync = any;
  export const isEnrolledAsync: any;
  export type isEnrolledAsync = any;
  export const getEnrolledLevelAsync: any;
  export type getEnrolledLevelAsync = any;
  export const supportedAuthenticationTypesAsync: any;
  export type supportedAuthenticationTypesAsync = any;
}
declare module 'expo-document-picker' {
  export const getDocumentAsync: any;
  export type getDocumentAsync = any;
}
declare module 'expo-constants' {
  const _default: any;
  export default _default;
}
declare module 'expo-camera' {
  export const CameraView: any;
  export type CameraView = any;
  export const useCameraPermissions: any;
  export type useCameraPermissions = any;
  export const Camera: any;
  export type Camera = any;
}
declare module 'expo-audio' {
  export const createAudioPlayer: any;
  export type createAudioPlayer = any;
  export const setAudioModeAsync: any;
  export type setAudioModeAsync = any;
  export const useAudioPlayer: any;
  export type useAudioPlayer = any;
  export const AudioPlayer: any;
  export type AudioPlayer = any;
}
declare module '@react-native-community/netinfo' {
  const _default: any;
  export default _default;
  export const useNetInfo: any;
  export type useNetInfo = any;
  export const addEventListener: any;
  export type addEventListener = any;
  export const fetch: any;
  export type fetch = any;
}
declare module '@noble/hashes/sha256' {
  export const sha256: any;
  export type sha256 = any;
}
declare module '@noble/hashes/pbkdf2' {
  export const pbkdf2Async: any;
  export type pbkdf2Async = any;
  export const pbkdf2: any;
  export type pbkdf2 = any;
}
declare module '@noble/ciphers/chacha' {
  export const xchacha20poly1305: any;
  export type xchacha20poly1305 = any;
  export const chacha20poly1305: any;
  export type chacha20poly1305 = any;
}
declare module '@expo-google-fonts/be-vietnam-pro' {
  export const useFonts: any;
  export type useFonts = any;
  export const BeVietnamPro_400Regular: any;
  export type BeVietnamPro_400Regular = any;
  export const BeVietnamPro_500Medium: any;
  export type BeVietnamPro_500Medium = any;
  export const BeVietnamPro_600SemiBold: any;
  export type BeVietnamPro_600SemiBold = any;
  export const BeVietnamPro_700Bold: any;
  export type BeVietnamPro_700Bold = any;
}
declare module 'expo-speech' {
  export const speak: any;
  export const stop: any;
  export const isSpeakingAsync: any;
  export const getAvailableVoicesAsync: any;
}
declare module 'react-native-reanimated' {
  const Animated: any;
  namespace Animated {
    type ScrollView = any;
  }
  export default Animated;
  export const useSharedValue: any;
  export function useAnimatedRef<T = any>(): any;
  export const useFrameCallback: any;
  export const useAnimatedScrollHandler: any;
  export const scrollTo: any;
  export const runOnJS: any;
  export const runOnUI: any;
}
