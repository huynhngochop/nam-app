names=open('/home/claude/nam-app/tests/typestubs/feather-names.txt').read().split()
union=' | '.join(f"'{n}'" for n in names)
d='/home/claude/nam-app/tests/typestubs/'
open(d+'react.d.ts','w').write('''declare module 'react' {
  namespace React {
    type ReactNode = any;
    type ReactElement = any;
    type Key = string | number;
    type Ref<T> = any;
    type RefObject<T> = { current: T | null };
    type MutableRefObject<T> = { current: T };
    type ComponentProps<T> = T extends (p: infer P) => any ? P : any;
    type ComponentType<P = {}> = (p: P) => any;
    type FC<P = {}> = (p: P) => any;
    type PropsWithChildren<P = {}> = P & { children?: ReactNode };
    type Dispatch<A> = (a: A) => void;
    type SetStateAction<S> = S | ((prev: S) => S);
    type Context<T> = { Provider: any; Consumer: any };
    type DependencyList = readonly unknown[];
    function useState<S>(init: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
    function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
    function useReducer(...a: any[]): any;
    function useEffect(fn: () => void | (() => void), deps?: DependencyList): void;
    function useLayoutEffect(fn: () => void | (() => void), deps?: DependencyList): void;
    function useMemo<T>(fn: () => T, deps: DependencyList): T;
    function useCallback<T extends (...a: any[]) => any>(fn: T, deps: DependencyList): T;
    function useRef<T>(init: T): MutableRefObject<T>;
    function useRef<T>(init: T | null): RefObject<T>;
    function useRef<T = undefined>(): MutableRefObject<T | undefined>;
    function useContext<T>(c: Context<T>): T;
    function useId(): string;
    function useTransition(): [boolean, (fn: () => void) => void];
    function useDeferredValue<T>(v: T): T;
    function useImperativeHandle(...a: any[]): void;
    function createContext<T>(d: T): Context<T>;
    function memo<T>(c: T, eq?: any): T;
    function forwardRef<R, P = {}>(fn: (props: P, ref: any) => any): (props: P & { ref?: any; key?: any }) => any;
    const Children: { toArray(c: any): any[]; count(c: any): number; map(c: any, fn: (x: any, i: number) => any): any[]; only(c: any): any };
    const Fragment: any;
    const StrictMode: any;
    const Suspense: any;
    function isValidElement(x: any): boolean;
    function cloneElement(...a: any[]): any;
    function createElement(...a: any[]): any;
    function lazy(fn: any): any;
    function startTransition(fn: () => void): void;
  }
  export = React;
}
declare module 'react/jsx-runtime' {
  export namespace JSX {
    type Element = any;
    interface ElementClass { render: any }
    interface ElementAttributesProperty { props: {} }
    interface ElementChildrenAttribute { children: {} }
    interface IntrinsicAttributes { key?: any }
    interface IntrinsicElements { [k: string]: any }
  }
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-runtime';
}
''')
rn_values=['View','Text','Pressable','ScrollView','TextInput','Image','Modal','Animated','Easing','StyleSheet','Platform','AppState','Linking','Share','Alert','Dimensions','Keyboard','KeyboardAvoidingView','ActivityIndicator','FlatList','SectionList','Switch','PanResponder','I18nManager','AccessibilityInfo','Vibration','useColorScheme','useWindowDimensions','LayoutAnimation','UIManager','BackHandler','StatusBar','PixelRatio','InteractionManager','TouchableOpacity','RefreshControl','Appearance','findNodeHandle','NativeModules','NativeEventEmitter','LogBox','AppRegistry','DeviceEventEmitter','ImageBackground','SafeAreaView','Settings','ToastAndroid']
rn_types=['StyleProp','ViewStyle','TextStyle','ImageStyle','TextProps','ViewProps','PressableProps','ScrollViewProps','TextInputProps','ImageSourcePropType','LayoutChangeEvent','GestureResponderEvent','NativeSyntheticEvent','NativeScrollEvent','ColorValue','DimensionValue','AppStateStatus','ListRenderItem','ImageProps','ModalProps','PanResponderInstance','KeyboardTypeOptions','ReturnKeyTypeOptions','AccessibilityRole','TextInputSubmitEditingEventData','LayoutRectangle']
rn='declare module \'react-native\' {\n'
for v in rn_values: rn+=f'  export const {v}: any;\n  export type {v} = any;\n'
for t in rn_types: rn+=f'  export type {t}<T = any> = any;\n'
rn+='}\n'
open(d+'react-native.d.ts','w').write(rn)
open(d+'vector-icons.d.ts','w').write(f'''declare module '@expo/vector-icons' {{
  export type FeatherGlyph = {union};
  export function Feather(p: {{ name: FeatherGlyph; size?: number; color?: string; style?: any }}): any;
  export namespace Feather {{ const glyphMap: Record<FeatherGlyph, number>; }}
  export const MaterialIcons: any;
  export const Ionicons: any;
}}
''')
any_mods={
 'expo-router':['router','Stack','Tabs','Redirect','Link','Slot','useRouter','useSegments','usePathname','useFocusEffect','useNavigation','SplashScreen','ErrorBoundary'],
 'react-native-safe-area-context':['SafeAreaView','SafeAreaProvider','useSafeAreaInsets','initialWindowMetrics'],
 'expo-notifications':['setNotificationHandler','getPermissionsAsync','requestPermissionsAsync','scheduleNotificationAsync','cancelScheduledNotificationAsync','cancelAllScheduledNotificationsAsync','setNotificationChannelAsync','addNotificationResponseReceivedListener','addNotificationReceivedListener','getLastNotificationResponseAsync','AndroidImportance','SchedulableTriggerInputTypes','getAllScheduledNotificationsAsync','dismissAllNotificationsAsync','useLastNotificationResponse'],
 '@shopify/flash-list':['FlashList'],
 'expo-clipboard':['setStringAsync','getStringAsync','hasStringAsync'],
 'expo-sharing':['shareAsync','isAvailableAsync'],
 'expo-haptics':['selectionAsync','impactAsync','notificationAsync','ImpactFeedbackStyle','NotificationFeedbackType'],
 'expo-file-system':['File','Paths','Directory'],
 'expo-keep-awake':['activateKeepAwakeAsync','deactivateKeepAwake','useKeepAwake'],
 'expo-image-picker':['launchImageLibraryAsync','launchCameraAsync','requestCameraPermissionsAsync','requestMediaLibraryPermissionsAsync','MediaTypeOptions'],
 'expo-crypto':['randomUUID','getRandomBytes','digestStringAsync','CryptoDigestAlgorithm'],
 'react-native-svg':['default','Svg','Path','Circle','Rect','Line','Polyline','G','Defs','LinearGradient','Stop','Text'],
 'react-native-qrcode-svg':['default'],
 'react-native-gesture-handler':['GestureHandlerRootView','Gesture','GestureDetector','Swipeable'],
 'expo-status-bar':['StatusBar'],
 'expo-sqlite/kv-store':['default','Storage'],
 'expo-sqlite':['openDatabaseSync','openDatabaseAsync','SQLiteDatabase','SQLiteProvider','useSQLiteContext'],
 'expo-splash-screen':['preventAutoHideAsync','hideAsync','setOptions'],
 'expo-modules-core':['requireOptionalNativeModule','requireNativeModule','EventEmitter'],
 'expo-local-authentication':['authenticateAsync','hasHardwareAsync','isEnrolledAsync','getEnrolledLevelAsync','supportedAuthenticationTypesAsync'],
 'expo-document-picker':['getDocumentAsync'],
 'expo-constants':['default'],
 'expo-camera':['CameraView','useCameraPermissions','Camera'],
 'expo-audio':['createAudioPlayer','setAudioModeAsync','useAudioPlayer','AudioPlayer'],
 '@react-native-community/netinfo':['default','useNetInfo','addEventListener','fetch'],
 '@noble/hashes/sha256':['sha256'],
 '@noble/hashes/pbkdf2':['pbkdf2Async','pbkdf2'],
 '@noble/ciphers/chacha':['xchacha20poly1305','chacha20poly1305'],
 '@expo-google-fonts/be-vietnam-pro':['useFonts','BeVietnamPro_400Regular','BeVietnamPro_500Medium','BeVietnamPro_600SemiBold','BeVietnamPro_700Bold'],
}
SQLITE='''  type Arg = string | number | null | boolean | Uint8Array;
  export interface SQLiteDatabase {
    execSync(sql: string): void;
    runSync(sql: string, params?: Arg[]): { changes: number; lastInsertRowId: number };
    getFirstSync<T>(sql: string, params?: Arg[]): T | null;
    getAllSync<T>(sql: string, params?: Arg[]): T[];
    withTransactionSync(fn: () => void): void;
  }
  export function openDatabaseSync(name: string): SQLiteDatabase;
'''
any_mods['expo-sqlite']=['openDatabaseAsync','SQLiteProvider','useSQLiteContext']
any_mods['expo-modules-core']=['requireNativeModule','EventEmitter']
out=''
for m,names_ in any_mods.items():
    out+=f"declare module '{m}' {{\n"
    for n in names_:
        if n=='default': out+='  const _default: any;\n  export default _default;\n'
        else: out+=f'  export const {n}: any;\n  export type {n} = any;\n'
    if m=='expo-router':
        out+='  export function useLocalSearchParams<T = Record<string, string>>(): T;\n  export function useGlobalSearchParams<T = Record<string, string>>(): T;\n  export type Href = any;\n'
    if m=='expo-sqlite':
        out+=SQLITE
    if m=='react-native-safe-area-context':
        out+="  export type Edge = 'top' | 'right' | 'bottom' | 'left';\n"
    if m=='expo-modules-core':
        out+='  export function requireOptionalNativeModule<T = any>(name: string): T | null;\n'
    out+='}\n'
