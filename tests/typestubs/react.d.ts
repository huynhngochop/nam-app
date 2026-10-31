declare module 'react' {
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
    const Children: {
      toArray(c: any): any[];
      count(c: any): number;
      map(c: any, fn: (x: any, i: number) => any): any[];
      only(c: any): any;
    };
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
    interface ElementClass {
      render: any;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicAttributes {
      key?: any;
    }
    interface IntrinsicElements {
      [k: string]: any;
    }
  }
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-runtime';
}