open(d+'modules.d.ts','w').write(out)
open(d+'zustand.d.ts','w').write('''declare module 'zustand' {
  export type SetState<T> = (partial: Partial<T> | T | ((s: T) => Partial<T> | T), replace?: boolean) => void;
  export type StateCreator<T> = (set: SetState<T>, get: () => T, api: any) => T;
  export interface UseBound<T> {
    (): T;
    <U>(selector: (s: T) => U): U;
    getState(): T;
    setState: SetState<T>;
    subscribe(listener: (s: T, prev: T) => void): () => void;
    persist?: any;
  }
  export function create<T>(): (init: StateCreator<T>) => UseBound<T>;
  export function create<T>(init: StateCreator<T>): UseBound<T>;
}
declare module 'zustand/middleware' {
  import { StateCreator } from 'zustand';
  export function persist<T>(init: StateCreator<T>, opts: { name: string; storage?: any; partialize?: (s: T) => any; onRehydrateStorage?: (s: T) => any; version?: number; migrate?: any }): StateCreator<T>;
  export function createJSONStorage(...a: any[]): any;
}
''')
open(d+'globals.d.ts','w').write('''declare const __DEV__: boolean;
declare const process: { env: Record<string, string | undefined> };
declare function require(id: string): any;
declare function btoa(s: string): string;
declare function atob(s: string): string;
declare class TextEncoder { encode(s: string): Uint8Array }
declare class TextDecoder { decode(b: Uint8Array): string }
declare const console: { log(...a: any[]): void; warn(...a: any[]): void; error(...a: any[]): void };
declare function setTimeout(fn: (...a: any[]) => void, ms?: number): number;
declare function clearTimeout(id: any): void;
declare function setInterval(fn: (...a: any[]) => void, ms?: number): number;
declare function clearInterval(id: any): void;
declare function fetch(url: string, init?: any): Promise<{ ok: boolean; status: number; json(): Promise<any>; text(): Promise<string> }>;
declare class AbortController { signal: any; abort(): void }
declare function requestAnimationFrame(fn: (t: number) => void): number;
declare function cancelAnimationFrame(id: number): void;
declare function queueMicrotask(fn: () => void): void;
''')
print('ok')
